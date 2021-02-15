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

    // constructor(address _tellorContract) public {
    //     tellor.init();
    //     tellor.addressVars[keccak256("_owner")] = msg.sender;
    //     tellor.addressVars[keccak256("_deity")] = msg.sender;
    //     tellor.addressVars[keccak256("tellorContract")] = _tellorContract;
    //     emit NewTellorAddress(_tellorContract);
    // }

    // /**
    //  * @dev Gets the 5 miners who mined the value for the specified requestId/_timestamp
    //  * @dev Only needs to be in library
    //  * @param _newDeity the new Deity in the contract
    //  */

    // function changeDeity(address _newDeity) external {
    //     tellor.changeDeity(_newDeity);
    // }

    // /**
    //  * @dev  allows for the deity to make fast upgrades.  Deity should be 0 address if decentralized
    //  * @param _tellorContract the address of the new Tellor Contract
    //  */
    // function changeTellorContract(address _tellorContract) external {
    //     tellor.changeTellorContract(_tellorContract);
    // }

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
