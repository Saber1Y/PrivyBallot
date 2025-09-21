# 🗳️ PrivyBallot

**Confidential Voting DAO using Zama's Fully Homomorphic Encryption (FHE)**

PrivyBallot is a privacy-preserving voting system built on Ethereum that ensures complete ballot secrecy while maintaining transparency and verifiability. Using Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine), votes remain encrypted throughout the entire process, with results only revealed after the voting period ends.

## 📺 Demo Video

Watch a walkthrough of PrivyBallot in action:

[PrivyBallot Demo Video on Loom](https://www.loom.com/share/aff352aacbd2416a8630ec5023a95901?sid=ae653287-a0ac-4848-a04d-a7d043b27567)

---

## 🎯 **What Makes PrivyBallot Special**

### **Complete Privacy**

- ✅ **Vote choices are never visible** - Even on the blockchain, individual votes remain encrypted
- ✅ **Confidential tallying** - Vote counts are computed on encrypted data without revealing interim results
- ✅ **Zero-knowledge voting** - No one can determine how you voted, including validators and contract owners

### **Transparency & Trust**

- ✅ **Verifiable results** - Final tallies are cryptographically verified by Zama's decryption oracle
- ✅ **Open source** - All smart contract code is auditable
- ✅ **Immutable voting records** - Blockchain ensures tamper-proof voting history

### **Democratic Features**

- 🏛️ **DAO governance** - Anyone can create proposals
- ⏰ **Time-bound voting** - Proposals have configurable deadlines
- 🔒 **Anti-manipulation** - Prevents double voting and vote buying
- 🌐 **Decentralized** - No central authority controls the voting process

## 🏗️ **Architecture**

### **Smart Contract (Backend)**

```
📁 backend/
├── contracts/FHEVoting.sol    # Main ConfidentialVotingDAO contract
├── test/                      # Comprehensive test suite
├── deploy/                    # Deployment scripts
└── hardhat.config.ts          # Blockchain configuration
```

**Key Contract Features:**

- **Proposal Creation**: Anyone can create voting proposals
- **Encrypted Voting**: Uses `ebool` and `euint128` for confidential operations
- **Homomorphic Operations**: Vote tallying without decryption
- **Oracle Integration**: Zama KMS for secure result revelation

### **Frontend (Web App)**

```
📁 frontend/
├── src/app/                   # Next.js 15 application
├── public/                    # Static assets
└── package.json               # Frontend dependencies
```

**Tech Stack:**

- **Next.js 15** with Turbopack for lightning-fast development
- **React 19** for modern UI components
- **TypeScript** for type safety
- **Ethers.js** for blockchain interaction
- **FHEVM.js** for client-side encryption

## 🛠️ **Technology Stack**

### **Blockchain & Privacy**

- **[Zama FHEVM](https://docs.zama.ai/fhevm)** - Fully Homomorphic Encryption on Ethereum
- **[Hardhat](https://hardhat.org/)** - Development environment and testing framework
- **[Ethers.js](https://ethers.org/)** - Ethereum JavaScript library
- **Solidity 0.8.24** - Smart contract programming language

### **Frontend & User Experience**

- **[Next.js 15](https://nextjs.org/)** - Full-stack React framework
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Turbopack](https://turbo.build/)** - Ultra-fast bundler

### **Development & Testing**

- **[Mocha](https://mochajs.org/)** & **[Chai](https://www.chaijs.com/)** - Testing framework
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** - Code quality tools
- **[Solhint](https://github.com/protofire/solhint)** - Solidity linting

## 🚀 **Getting Started**

### **Prerequisites**

- Node.js ≥ 20
- npm ≥ 7.0.0
- Git

### **Installation**

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/PrivyBallot.git
   cd PrivyBallot
   ```

2. **Install dependencies**

   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   npx hardhat vars set MNEMONIC "your twelve word mnemonic phrase here"
   npx hardhat vars set INFURA_API_KEY "your_infura_key_here"  # Optional for testnet
   ```

### **Development Workflow**

#### **Backend Development**

```bash
# Compile smart contracts
npm run build:backend

# Run comprehensive tests
npm run test

# Start local blockchain with deployed contracts
npm run dev:backend

# Deploy to local network
npm run deploy:local
```

#### **Frontend Development**

```bash
# Start Next.js development server
npm run dev:frontend

# Or run both backend and frontend simultaneously
npm run dev
```

#### **Testing on Different Networks**

**Local Development (Recommended for development)**

```bash
cd backend
npx hardhat node                    # Terminal 1: Start local blockchain
npx hardhat test --network localhost # Terminal 2: Run tests
```

**Sepolia Testnet (For production-like testing)**

```bash
cd backend
npx hardhat test --network sepolia   # Requires Sepolia ETH
npx hardhat deploy --network sepolia # Deploy to testnet
```

## 🗳️ **How Voting Works**

### **1. Proposal Creation**

```solidity
function createProposal(string calldata title, uint64 durationSeconds)
    external returns (uint256 id)
```

- Anyone can create a proposal with a title and voting duration
- Returns a unique proposal ID for voting

### **2. Confidential Voting**

```solidity
function vote(uint256 id, externalEbool encChoice, bytes calldata inputProof)
    external
```

- Voters submit encrypted boolean choices (true = YES, false = NO)
- Includes zero-knowledge proof to prevent invalid votes
- Vote tallies are updated using homomorphic operations

### **3. Result Revelation**

```solidity
function requestReveal(uint256 id) external
function fulfillReveal(uint256 requestId, uint128 yesPlain, uint128 noPlain, bytes[] memory signatures)
```

- After voting deadline, anyone can request result decryption
- Zama's KMS oracle securely decrypts and returns final tallies
- Cryptographic signatures ensure authentic results

## 🔒 **Privacy Guarantees**

| Data                    | Privacy Level                | Details                                                  |
| ----------------------- | ---------------------------- | -------------------------------------------------------- |
| **Vote Choices**        | 🔐 **Completely Private**    | Never visible to anyone, including validators            |
| **Vote Tallies**        | 🔐 **Private During Voting** | Only revealed after voting period ends                   |
| **Final Results**       | 🌐 **Public**                | Transparently visible after reveal                       |
| **Voter Participation** | ⚠️ **Semi-Private**          | Addresses that voted are visible (but not their choices) |

## 📊 **Example Voting Flow**

```typescript
// 1. Create a proposal
const proposalTx = await votingDAO.createProposal(
  "Should we implement feature X?",
  3600 // 1 hour voting period
);

// 2. Voters cast encrypted votes
const encryptedYes = await fhevmInstance
  .createEncryptedInput(contractAddress, voterAddress)
  .addBool(true) // YES vote
  .encrypt();

await votingDAO.vote(
  proposalId,
  encryptedYes.handles[0],
  encryptedYes.inputProof
);

// 3. After deadline, request results
await votingDAO.requestReveal(proposalId);

// 4. Oracle reveals final tallies
// Results: { yes: 150, no: 75 }
```

## 🧪 **Testing**

We have comprehensive test coverage including:

- ✅ **Proposal creation and validation**
- ✅ **Confidential voting with encrypted inputs**
- ✅ **Double voting prevention**
- ✅ **Deadline enforcement**
- ✅ **Multi-voter scenarios**
- ✅ **Result revelation workflow**
- ✅ **Edge cases and error conditions**

```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage report
```

## 🚀 **Deployment**

### **Local Development**

Perfect for development and testing:

```bash
npm run dev:backend     # Starts local blockchain
npm run deploy:local    # Deploys contracts locally
```

### **Sepolia Testnet**

For production-like testing with real encryption:

```bash
cd backend
npx hardhat deploy --network sepolia
```

## 🤝 **Contributing**

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 **Support**

- 📚 **Documentation**: [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- 💬 **Community**: [Zama Discord](https://discord.com/invite/zama)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/PrivyBallot/issues)

## 🌟 **Acknowledgments**

- **[Zama](https://www.zama.ai/)** for pioneering FHE technology and FHEVM
- **Ethereum** community for the foundational blockchain infrastructure
- **Open source** contributors who make projects like this possible

---

**Built with ❤️ for privacy-preserving democracy**
