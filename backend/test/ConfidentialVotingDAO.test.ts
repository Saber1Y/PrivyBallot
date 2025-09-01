import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { ConfidentialVotingDAO } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { time, takeSnapshot, SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers";

type Signers = {
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
  david: HardhatEthersSigner;
};

describe("ConfidentialVotingDAO", function () {
  let signers: Signers;
  let votingContract: ConfidentialVotingDAO;
  let votingContractAddress: string;
  let snapshot: SnapshotRestorer;

  const VOTING_DURATION = 3600; // 1 hour in seconds

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      alice: ethSigners[0],
      bob: ethSigners[1],
      charlie: ethSigners[2],
      david: ethSigners[3],
    };

    // Deploy the contract for testing
    const ConfidentialVotingDAOFactory = await ethers.getContractFactory("ConfidentialVotingDAO");
    votingContract = await ConfidentialVotingDAOFactory.deploy();
    await votingContract.waitForDeployment();
    votingContractAddress = await votingContract.getAddress();

    console.log(`ConfidentialVotingDAO deployed at: ${votingContractAddress}`);
  });

  beforeEach(async function () {
    // Take a snapshot before each test
    snapshot = await takeSnapshot();
  });

  afterEach(async function () {
    // Restore the snapshot after each test
    await snapshot.restore();
  });

  describe("Proposal Creation", function () {
    it("should create a proposal successfully", async function () {
      const title = "Should we implement feature X?";
      const duration = VOTING_DURATION;

      const tx = await votingContract.connect(signers.alice).createProposal(title, duration);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt?.logs.find(
        (log) =>
          votingContract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name ===
          "ProposalCreated",
      );
      expect(event).to.not.be.undefined;

      // Check proposal data
      const proposal = await votingContract.proposals(0);
      expect(proposal.title).to.equal(title);
      expect(proposal.revealed).to.be.false;
      expect(proposal.decryptionPending).to.be.false;

      // Check next proposal ID
      expect(await votingContract.nextProposalId()).to.equal(1);
    });

    it("should fail to create proposal with zero duration", async function () {
      await expect(votingContract.connect(signers.alice).createProposal("Test proposal", 0)).to.be.revertedWith(
        "duration=0",
      );
    });
  });

  describe("Voting Process", function () {
    let proposalId: number;

    beforeEach(async function () {
      // Create a fresh proposal for each test
      const nextId = await votingContract.nextProposalId();
      const tx = await votingContract.connect(signers.alice).createProposal("Test Proposal", VOTING_DURATION);
      await tx.wait();
      proposalId = Number(nextId); // Use the actual next proposal ID
    });

    it("should allow confidential voting with YES", async function () {
      // Create encrypted TRUE (YES vote)
      const encryptedVote = await fhevm
        .createEncryptedInput(votingContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();

      const tx = await votingContract
        .connect(signers.bob)
        .vote(proposalId, encryptedVote.handles[0], encryptedVote.inputProof);

      const receipt = await tx.wait();

      // Check VoteCast event
      const event = receipt?.logs.find(
        (log) =>
          votingContract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "VoteCast",
      );
      expect(event).to.not.be.undefined;

      // Check that voter is marked as having voted
      expect(await votingContract.hasVoted(proposalId, signers.bob.address)).to.be.true;
    });

    it("should allow confidential voting with NO", async function () {
      // Create encrypted FALSE (NO vote)
      const encryptedVote = await fhevm
        .createEncryptedInput(votingContractAddress, signers.charlie.address)
        .addBool(false)
        .encrypt();

      const tx = await votingContract
        .connect(signers.charlie)
        .vote(proposalId, encryptedVote.handles[0], encryptedVote.inputProof);

      await tx.wait();

      // Check that voter is marked as having voted
      expect(await votingContract.hasVoted(proposalId, signers.charlie.address)).to.be.true;
    });

    it("should prevent double voting", async function () {
      // First vote
      const encryptedVote1 = await fhevm
        .createEncryptedInput(votingContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();

      await votingContract.connect(signers.bob).vote(proposalId, encryptedVote1.handles[0], encryptedVote1.inputProof);

      // Attempt second vote
      const encryptedVote2 = await fhevm
        .createEncryptedInput(votingContractAddress, signers.bob.address)
        .addBool(false)
        .encrypt();

      await expect(
        votingContract.connect(signers.bob).vote(proposalId, encryptedVote2.handles[0], encryptedVote2.inputProof),
      ).to.be.revertedWith("Already voted");
    });

    it("should prevent voting after deadline", async function () {
      // Fast forward past the deadline
      await time.increase(VOTING_DURATION + 1);

      const encryptedVote = await fhevm
        .createEncryptedInput(votingContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();

      await expect(
        votingContract.connect(signers.bob).vote(proposalId, encryptedVote.handles[0], encryptedVote.inputProof),
      ).to.be.revertedWith("Voting ended");
    });

    it("should handle multiple voters correctly", async function () {
      // Alice votes YES
      const aliceVote = await fhevm
        .createEncryptedInput(votingContractAddress, signers.alice.address)
        .addBool(true)
        .encrypt();
      await votingContract.connect(signers.alice).vote(proposalId, aliceVote.handles[0], aliceVote.inputProof);

      // Bob votes YES
      const bobVote = await fhevm
        .createEncryptedInput(votingContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      await votingContract.connect(signers.bob).vote(proposalId, bobVote.handles[0], bobVote.inputProof);

      // Charlie votes NO
      const charlieVote = await fhevm
        .createEncryptedInput(votingContractAddress, signers.charlie.address)
        .addBool(false)
        .encrypt();
      await votingContract.connect(signers.charlie).vote(proposalId, charlieVote.handles[0], charlieVote.inputProof);

      // Verify all voters are recorded
      expect(await votingContract.hasVoted(proposalId, signers.alice.address)).to.be.true;
      expect(await votingContract.hasVoted(proposalId, signers.bob.address)).to.be.true;
      expect(await votingContract.hasVoted(proposalId, signers.charlie.address)).to.be.true;
      expect(await votingContract.hasVoted(proposalId, signers.david.address)).to.be.false;
    });
  });

  describe("Result Revelation", function () {
    let proposalId: number;

    beforeEach(async function () {
      // Create proposal and cast some votes
      const nextId = await votingContract.nextProposalId();
      const tx = await votingContract
        .connect(signers.alice)
        .createProposal("Test Proposal for Reveal", VOTING_DURATION);
      await tx.wait();
      proposalId = Number(nextId);

      // Cast 2 YES votes and 1 NO vote
      const yesVote1 = await fhevm
        .createEncryptedInput(votingContractAddress, signers.alice.address)
        .addBool(true)
        .encrypt();
      await votingContract.connect(signers.alice).vote(proposalId, yesVote1.handles[0], yesVote1.inputProof);

      const yesVote2 = await fhevm
        .createEncryptedInput(votingContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      await votingContract.connect(signers.bob).vote(proposalId, yesVote2.handles[0], yesVote2.inputProof);

      const noVote = await fhevm
        .createEncryptedInput(votingContractAddress, signers.charlie.address)
        .addBool(false)
        .encrypt();
      await votingContract.connect(signers.charlie).vote(proposalId, noVote.handles[0], noVote.inputProof);
    });

    it("should prevent reveal before deadline", async function () {
      await expect(votingContract.connect(signers.alice).requestReveal(proposalId)).to.be.revertedWith("Too early");
    });

    it("should allow reveal request after deadline", async function () {
      // Fast forward past deadline
      await time.increase(VOTING_DURATION + 1);

      const tx = await votingContract.connect(signers.alice).requestReveal(proposalId);
      const receipt = await tx.wait();

      // Check RevealRequested event
      const event = receipt?.logs.find(
        (log) =>
          votingContract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name ===
          "RevealRequested",
      );
      expect(event).to.not.be.undefined;

      // Check proposal state
      const proposal = await votingContract.proposals(proposalId);
      expect(proposal.decryptionPending).to.be.true;
      expect(proposal.revealed).to.be.false;
    });

    it("should prevent multiple reveal requests", async function () {
      // Fast forward past deadline
      await time.increase(VOTING_DURATION + 1);

      // First reveal request
      await votingContract.connect(signers.alice).requestReveal(proposalId);

      // Second reveal request should fail
      await expect(votingContract.connect(signers.bob).requestReveal(proposalId)).to.be.revertedWith(
        "Decryption pending",
      );
    });

    // Note: Testing fulfillReveal would require mocking the KMS oracle
    // This is typically done in integration tests rather than unit tests
  });

  describe("Edge Cases", function () {
    it("should handle proposal with no votes", async function () {
      const nextId = await votingContract.nextProposalId();
      const tx = await votingContract.connect(signers.alice).createProposal("No votes proposal", VOTING_DURATION);
      await tx.wait();
      const proposalId = Number(nextId);

      // Fast forward past deadline
      await time.increase(VOTING_DURATION + 1);

      // Should still allow reveal request even with no votes
      await expect(votingContract.connect(signers.alice).requestReveal(proposalId)).to.not.be.reverted;
    });

    it("should handle multiple proposals correctly", async function () {
      const startingId = await votingContract.nextProposalId();

      // Create multiple proposals
      await votingContract.connect(signers.alice).createProposal("Proposal 1", VOTING_DURATION);
      await votingContract.connect(signers.alice).createProposal("Proposal 2", VOTING_DURATION);
      await votingContract.connect(signers.alice).createProposal("Proposal 3", VOTING_DURATION);

      const endingId = await votingContract.nextProposalId();
      expect(Number(endingId) - Number(startingId)).to.equal(3);

      // Check proposals exist
      const proposal0 = await votingContract.proposals(Number(startingId));
      const proposal1 = await votingContract.proposals(Number(startingId) + 1);
      const proposal2 = await votingContract.proposals(Number(startingId) + 2);

      expect(proposal0.title).to.equal("Proposal 1");
      expect(proposal1.title).to.equal("Proposal 2");
      expect(proposal2.title).to.equal("Proposal 3");
    });
  });
});
