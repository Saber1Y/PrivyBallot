// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialVotingDAO is SepoliaConfig {
    struct Proposal {
        bytes32 ipfsHash; // Points to metadata on IPFS
        address creator;
        uint64 deadline; // unix seconds
        euint128 yesCt; // encrypted yes count
        euint128 noCt; // encrypted no count
        bool revealed;
        uint128 yes; // plain after reveal
        uint128 no; // plain after reveal
        bool decryptionPending;
    }

    // storage
    uint256 public nextProposalId;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted; // NOTE: leaks participation only (not choice)

    // link oracle requests to proposals
    mapping(uint256 => uint256) private requestToProposal;

    // --- events
    event ProposalCreated(uint256 indexed id, address indexed creator, bytes32 ipfsHash, uint64 deadline);
    event VoteCast(uint256 indexed id, address indexed voter);
    event RevealRequested(uint256 indexed id, uint256 requestId);
    event Revealed(uint256 indexed id, uint128 yes, uint128 no);

    // --- helpers
    modifier onlyBefore(uint256 id) {
        require(block.timestamp < proposals[id].deadline, "Voting ended");
        _;
    }

    modifier onlyAfter(uint256 id) {
        require(block.timestamp >= proposals[id].deadline, "Too early");
        _;
    }

    // --- create
    function createProposal(bytes32 ipfsHash, uint64 durationSeconds) external returns (uint256 id) {
        require(durationSeconds > 0, "duration=0");
        require(ipfsHash != bytes32(0), "empty ipfs hash");
        id = nextProposalId++;

        Proposal storage p = proposals[id];
        p.ipfsHash = ipfsHash;
        p.creator = msg.sender;
        p.deadline = uint64(block.timestamp) + durationSeconds;

        // initialize encrypted tallies (trivial encryption)
        p.yesCt = FHE.asEuint128(0);
        p.noCt = FHE.asEuint128(0);

        // allow this contract to keep using those ciphertexts across txs
        FHE.allowThis(p.yesCt);
        FHE.allowThis(p.noCt);

        emit ProposalCreated(id, msg.sender, ipfsHash, p.deadline);
    }

    /// @notice Cast a confidential binary vote (true = yes, false = no)
    /// @param id Proposal id
    /// @param encChoice The encrypted choice handle (externalEbool)
    /// @param inputProof Packed ciphertext + ZK proof bytes
    function vote(uint256 id, externalEbool encChoice, bytes calldata inputProof) external onlyBefore(id) {
        Proposal storage p = proposals[id];
        require(!p.revealed && !p.decryptionPending, "Reveal in progress or done");
        require(!hasVoted[id][msg.sender], "Already voted");
        hasVoted[id][msg.sender] = true;

        // Validate input + get encrypted bool
        ebool choice = FHE.fromExternal(encChoice, inputProof); // ebool (private)

        // Confidential branching: increment exactly one tally
        euint128 one = FHE.asEuint128(1);
        euint128 zero = FHE.asEuint128(0);

        // yesCt += (choice ? 1 : 0)
        p.yesCt = FHE.add(p.yesCt, FHE.select(choice, one, zero));

        // noCt  += (choice ? 0 : 1)
        p.noCt = FHE.add(p.noCt, FHE.select(choice, zero, one));

        // Re-authorize updated ciphertexts for reuse in future transactions
        FHE.allowThis(p.yesCt);
        FHE.allowThis(p.noCt);

        emit VoteCast(id, msg.sender);
    }

    /// @notice Request reveal after deadline; anyone can call.
    function requestReveal(uint256 id) external onlyAfter(id) {
        Proposal storage p = proposals[id];
        require(!p.revealed, "Already revealed");
        require(!p.decryptionPending, "Decryption pending");

        // Ask oracle to decrypt both tallies asynchronously
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(p.yesCt);
        handles[1] = FHE.toBytes32(p.noCt);

        uint256 reqId = FHE.requestDecryption(handles, this.fulfillReveal.selector);
        requestToProposal[reqId] = id;
        p.decryptionPending = true;

        emit RevealRequested(id, reqId);
    }

    /// @notice Oracle callback with plaintexts. Must verify signatures.
    /// @dev Signature verification prevents spoofed results.
    function fulfillReveal(uint256 requestId, uint128 yesPlain, uint128 noPlain, bytes[] memory signatures) external {
        uint256 id = requestToProposal[requestId];
        Proposal storage p = proposals[id];
        require(p.decryptionPending, "No pending reveal");

        // Verify KMS signatures for this request
        FHE.checkSignatures(requestId, signatures);

        p.yes = yesPlain;
        p.no = noPlain;
        p.revealed = true;
        p.decryptionPending = false;

        emit Revealed(id, yesPlain, noPlain);
    }

    // --- read
    /// @notice Get proposal data for frontend (without FHE types)
    function getProposalPublic(
        uint256 id
    )
        external
        view
        returns (
            bytes32 ipfsHash,
            address creator,
            uint64 deadline,
            bool revealed,
            bool decryptionPending,
            uint128 yes,
            uint128 no
        )
    {
        Proposal storage p = proposals[id];
        return (p.ipfsHash, p.creator, p.deadline, p.revealed, p.decryptionPending, p.yes, p.no);
    }

    /// @notice Check if proposal exists
    function proposalExists(uint256 id) external view returns (bool) {
        return proposals[id].deadline > 0;
    }
}
