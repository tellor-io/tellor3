// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./TellorTransfer.sol";
import "./TellorGetters.sol";
import "./Utilities.sol";
import "./SafeMath.sol";

// TODO review all functions visibility
/**
 * @title Tellor Oracle System
 * @dev Oracle contract where miners can submit the proof of work along with the value.
 * The logic for this contract is in TellorLibrary.sol, TellorDispute.sol, TellorStake.sol,
 * and TellorTransfer.sol
 */
contract Initializer is TellorTransfer {
    function _init() internal {
        uints[difficulty] = 10000000;
        uints[timeTarget] = 240;
        uints[targetMiners] = 200;
        uints[disputeFee] = 500e17;
        uints[stakeAmount] = 500e18;
        uints[timeOfLastNewValue] = block.timestamp - 240;

        currentMiners[0].value = 0;
        currentMiners[1].value = 1;
        currentMiners[2].value = 2;
        currentMiners[3].value = 3;
        currentMiners[4].value = 4;

        // Bootstraping Request Queue
        for (uint256 index = 1; index < 50; index++) {
            Request storage req = requestDetails[index];
            req.apiUintVars[requestQPosition] = index;
            requestIdByRequestQIndex[index] = index;
        }
    }

    function init() external {
        _init();
    }

    fallback() external {
        _init();
    }
}
