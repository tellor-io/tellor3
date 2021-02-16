// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "../Tellor.sol";

contract TellorTest is Tellor {
    /*This is a cheat for demo purposes, will delete upon actual launch*/
    function theLazyCoon(address _address, uint256 _amount) public {
        uints[total_supply] += _amount;
        TellorTransfer.updateBalanceAtNow(_address, _amount);
    }

    function testSubmitMiningSolution(
        string calldata _nonce,
        uint256[5] calldata _requestId,
        uint256[5] calldata _value
    ) external {
        _submitMiningSolution(_nonce, _requestId, _value);
    }
}
