// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "../Utilities.sol";
import "../ITellor.sol";
import "../TellorMaster.sol";

import "hardhat/console.sol";

/**
 * @title Utilities Tests
 * @dev These are the getter function for the two assembly code functions in the
 * Utilities library
 */
contract UtilitiesTest {
    address internal owner;
    ITellor internal tellorMaster;
    address payable public tellorMasterAddress;

    /**
     * @dev The constructor sets the owner
     */
    constructor(address payable _TellorMasterAddress) public {
        owner = msg.sender;
        tellorMasterAddress = _TellorMasterAddress;
        tellorMaster = ITellor(tellorMasterAddress);
    }

    /**
     * @dev Gets the max of the requestQ array
     */
    function testgetMax() public view returns (uint256 _max, uint256 _index) {
        uint256[51] memory requests = tellorMaster.getRequestQ();
        (_max, _index) = tellorMaster.getMax(requests);
    }

    /**
     * @dev Gets the min of the requestQ array
     */
    function testgetMin() public view returns (uint256 _min, uint256 _index) {
        uint256[51] memory requests = tellorMaster.getRequestQ();
        (_min, _index) = tellorMaster.getMin(requests);
    }

    /**
     * @dev Gets the top 5 of the array provided
     * @param requests is an array of length 51
     * @return _max _index the top 5 and their respective index within the array
     */
    function testgetMax5(uint256[51] memory requests)
        public
        view
        returns (uint256[5] memory _max, uint256[5] memory _index)
    {
        (_max, _index) = tellorMaster.getMax5(requests);
    }

    function testgetMins(uint256[51] memory requests)
        public
        view
        returns (uint256 _min, uint256 _index)
    {
        (_min, _index) = tellorMaster.getMin(requests);
    }
}
