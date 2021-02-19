// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "../Tellor.sol";

contract TellorTest is Tellor {
    /*This is a cheat for demo purposes, will delete upon actual launch*/
    function theLazyCoon(address _address, uint256 _amount) public {
        uints[_TOTAL_SUPPLY] += _amount;
        TellorTransfer.updateBalanceAtNow(_address, _amount);
    }

    /*This function uses all the functionality of submitMiningSolution, but bypasses verifyNonce*/
    function testSubmitMiningSolution(
        string calldata _nonce,
        uint256[5] calldata _requestId,
        uint256[5] calldata _value
    ) external {
        bytes32 _hashMsgSender = keccak256(abi.encode(msg.sender));
        require(
            uints[_hashMsgSender] == 0 ||
                block.timestamp - uints[_hashMsgSender] > 15 minutes,
            "Miner can only win rewards once per 15 min"
        );
        _submitMiningSolution(_nonce, _requestId, _value);
    }

    /*allows manually setting the difficulty in tests*/
    function manuallySetDifficulty(uint256 _diff) public {
        uints[_DIFFICULTY] = _diff;
    }

    function getMax5(uint256[51] memory data)
        public
        view
        returns (uint256[5] memory max, uint256[5] memory maxIndex)
    {
        uint256 min5 = data[1];
        uint256 minI = 0;
        for (uint256 j = 0; j < 5; j++) {
            max[j] = data[j + 1]; //max[0]=data[1]
            maxIndex[j] = j + 1; //maxIndex[0]= 1
            if (max[j] < min5) {
                min5 = max[j];
                minI = j;
            }
        }
        for (uint256 i = 6; i < data.length; i++) {
            if (data[i] > min5) {
                max[minI] = data[i];
                maxIndex[minI] = i;
                min5 = data[i];
                for (uint256 j = 0; j < 5; j++) {
                    if (max[j] < min5) {
                        min5 = max[j];
                        minI = j;
                    }
                }
            }
        }
    }
}
