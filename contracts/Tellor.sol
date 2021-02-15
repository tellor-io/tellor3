pragma solidity 0.7.4;

import "./TellorStorage.sol";
import "./TellorTransfer.sol";

// TODO review all functions visibility
/**
 * @title Tellor Oracle System
 * @dev Oracle contract where miners can submit the proof of work along with the value.
 * The logic for this contract is in TellorLibrary.sol, TellorDispute.sol, TellorStake.sol,
 * and TellorTransfer.sol
 */
contract Tellor is TellorVariables, TellorStorage, TellorTransfer {
    function submitMiningSolution(
        string calldata _nonce,
        uint256[5] calldata _requestIds,
        uint256[5] calldata _values
    ) external {
        bytes32 _hashMsgSender = keccak256(abi.encode(msg.sender));
        require(
            now - uints[_hashMsgSender] > 15 minutes,
            "Miner can only win rewards once per 15 min"
        );
        if (uints[slotProgress] != 4) {
            _verifyNonce(_nonce);
        }
        uints[_hashMsgSender] = now;
        _submitMiningSolution(_nonce, _requestIds, _values);
    }

    function _submitMiningSolution(
        string memory _nonce,
        uint256[5] memory _requestIds,
        uint256[5] memory _values
    ) internal {
        //Verifying Miner Eligibility
        require(_requestIds[0] == currentMiners[0].id, "Request ID is wrong");
        require(_requestIds[1] == currentMiners[1].id, "Request ID is wrong");
        require(_requestIds[2] == currentMiners[2].id, "Request ID is wrong");
        require(_requestIds[3] == currentMiners[3].id, "Request ID is wrong");
        require(_requestIds[4] == currentMiners[4].id, "Request ID is wrong");

        bytes32 _currChallenge = bytesVars[currentChallenge];
        uint256 _slotProgress = uints[slotProgress];
        //Saving the challenge information as unique by using the msg.sender

        //Checking and updating Miner Status
        require(
            challenges[_currChallenge][msg.sender] == false,
            "Miner already submitted the value"
        );
        //Update the miner status to true once they submit a value so they don't submit more than once
        challenges[_currChallenge][msg.sender] = true;

        for (uint256 index = 0; index < _requestIds.length; index++) {
            uint256 storage req = requestDetails[_requestIds[index]];
            uint256 head = req.head;
            req.minersByValue[head][uints[_slotProgress]] = msg.sender;
            req.valuesByTimestamp[head][slotProgress] = _values[index];
        }

        if (_slotProgress + 1 == 4) {
            _adjustDifficulty();
        }

        if (_slotProgress + 1 == 5) {
            //slotProgress has been incremented, but we're using the variable on stack to save gas
            newBlock(_nonce, _requestId);
            uints[slotProgress] = 0;
        } else {
            uints[slotProgress]++;
        }
        emit NonceSubmitted(
            msg.sender,
            _nonce,
            _requestId,
            _value,
            _currChallenge,
            _slotProgress
        );
    }

    function _verifyNonce(string memory _nonce) internal view {
        require(
            uint256(
                sha256(
                    abi.encodePacked(
                        ripemd160(
                            abi.encodePacked(
                                keccak256(
                                    abi.encodePacked(
                                        bytesVars[currentChallenge],
                                        msg.sender,
                                        _nonce
                                    )
                                )
                            )
                        )
                    )
                )
            ) %
                uints[difficulty] ==
                0 ||
                now - uints[timeOfLastNewValue] >= 15 minutes,
            "Incorrect nonce for current challenge"
        );
    }

    function _adjustDifficulty() internal {
        // If the difference between the timeTarget and how long it takes to solve the challenge this updates the challenge
        //difficulty up or down by the difference between the target time and how long it took to solve the previous challenge
        //otherwise it sets it to 1
        uint256 timeDiff = now - uints[timeOfLastNewValue];
        int256 _change = int256(SafeMath.min(1200, timeDiff));
        int256 _diff = int256(uints[difficulty]);
        _change = (_diff * (int256(uints[timeTarget]) - _change)) / 4000;
        if (_change == 0) {
            _change = 1;
        }
        uints[difficulty] = uint256(SafeMath.max(_diff + _change, 1));
    }

    /**
     * @dev Internal function to calculate and pay rewards to miners
     *
     */
    function _payReward(address[5] memory miners, uint256 _previousTime)
        internal
    {
        //_timeDiff is how many minutes passed since last block
        uint256 _timeDiff = block.timestamp - _previousTime;
        uint256 _currReward = 1e18;
        uint256 reward = (_timeDiff * _currReward) / 300;
        uint256 _tip = uints[currentTotalTips] / 10;
        uint256 _devShare = reward / 2;

        _doTransfer(address(this), miners[0], reward + _tip);
        _doTransfer(address(this), miners[1], reward + _tip);
        _doTransfer(address(this), miners[2], reward + _tip);
        _doTransfer(address(this), miners[3], reward + _tip);
        _doTransfer(address(this), miners[4], reward + _tip);

        //update the total supply
        uints[total_supply] +=
            _devShare +
            reward *
            5 -
            (uints[currentTotalTips] / 2);
        TellorTransfer.doTransfer(address(this), addresses[_owner], _devShare);
        uints[currentTotalTips] = 0;
    }

    /**
     * @dev This function is called by submitMiningSolution and adjusts the difficulty, sorts and stores the first
     * 5 values received, pays the miners, the dev share and assigns a new challenge
     * @param _nonce or solution for the PoW  for the requestId
     * @param _requestIds for the current request being mined
     */
    function _newBlock(string memory _nonce, uint256[5] memory _requestIds)
        internal
    {
        uint256 _previousTime = uints[timeOfLastNewValue];
        uint256 _timeOfLastNewValue = block.timestamp;
        uints[timeOfLastNewValue] = _timeOfLastNewValue;
        uint256[5] memory a;
        for (uint256 k = 0; k < 5; k++) {
            NewRequest storage req = requestDetails[uints[_requestIds[k]]];
            for (uint256 i = 1; i < 5; i++) {
                uint256 temp = req.valuesByTimestamp[k][i];
                address temp2 = req.minersByValue[k][i];
                uint256 j = i;
                while (j > 0 && temp < req.valuesByTimestamp[k][j - 1]) {
                    req.valuesByTimestamp[k][j] = req.valuesByTimestamp[k][
                        j - 1
                    ];
                    req.minersByValue[k][j] = req.minersByValue[k][j - 1];
                    j--;
                }
                if (j < i) {
                    req.valuesByTimestamp[k][j] = temp;
                    req.minersByValue[k][j] = temp2;
                }
            }
            req.head++;
            uint256 head = req.head;

            //Save the official(finalValue), timestamp of it, 5 miners and their submitted values for it, and its block number
            a = req.valuesByTimestamp[k];
            req.finalValues[head] = a[2];
            req.minersByValue[head] = req.minersByValue[k];
            req.valuesByTimestamp[head] = req.valuesByTimestamp[k];
            // Delete Old Values
            delete req.minersByValue[head - 256];
            delete req.valuesByTimestamp[head - 256];
            req.apiUintVars[totalTip] = 0;
        }
        emit NewValue(
            _requestIds,
            _timeOfLastNewValue,
            a,
            self.uintVars[currentTotalTips],
            _currChallenge
        );
        //map the timeOfLastValue to the requestId that was just mined
        requestIdByTimestamp[_timeOfLastNewValue] = _requestIds[0];
        //add timeOfLastValue to the newValueTimestamps array
        newValueTimestamps.push(_timeOfLastNewValue);

        address[5] memory miners =
            self.requestDetails[_requestId[0]].minersByValue[
                _timeOfLastNewValue
            ];
        //payMinersRewards
        _payReward(self, miners, _previousTime);

        uints[_tBlock]++;
        uint256[5] memory _topId = TellorStake.getTopRequestIDs(self);
        for (uint256 i = 0; i < 5; i++) {
            self.currentMiners[i].value = _topId[i];
            self.requestQ[
                self.requestDetails[_topId[i]].apiUintVars[requestQPosition]
            ] = 0;
            self.uintVars[currentTotalTips] += self.requestDetails[_topId[i]]
                .apiUintVars[totalTip];
        }
        //Issue the the next challenge

        _currChallenge = keccak256(
            abi.encode(_nonce, _currChallenge, blockhash(block.number - 1))
        );
        self.currentChallenge = _currChallenge; // Save hash for next proof
        emit NewChallenge(
            _currChallenge,
            _topId,
            self.uintVars[difficulty],
            self.uintVars[currentTotalTips]
        );
    }

    /**
     * @dev Add tip to Request value from oracle
     * @param _requestId being requested to be mined
     * @param _tip amount the requester is willing to pay to be get on queue. Miners
     * mine the onDeckQueryHash, or the api with the highest payout pool
     */
    function addTip(
        TellorStorage.TellorStorageStruct storage self,
        uint256 _requestId,
        uint256 _tip
    ) public {
        require(_requestId != 0, "RequestId is 0");
        require(_tip != 0, "Tip should be greater than 0");
        uint256 _count = self.uintVars[requestCount] + 1;
        if (_requestId == _count) {
            self.uintVars[requestCount] = _count;
        } else {
            require(_requestId < _count, "RequestId is not less than count");
        }
        TellorTransfer.doTransfer(self, msg.sender, address(this), _tip);
        //Update the information for the request that should be mined next based on the tip submitted
        updateOnDeck(self, _requestId, _tip);
        emit TipAdded(
            msg.sender,
            _requestId,
            _tip,
            self.requestDetails[_requestId].apiUintVars[totalTip]
        );
    }

    /**
     * @dev This function updates APIonQ and the requestQ when requestData or addTip are ran
     * @param _requestId being requested
     * @param _tip is the tip to add
     */
    function updateOnDeck(
        TellorStorage.TellorStorageStruct storage self,
        uint256 _requestId,
        uint256 _tip
    ) public {
        TellorStorage.Request storage _request =
            self.requestDetails[_requestId];
        _request.apiUintVars[totalTip] = _request.apiUintVars[totalTip].add(
            _tip
        );
        if (
            self.currentMiners[0].value == _requestId ||
            self.currentMiners[1].value == _requestId ||
            self.currentMiners[2].value == _requestId ||
            self.currentMiners[3].value == _requestId ||
            self.currentMiners[4].value == _requestId
        ) {
            self.uintVars[currentTotalTips] += _tip;
        } else {
            //if the request is not part of the requestQ[51] array
            //then add to the requestQ[51] only if the _payout/tip is greater than the minimum(tip) in the requestQ[51] array
            if (_request.apiUintVars[requestQPosition] == 0) {
                uint256 _min;
                uint256 _index;
                (_min, _index) = Utilities.getMin(self.requestQ);
                //we have to zero out the oldOne
                //if the _payout is greater than the current minimum payout in the requestQ[51] or if the minimum is zero
                //then add it to the requestQ array and map its index information to the requestId and the apiUintVars
                if (_request.apiUintVars[totalTip] > _min || _min == 0) {
                    self.requestQ[_index] = _request.apiUintVars[totalTip];
                    self.requestDetails[self.requestIdByRequestQIndex[_index]]
                        .apiUintVars[requestQPosition] = 0;
                    self.requestIdByRequestQIndex[_index] = _requestId;
                    _request.apiUintVars[requestQPosition] = _index;
                }
                // else if the requestId is part of the requestQ[51] then update the tip for it
            } else {
                self.requestQ[_request.apiUintVars[requestQPosition]] += _tip;
            }
        }
    }
}
