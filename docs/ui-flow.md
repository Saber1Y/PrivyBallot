# PrivyBallot UI Plan

Preview this file with Mermaid:

- Install VS Code extension: Markdown Preview Mermaid Support (bierner.markdown-mermaid)
- Open Command Palette → “Open Preview to the Side”

## Flow

```mermaid
flowchart TD
  A[Landing / Proposals List] -->|Create Proposal| B[Create Proposal Modal]
  A -->|Open Proposal| C[Proposal Details]
  B -->|Submit| A

  C -->|Vote Yes/No| D[Encrypt Input via Relayer SDK]
  D -->|handles + inputProof| E[Contract vote(id, encChoice, proof)]
  C -->|Request Reveal (after deadline)| F[requestReveal(id)]

  E --> G[VoteCast Event]
  F --> H[RevealRequested Event] --> I[Relayer/KMS Decrypt]
  I --> J[Revealed Event with yes/no]
  J --> C

  subgraph Status
    S1[Wallet Connected]
    S2[Network OK]
    S3[FHEVM Initialized]
  end
```

## Pages

- Proposals List (default)
- Proposal Details
- Create Proposal (modal/page)

## Core Components

- Header: Connect button, network badge, encryption status pill
- ProposalCard, ProposalList
- ProposalDetail (meta, timeline, events)
- VotePanel (Yes/No, disabled states)
- CreateProposalModal (Title, Duration)
- StatusPill, Toast/Errors

## States & UX

- Loading: skeletons for list/detail
- Errors: inline + toast (contract, relayer)
- Disabled states: not connected, wrong network, FHE not ready, already voted, voting closed
- Optimistic updates on create proposal; event-driven refresh on VoteCast/Revealed

## Data (phase 1: mock; phase 2: on-chain)

- Reads: nextProposalId, proposals(id), hasVoted(id, addr)
- Writes: createProposal(title, duration), vote(id, encChoice, inputProof), requestReveal(id)

## FHE/Relayer Integration (phase 2)

1. Initialize FHEVM service on client-ready and wallet connect
2. On vote: createEncryptedVote(contract, user, bool) → {handles[0], inputProof}
3. Call vote(id, encChoice, inputProof)
4. After deadline: requestReveal(id)
5. Listen to events: ProposalCreated, VoteCast, RevealRequested, Revealed

## Milestones

- M1: UI shell + list + detail + create (mock data)
- M2: Wire read hooks to contract
- M3: FHEVM init + encrypted voting
- M4: Reveal flow + results display
- M5: Polishing, errors, loading, toasts
