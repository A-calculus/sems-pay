# Sems-Pay Task Checklist

- [x] **Phase 1: Solana Program (Anchor / Rust)**
  - [x] Initialize Anchor project structures for `sems-pay` on Devnet.
  - [x] Implement the Escrow contract state representing client, contractor, USD balance, milestones, and dispute state (`state.rs`).
  - [x] Program streaming logic via MagicBlock TEE CPI helpers (`helpers.rs`).
  - [x] Build the crowd-arbitration module with 5-hour timeout cycling and support escalation (`lib.rs`).
  - [x] Add the FHE confidentiality layer (Inco CPI wrappers) for rates and milestone values (`helpers.rs`).
  - [x] Write all program instruction contexts (`lib.rs` — `InitializeMaster`, `RegisterArbitrator`, `CreateContract`, `CrankAccrue`, `PauseContract`, `ResumeContract`, `ApproveMilestone`, `DisputeContract`, `PayDisputeFee`, `ResolveDispute`, `EscalateDispute`).

- [x] **Phase 2: Backend API & Swaps** (`sems-pay/backend/`)
  - [x] Express.js server with REST API (`server.ts`)
  - [x] Jupiter Ultra swap proxy endpoints for quote/execute plus deposit and withdrawal quote helpers (`routes/swap.ts`)
  - [x] In-memory arbitrator queue manager with heartbeat, random assignment, release, and 5-hour timeout cycling (`routes/arbitrator.ts`)
  - [x] Solana RPC read middleware for master config, contract PDA reads, and arbitrator registry reads (`solana.ts`, `routes/contract.ts`)
  - [ ] Production persistence for arbitrator pool (Redis/DB) and hardened Jupiter execute flow with signed-order handling

- [/] **Phase 3: SDK & Frontend**
  - [x] B2B SDK (`packages/sdk/`) — TypeScript client wrapping core program instructions and payout-resolution helper
  - [/] Frontend Dashboard (Next.js)
    - [x] Landing page with Sems-Pay product positioning and live demo card
    - [x] Dashboard overview page using mock contract data
    - [x] Client contract creation and management screens using mock/local flows
    - [x] Contractor milestone tracker/detail page using mock contract data
    - [x] Anonymous arbitrator dispute console using mock/local state
    - [ ] Privy authentication and embedded wallet connection
    - [ ] Live backend/API wiring for contract creation, swaps, arbitrator heartbeats, and Solana account reads
  - [/] Anchor test suite (`tests/sems-pay.ts`)
    - [x] Covers initialize, register arbitrator, create contract, pause/resume, approve milestone, and dispute resolve flows
    - [ ] Regenerate/use typed IDL instead of `any`
    - [ ] Add explicit tests for `crank_accrue`, `pay_dispute_fee`, and 5-hour escalation timeout
