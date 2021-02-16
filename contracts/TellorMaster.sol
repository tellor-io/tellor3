// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./TellorStorage.sol";

/**
 * @title Tellor Master
 * @dev This is the Master contract with all tellor getter functions and delegate call to Tellor.
 * The logic for the functions on this contract is saved on the TellorGettersLibrary, TellorTransfer,
 * TellorGettersLibrary, and TellorStake
 */
contract TellorMaster is TellorStorage {
    event NewTellorAddress(address _newTellor);

    constructor(address _tellorContract) public {
        addresses[keccak256("_owner")] = msg.sender;
        addresses[keccak256("_deity")] = msg.sender;
        addresses[keccak256("tellorContract")] = _tellorContract;
        emit NewTellorAddress(_tellorContract);
    }

    /**
     * @param _newDeity the new Deity in the contract
     */

    function changeDeity(address _newDeity) external {
        require(msg.sender == addresses[keccak256("_deity")]);
        addresses[keccak256("_deity")] = _newDeity;
    }
    /**
     * @param _newOwner the new Deity in the contract
     */

    function changeOwner(address _newOwner) external {
        require(msg.sender == addresses[keccak256("_owner")]);
        addresses[keccak256("_owner")] = _newOwner;
    }
    /**
     * @dev  allows for the deity to make fast upgrades.  Deity should be 0 address if decentralized
     * @param _tellorContract the address of the new Tellor Contract
     */
    function changeTellorContract(address _tellorContract) external {
        require(msg.sender == addresses[keccak256("_deity")]);
        addresses[keccak256("tellorContract")] = _tellorContract;
    }

    function _delegate(address implementation) internal virtual {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(
                gas(),
                implementation,
                0,
                calldatasize(),
                0,
                0
            )

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
                // delegatecall returns 0 on error.
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
        }
    }

    /**
     * @dev This is the fallback function that allows contracts to call the tellor contract at the address stored
     */
    fallback() external payable {
        address addr = addresses[keccak256("tellorContract")];
        _delegate(addr);
    }
}
