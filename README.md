# Sems-Pay

**Confidential, Real-Time Freelance Escrow on Solana**

Sems-Pay is a next-generation decentralized freelance escrow and payroll streaming protocol. It enables employers and remote workers to engage in trustless, milestone-based contracts where wages stream second-by-second into an encrypted vault. Using advanced cryptography and off-chain execution environments, Sems-Pay ensures complete financial privacy and instant, low-latency settlement.

## Features

- **Real-Time Wage Streaming:** Leverages MagicBlock TEE (Trusted Execution Environment) Ephemeral Rollups to compute per-second wage accruals with sub-10ms latency.
- **Absolute Privacy with FHE:** Integrates Inco Lightning Fully Homomorphic Encryption (FHE) so that salary rates, hourly wages, and total escrow budgets are mathematically invisible on-chain.
- **Decentralized Anonymous Arbitration:** Disputes are resolved by an anonymous pool of community arbitrators who are randomly assigned and have a strict 5-hour window to submit a verdict, preventing bribery and stalled funds.
- **Universal Token Support:** Employers can fund the escrow with any token, and freelancers can withdraw in their preferred asset. Internal accounting is seamlessly pegged to USD via Jupiter Ultra API integrations.
- **B2B Integration SDK:** A fully featured `@sems-pay/sdk` allows seamless integration into existing remote job boards and DAO management platforms.

## Architecture

1. **Solana Program (Smart Contract):** Handles the core state machine—initializing contracts, registering arbitrators, tracking milestones, and settling funds.
2. **Backend Orchestrator (Express.js):** Manages Jupiter Swap proxies for seamless USD conversions and handles the heartbeat-based queue system for the anonymous arbitrator pool.
3. **Frontend Dashboard (Next.js):** A premium, high-fidelity user interface built with modern Web3 design principles, allowing users to create contracts, monitor live streaming accruals, and act as arbitrators.
4. **Privacy Layer:** Inco FHE handles encrypted numerical operations for salaries without revealing the underlying data.
5. **Execution Layer:** MagicBlock handles the high-frequency state transitions required for streaming payments efficiently.

## Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- Rust & Cargo
- Solana CLI
- Anchor CLI

### 1. Solana Program
Navigate to the program directory to build and test the Anchor smart contracts:
```bash
cd programs/sems-pay
anchor build
anchor test
```

### 2. Backend Orchestrator
The Express backend manages swap execution and arbitrator queues.
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Dashboard
The Next.js dashboard provides the core user interface.
```bash
cd dashboard
npm install
npm run dev
```
Access the application at `http://localhost:3000`.

## Directory Structure
- `/programs/sems-pay` - Solana Anchor Program (Rust)
- `/backend` - Express.js backend for off-chain orchestration (TypeScript)
- `/dashboard` - Next.js App Router frontend dashboard (React, Tailwind CSS)
- `/packages/sdk` - TypeScript SDK for B2B platform integrations

## License
MIT License
