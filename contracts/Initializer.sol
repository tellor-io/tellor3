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
contract Initializer is TellorGetters, TellorTransfer {
    fallback() external {}
}
