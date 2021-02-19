// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "../Tellor.sol";

contract TellorTest is Tellor {
    /*This is a cheat for demo purposes, will delete upon actual launch*/
    function theLazyCoon(address _address, uint256 _amount) public {
        uints[total_supply] += _amount;
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
    function manuallySetDifficulty(uint256 _diff) public{
        uints[difficulty] = _diff;
    }
}
