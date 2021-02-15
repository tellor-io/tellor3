pragma solidity 0.7.4;

import "./TellorStorage.sol";
import "./TellorTransfer.sol";
import "./Utilities.sol";

/**
 * title Tellor Stake
 * @dev Contains the methods related to miners staking and unstaking. Tellor.sol
 * references this library for function's logic.
 */

contract TellorStake is TellorStorage {
    event NewStake(address indexed _sender); //Emits upon new staker
    event StakeWithdrawn(address indexed _sender); //Emits when a staker is now no longer staked
    event StakeWithdrawRequested(address indexed _sender); //Emits when a staker begins the 7 day withdraw period

    /*Functions*/
    /**
     * @dev This function allows stakers to request to withdraw their stake (no longer stake)
     * once they lock for withdraw(stakes.currentStatus = 2) they are locked for 7 days before they
     * can withdraw the deposit
     */
    function requestStakingWithdraw() public {
        TellorStorage.StakeInfo storage stakes = stakerDetails[msg.sender];
        //Require that the miner is staked
        require(stakes.currentStatus == 1, "Miner is not staked");

        //Change the miner staked to locked to be withdrawStake
        stakes.currentStatus = 2;

        //Change the startDate to now since the lock up period begins now
        //and the miner can only withdraw 7 days later from now(check the withdraw function)
        stakes.startDate = now - (now % 86400);

        //Reduce the staker count
        uints[keccak256("stakerCount")] -= 1;

        //Update the minimum dispute fee that is based on the number of stakers
        TellorDispute.updateMinDisputeFee(self);
        emit StakeWithdrawRequested(msg.sender);
    }

    /**
     * @dev This function allows users to withdraw their stake after a 7 day waiting period from request
     */
    function withdrawStake() public {
        TellorStorage.StakeInfo storage stakes = stakerDetails[msg.sender];
        //Require the staker has locked for withdraw(currentStatus ==2) and that 7 days have
        //passed by since they locked for withdraw
        require(
            now - (now % 86400) - stakes.startDate >= 7 days,
            "7 days didn't pass"
        );
        require(
            stakes.currentStatus == 2,
            "Miner was not locked for withdrawal"
        );
        stakes.currentStatus = 0;
        emit StakeWithdrawn(msg.sender);
    }

    /**
     * @dev This function allows miners to deposit their stake.
     */
    function depositStake() public {
        newStake(msg.sender);
        //self adjusting disputeFee
        TellorDispute.updateMinDisputeFee(self);
    }

    /**
     * @dev This function is used by the init function to successfully stake the initial 5 miners.
     * The function updates their status/state and status start date so they are locked it so they can't withdraw
     * and updates the number of stakers in the system.
     */
    function newStake(address _staker) internal {
        require(
            TellorTransfer.balanceOf(self, staker) >=
                uints[keccak256("stakeAmount")],
            "Balance is lower than stake amount"
        );
        //Ensure they can only stake if they are not currently staked or if their stake time frame has ended
        //and they are currently locked for withdraw
        require(
            stakerDetails[_staker].currentStatus == 0 ||
                stakerDetails[_staker].currentStatus == 2,
            "Miner is in the wrong state"
        );
        self.uintVars[keccak256("stakerCount")] += 1;
        self.stakerDetails[_staker] = TellorStorage.StakeInfo({
            currentStatus: 1, //this resets their stake start date to today
            startDate: now - (now % 86400)
        });
        emit NewStake(_staker);
    }

    function getNewCurrentVariables()
        internal
        view
        returns (
            bytes32 _challenge,
            uint256[5] memory _requestIds,
            uint256 _difficulty,
            uint256 _tip
        )
    {
        for (uint256 i = 0; i < 5; i++) {
            _requestIds[i] = currentMiners[i].value;
        }
        return (
            self.currentChallenge,
            _requestIds,
            uints[keccak256("difficulty")],
            uints[keccak256("currentTotalTips")]
        );
    }

    /**
     * @dev Getter function for next requestId on queue/request with highest payout at time the function is called
     * @return idsOnDeck tipsOnDeck onDeck/info on top 5 requests(highest payout)-- RequestId, TotalTips
     */
    function getNewVariablesOnDeck(
        TellorStorage.TellorStorageStruct storage self
    )
        internal
        view
        returns (uint256[5] memory idsOnDeck, uint256[5] memory tipsOnDeck)
    {
        idsOnDeck = getTopRequestIDs(self);
        for (uint256 i = 0; i < 5; i++) {
            tipsOnDeck[i] = self.requestDetails[idsOnDeck[i]].apiUintVars[
                keccak256("totalTip")
            ];
        }
    }

    /**
     * @dev Getter function for the top 5 requests with highest payouts. This function is used within the getNewVariablesOnDeck function
     * @return _requestIds uint256[5] is an array with the top 5(highest payout) _requestIds at the time the function is called
     */
    function getTopRequestIDs()
        internal
        view
        returns (uint256[5] memory _requestIds)
    {
        uint256[5] memory _max;
        uint256[5] memory _index;
        (_max, _index) = Utilities.getMax5(self.requestQ);
        for (uint256 i = 0; i < 5; i++) {
            if (_max[i] != 0) {
                _requestIds[i] = self.requestIdByRequestQIndex[_index[i]];
            } else {
                _requestIds[i] = self.currentMiners[4 - i].value;
            }
        }
    }
}

