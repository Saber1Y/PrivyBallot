// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import {FHEVMConfigStruct} from "@fhevm/solidity/lib/Impl.sol";

/**
 * @title   LocalhostConfig
 * @notice  A mock configuration for localhost development that provides
 *          immediate decryption without requiring an oracle.
 */
contract LocalhostConfig {
    constructor() {
        // Use zero addresses for localhost - the FHE lib will handle mocking
        FHEVMConfigStruct memory config = FHEVMConfigStruct({
            ACLAddress: address(0),
            FHEVMExecutorAddress: address(0),
            KMSVerifierAddress: address(0),
            InputVerifierAddress: address(0)
        });

        FHE.setCoprocessor(config);
        FHE.setDecryptionOracle(address(this)); // Use this contract as oracle
    }

    /**
     * @notice Mock oracle callback - for localhost development only
     * @dev In a real environment, this would be called by the Zama oracle
     */
    function mockDecryptionCallback(
        address target,
        bytes4 selector,
        uint256 requestId,
        uint128 value1,
        uint128 value2
    ) external {
        // Call the target contract's callback function
        bytes[] memory signatures = new bytes[](0); // Empty signatures for mock
        (bool success, ) = target.call(abi.encodeWithSelector(selector, requestId, value1, value2, signatures));
        require(success, "Mock callback failed");
    }
}
