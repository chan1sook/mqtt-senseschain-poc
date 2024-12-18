//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

contract MqttBlockchainAcl {
	// username -> pw
	struct DeviceInfo {
		string hashedpw;
		bool active;
	}

	mapping(address => mapping(uint => DeviceInfo)) public device; 
	mapping(address => uint) public deviceLength;

	function registerDevice(string memory _hashedpw, bool _status) public {
		uint nextIndex = deviceLength[msg.sender];
		device[msg.sender][nextIndex] = DeviceInfo(_hashedpw, _status);
		deviceLength[msg.sender] += 1;
	}
	
	function setDeviceActive(uint _index, bool _status) public {
		device[msg.sender][_index].active = _status;
	}

	function setDeviceHashedPassword(uint _index, string memory _hashedpw) public {
		device[msg.sender][_index].hashedpw = _hashedpw;
	}
}