/**
 * @title Tellor Dispute
 * @dev Contains the methods related to disputes. Tellor.sol references this library for function's logic.
 */

contract TellorDispute {
    using SafeMath for uint256;
    using SafeMath for int256;

    //emitted when a new dispute is initialized
    event NewDispute(
        uint256 indexed _disputeId,
        uint256 indexed _requestId,
        uint256 _timestamp,
        address _miner
    );
    //emitted when a new vote happens
    event Voted(
        uint256 indexed _disputeID,
        bool _position,
        address indexed _voter,
        uint256 indexed _voteWeight
    );
    //emitted upon dispute tally
    event DisputeVoteTallied(
        uint256 indexed _disputeID,
        int256 _result,
        address indexed _reportedMiner,
        address _reportingParty,
        bool _active
    );
    event NewTellorAddress(address _newTellor); //emitted when a proposed fork is voted true

    /*Functions*/

    /**
     * @dev Helps initialize a dispute by assigning it a disputeId
     * when a miner returns a false on the validate array(in Tellor.ProofOfWork) it sends the
     * invalidated value information to POS voting
     * @param _requestId being disputed
     * @param _timestamp being disputed
     * @param _minerIndex the index of the miner that submitted the value being disputed. Since each official value
     * requires 5 miners to submit a value.
     */
    function beginDispute(
        TellorStorage.TellorStorageStruct storage self,
        uint256 _requestId,
        uint256 _timestamp,
        uint256 _minerIndex
    ) public {
        TellorStorage.Request storage _request =
            self.requestDetails[_requestId];
        require(_request.minedBlockNum[_timestamp] != 0, "Mined block is 0");
        require(_minerIndex < 5, "Miner index is wrong");

        //_miner is the miner being disputed. For every mined value 5 miners are saved in an array and the _minerIndex
        //provided by the party initiating the dispute
        address _miner = _request.minersByValue[_timestamp][_minerIndex];
        bytes32 _hash =
            keccak256(abi.encodePacked(_miner, _requestId, _timestamp));

        //Increase the dispute count by 1
        uint256 disputeId = self.uintVars[keccak256("disputeCount")] + 1;
        self.uintVars[keccak256("disputeCount")] = disputeId;

        //Sets the new disputeCount as the disputeId

        //Ensures that a dispute is not already open for the that miner, requestId and timestamp
        uint256 hashId = self.disputeIdByDisputeHash[_hash];
        if (hashId != 0) {
            self.disputesById[disputeId].disputeUintVars[
                keccak256("origID")
            ] = hashId;
        } else {
            self.disputeIdByDisputeHash[_hash] = disputeId;
            hashId = disputeId;
        }
        uint256 origID = hashId;
        uint256 dispRounds =
            self.disputesById[origID].disputeUintVars[
                keccak256("disputeRounds")
            ] + 1;
        self.disputesById[origID].disputeUintVars[
            keccak256("disputeRounds")
        ] = dispRounds;
        self.disputesById[origID].disputeUintVars[
            keccak256(abi.encode(dispRounds))
        ] = disputeId;
        if (disputeId != origID) {
            uint256 lastID =
                self.disputesById[origID].disputeUintVars[
                    keccak256(abi.encode(dispRounds - 1))
                ];
            require(
                self.disputesById[lastID].disputeUintVars[
                    keccak256("minExecutionDate")
                ] <= now,
                "Dispute is already open"
            );
            if (self.disputesById[lastID].executed) {
                require(
                    now -
                        self.disputesById[lastID].disputeUintVars[
                            keccak256("tallyDate")
                        ] <=
                        1 days,
                    "Time for voting haven't elapsed"
                );
            }
        }
        uint256 _fee;
        if (_minerIndex == 2) {
            self.requestDetails[_requestId].apiUintVars[
                keccak256("disputeCount")
            ] =
                self.requestDetails[_requestId].apiUintVars[
                    keccak256("disputeCount")
                ] +
                1;
            //update dispute fee for this case
            _fee =
                self.uintVars[keccak256("stakeAmount")] *
                self.requestDetails[_requestId].apiUintVars[
                    keccak256("disputeCount")
                ];
        } else {
            _fee = self.uintVars[keccak256("disputeFee")] * dispRounds;
        }

        //maps the dispute to the Dispute struct
        self.disputesById[disputeId] = TellorStorage.Dispute({
            hash: _hash,
            isPropFork: false,
            reportedMiner: _miner,
            reportingParty: msg.sender,
            proposedForkAddress: address(0),
            executed: false,
            disputeVotePassed: false,
            tally: 0
        });

        //Saves all the dispute variables for the disputeId
        self.disputesById[disputeId].disputeUintVars[
            keccak256("requestId")
        ] = _requestId;
        self.disputesById[disputeId].disputeUintVars[
            keccak256("timestamp")
        ] = _timestamp;
        self.disputesById[disputeId].disputeUintVars[
            keccak256("value")
        ] = _request.valuesByTimestamp[_timestamp][_minerIndex];
        self.disputesById[disputeId].disputeUintVars[
            keccak256("minExecutionDate")
        ] = now + 2 days * dispRounds;
        self.disputesById[disputeId].disputeUintVars[
            keccak256("blockNumber")
        ] = block.number;
        self.disputesById[disputeId].disputeUintVars[
            keccak256("minerSlot")
        ] = _minerIndex;
        self.disputesById[disputeId].disputeUintVars[keccak256("fee")] = _fee;
        TellorTransfer.doTransfer(self, msg.sender, address(this), _fee);

        //Values are sorted as they come in and the official value is the median of the first five
        //So the "official value" miner is always minerIndex==2. If the official value is being
        //disputed, it sets its status to inDispute(currentStatus = 3) so that users are made aware it is under dispute
        if (_minerIndex == 2) {
            _request.inDispute[_timestamp] = true;
            _request.finalValues[_timestamp] = 0;
        }
        self.stakerDetails[_miner].currentStatus = 3;
        emit NewDispute(disputeId, _requestId, _timestamp, _miner);
    }

    /**
     * @dev Allows token holders to vote
     * @param _disputeId is the dispute id
     * @param _supportsDispute is the vote (true=the dispute has basis false = vote against dispute)
     */
    function vote(
        TellorStorage.TellorStorageStruct storage self,
        uint256 _disputeId,
        bool _supportsDispute
    ) public {
        TellorStorage.Dispute storage disp = self.disputesById[_disputeId];

        //Get the voteWeight or the balance of the user at the time/blockNumber the dispute began
        uint256 voteWeight =
            TellorTransfer.balanceOfAt(
                self,
                msg.sender,
                disp.disputeUintVars[keccak256("blockNumber")]
            );

        //Require that the msg.sender has not voted
        require(disp.voted[msg.sender] != true, "Sender has already voted");

        //Require that the user had a balance >0 at time/blockNumber the dispute began
        require(voteWeight != 0, "User balance is 0");

        //ensures miners that are under dispute cannot vote
        require(
            self.stakerDetails[msg.sender].currentStatus != 3,
            "Miner is under dispute"
        );

        //Update user voting status to true
        disp.voted[msg.sender] = true;

        //Update the number of votes for the dispute
        disp.disputeUintVars[keccak256("numberOfVotes")] += 1;

        //If the user supports the dispute increase the tally for the dispute by the voteWeight
        //otherwise decrease it
        if (_supportsDispute) {
            disp.tally = disp.tally.add(int256(voteWeight));
        } else {
            disp.tally = disp.tally.sub(int256(voteWeight));
        }

        //Let the network know the user has voted on the dispute and their casted vote
        emit Voted(_disputeId, _supportsDispute, msg.sender, voteWeight);
    }

    /**
     * @dev tallies the votes and locks the stake disbursement(currentStatus = 4) if the vote passes
     * @param _disputeId is the dispute id
     */
    function tallyVotes(
        TellorStorage.TellorStorageStruct storage self,
        uint256 _disputeId
    ) public {
        TellorStorage.Dispute storage disp = self.disputesById[_disputeId];

        //Ensure this has not already been executed/tallied
        require(disp.executed == false, "Dispute has been already executed");
        require(
            now >= disp.disputeUintVars[keccak256("minExecutionDate")],
            "Time for voting haven't elapsed"
        );
        require(
            disp.reportingParty != address(0),
            "reporting Party is address 0"
        );
        int256 _tally = disp.tally;
        if (_tally > 0) {
            //Set the dispute state to passed/true
            disp.disputeVotePassed = true;
        }
        //If the vote is not a proposed fork
        if (disp.isPropFork == false) {
            //Ensure the time for voting has elapsed
            TellorStorage.StakeInfo storage stakes =
                self.stakerDetails[disp.reportedMiner];
            //If the vote for disputing a value is successful(disp.tally >0) then unstake the reported
            // miner and transfer the stakeAmount and dispute fee to the reporting party
            if (stakes.currentStatus == 3) {
                stakes.currentStatus = 4;
            }
        } else if (
            uint256(_tally) >=
            ((self.uintVars[keccak256("total_supply")] * 10) / 100)
        ) {
            emit NewTellorAddress(disp.proposedForkAddress);
        }
        disp.disputeUintVars[keccak256("tallyDate")] = now;
        disp.executed = true;
        emit DisputeVoteTallied(
            _disputeId,
            _tally,
            disp.reportedMiner,
            disp.reportingParty,
            disp.disputeVotePassed
        );
    }

    /**
     * @dev Allows for a fork to be proposed
     * @param _propNewTellorAddress address for new proposed Tellor
     */
    function proposeFork(
        TellorStorage.TellorStorageStruct storage self,
        address _propNewTellorAddress
    ) public {
        bytes32 _hash = keccak256(abi.encode(_propNewTellorAddress));
        self.uintVars[keccak256("disputeCount")]++;
        uint256 disputeId = self.uintVars[keccak256("disputeCount")];
        if (self.disputeIdByDisputeHash[_hash] != 0) {
            self.disputesById[disputeId].disputeUintVars[
                keccak256("origID")
            ] = self.disputeIdByDisputeHash[_hash];
        } else {
            self.disputeIdByDisputeHash[_hash] = disputeId;
        }
        uint256 origID = self.disputeIdByDisputeHash[_hash];

        self.disputesById[origID].disputeUintVars[keccak256("disputeRounds")]++;
        uint256 dispRounds =
            self.disputesById[origID].disputeUintVars[
                keccak256("disputeRounds")
            ];
        self.disputesById[origID].disputeUintVars[
            keccak256(abi.encode(dispRounds))
        ] = disputeId;
        if (disputeId != origID) {
            uint256 lastID =
                self.disputesById[origID].disputeUintVars[
                    keccak256(abi.encode(dispRounds - 1))
                ];
            require(
                self.disputesById[lastID].disputeUintVars[
                    keccak256("minExecutionDate")
                ] <= now,
                "Dispute is already open"
            );
            if (self.disputesById[lastID].executed) {
                require(
                    now -
                        self.disputesById[lastID].disputeUintVars[
                            keccak256("tallyDate")
                        ] <=
                        1 days,
                    "Time for voting haven't elapsed"
                );
            }
        }
        self.disputesById[disputeId] = TellorStorage.Dispute({
            hash: _hash,
            isPropFork: true,
            reportedMiner: msg.sender,
            reportingParty: msg.sender,
            proposedForkAddress: _propNewTellorAddress,
            executed: false,
            disputeVotePassed: false,
            tally: 0
        });
        TellorTransfer.doTransfer(
            self,
            msg.sender,
            address(this),
            100e18 * 2**(dispRounds - 1)
        ); //This is the fork fee (just 100 tokens flat, no refunds.  Goes up quickly to dispute a bad vote)
        self.disputesById[disputeId].disputeUintVars[
            keccak256("blockNumber")
        ] = block.number;
        self.disputesById[disputeId].disputeUintVars[
            keccak256("minExecutionDate")
        ] = now + 7 days;
    }

    /**
     * @dev Updates the Tellor address after a proposed fork has
     * passed the vote and day has gone by without a dispute
     * @param _disputeId the disputeId for the proposed fork
     */
    function updateTellor(
        TellorStorage.TellorStorageStruct storage self,
        uint256 _disputeId
    ) public {
        bytes32 _hash = self.disputesById[_disputeId].hash;
        uint256 origID = self.disputeIdByDisputeHash[_hash];
        uint256 lastID =
            self.disputesById[origID].disputeUintVars[
                keccak256(
                    abi.encode(
                        self.disputesById[origID].disputeUintVars[
                            keccak256("disputeRounds")
                        ]
                    )
                )
            ];
        TellorStorage.Dispute storage disp = self.disputesById[lastID];
        require(disp.disputeVotePassed == true, "vote needs to pass");
        require(
            now - disp.disputeUintVars[keccak256("tallyDate")] > 1 days,
            "Time for voting for further disputes has not passed"
        );
        self.addressVars[keccak256("tellorContract")] = disp
            .proposedForkAddress;
    }

    /**
     * @dev Allows disputer to unlock the dispute fee
     * @param _disputeId to unlock fee from
     */
    function unlockDisputeFee(
        TellorStorage.TellorStorageStruct storage self,
        uint256 _disputeId
    ) public {
        uint256 origID =
            self.disputeIdByDisputeHash[self.disputesById[_disputeId].hash];
        uint256 lastID =
            self.disputesById[origID].disputeUintVars[
                keccak256(
                    abi.encode(
                        self.disputesById[origID].disputeUintVars[
                            keccak256("disputeRounds")
                        ]
                    )
                )
            ];
        if (lastID == 0) {
            lastID = origID;
        }
        TellorStorage.Dispute storage disp = self.disputesById[origID];
        TellorStorage.Dispute storage last = self.disputesById[lastID];
        //disputeRounds is increased by 1 so that the _id is not a negative number when it is the first time a dispute is initiated
        uint256 dispRounds = disp.disputeUintVars[keccak256("disputeRounds")];
        if (dispRounds == 0) {
            dispRounds = 1;
        }
        uint256 _id;
        require(
            disp.disputeUintVars[keccak256("paid")] == 0,
            "already paid out"
        );
        require(
            now - last.disputeUintVars[keccak256("tallyDate")] > 1 days,
            "Time for voting haven't elapsed"
        );
        TellorStorage.StakeInfo storage stakes =
            self.stakerDetails[disp.reportedMiner];
        disp.disputeUintVars[keccak256("paid")] = 1;
        if (last.disputeVotePassed == true) {
            //Changing the currentStatus and startDate unstakes the reported miner and transfers the stakeAmount
            stakes.startDate = now - (now % 86400);

            //Reduce the staker count
            self.uintVars[keccak256("stakerCount")] -= 1;

            //Update the minimum dispute fee that is based on the number of stakers
            updateMinDisputeFee(self);
            //Decreases the stakerCount since the miner's stake is being slashed
            if (stakes.currentStatus == 4) {
                stakes.currentStatus = 5;
                TellorTransfer.doTransfer(
                    self,
                    disp.reportedMiner,
                    disp.reportingParty,
                    self.uintVars[keccak256("stakeAmount")]
                );
                stakes.currentStatus = 0;
            }
            for (uint256 i = 0; i < dispRounds; i++) {
                _id = disp.disputeUintVars[
                    keccak256(abi.encode(dispRounds - i))
                ];
                if (_id == 0) {
                    _id = origID;
                }
                TellorStorage.Dispute storage disp2 = self.disputesById[_id];
                //transfer fee adjusted based on number of miners if the minerIndex is not 2(official value)
                TellorTransfer.doTransfer(
                    self,
                    address(this),
                    disp2.reportingParty,
                    disp2.disputeUintVars[keccak256("fee")]
                );
            }
        } else {
            stakes.currentStatus = 1;
            TellorStorage.Request storage _request =
                self.requestDetails[
                    disp.disputeUintVars[keccak256("requestId")]
                ];
            if (disp.disputeUintVars[keccak256("minerSlot")] == 2) {
                //note we still don't put timestamp back into array (is this an issue? (shouldn't be))
                _request.finalValues[
                    disp.disputeUintVars[keccak256("timestamp")]
                ] = disp.disputeUintVars[keccak256("value")];
            }
            if (
                _request.inDispute[
                    disp.disputeUintVars[keccak256("timestamp")]
                ] == true
            ) {
                _request.inDispute[
                    disp.disputeUintVars[keccak256("timestamp")]
                ] = false;
            }
            for (uint256 i = 0; i < dispRounds; i++) {
                _id = disp.disputeUintVars[
                    keccak256(abi.encode(dispRounds - i))
                ];
                if (_id != 0) {
                    last = self.disputesById[_id]; //handling if happens during an upgrade
                }
                TellorTransfer.doTransfer(
                    self,
                    address(this),
                    last.reportedMiner,
                    self.disputesById[_id].disputeUintVars[keccak256("fee")]
                );
            }
        }

        if (disp.disputeUintVars[keccak256("minerSlot")] == 2) {
            self.requestDetails[disp.disputeUintVars[keccak256("requestId")]]
                .apiUintVars[keccak256("disputeCount")]--;
        }
    }

    /**
     * @dev This function updates the minimum dispute fee as a function of the amount
     * of staked miners
     */
    function updateMinDisputeFee() public {
        uint256 stakeAmount = uints[keccak256("stakeAmount")];
        uint256 targetMiners = uints[keccak256("targetMiners")];
        uints[keccak256("disputeFee")] = SafeMath.max(
            15e18,
            (stakeAmount -
                ((stakeAmount *
                    (SafeMath.min(
                        targetMiners,
                        uints[keccak256("stakerCount")]
                    ) * 1000)) / targetMiners) /
                1000)
        );
    }
}
