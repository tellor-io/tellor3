// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./TellorStorage.sol";
import "./TellorVariables.sol";

/**
 * @title Tellor Master
 * @dev This is the Master contract with all tellor getter functions and delegate call to Tellor.
 * The logic for the functions on this contract is saved on the TellorGettersLibrary, TellorTransfer,
 * TellorGettersLibrary, and TellorStake
 */
contract TellorMaster is TellorStorage, TellorVariables {
    event NewTellorAddress(address _newTellor);

    constructor(address _tellorContract, address _oldTellor) {
        addresses[keccak256("_owner")] = msg.sender;
        addresses[keccak256("_deity")] = msg.sender;
        addresses[keccak256("tellorContract")] = _tellorContract;
        addresses[keccak256("_oldTellor")] = _oldTellor;

        uints[difficulty] = 100;
        uints[timeTarget] = 240;
        uints[targetMiners] = 200;
        uints[currentReward] = 1e18;
        uints[disputeFee] = 500e18;
        uints[stakeAmount] = 500e18;
        uints[timeOfLastNewValue] = block.timestamp - 240;

        currentMiners[0].value = 1;
        currentMiners[1].value = 2;
        currentMiners[2].value = 3;
        currentMiners[3].value = 4;
        currentMiners[4].value = 5;

        // Bootstraping Request Queue
        for (uint256 index = 1; index < 51; index++) {
            Request storage req = requestDetails[index];
            req.apiUintVars[requestQPosition] = index;
            requestIdByRequestQIndex[index] = index;
        }

        // EIP1967 compatibility
        bytes32 slot =
            0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3;

        assembly {
            sstore(slot, _tellorContract)
        }

        emit NewTellorAddress(_tellorContract);
    }

    /**
     * @dev This function allows the Deity to set a new deity
     * @param _newDeity the new Deity in the contract
     */
    function changeDeity(address _newDeity) external {
        require(msg.sender == addresses[keccak256("_deity")]);
        addresses[keccak256("_deity")] = _newDeity;
    }

    /**
     * @dev This function allows the owner to set a new _owner
     * @param _newOwner the new Owner in the contract
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
        bytes32 slot =
            0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3;

        assembly {
            sstore(slot, _tellorContract)
        }
    }

    /**
     * @dev  allows for the deity to update the TellorStake contract address
     * @param _tellorGetters the address of the new Tellor Contract
     */
    function changeTellorGetters(address _tellorGetters) external {
        require(msg.sender == addresses[keccak256("_deity")]);
        addresses[keccak256("tellorGetters")] = _tellorGetters;
    }

    /**
     * @dev This is the internal function that allows for delegate calls to the Tellor logic
     * contract address
     */
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
     * @dev This is the fallback function that allows contracts to call the tellor
     * contract at the address stored
     */
    fallback() external payable {
        address addr = addresses[keccak256("tellorContract")];
        _delegate(addr);
    }
}
