/** Shared mock data — replace with on-chain reads via SDK */

export type ContractStatus = "Active" | "Paused" | "Disputed" | "Resolved";

export interface Milestone {
  id: number;
  label: string;
  amount: number;
  done: boolean;
}

export interface Contract {
  id: string;
  index: number;
  client: string;
  contractor: string;
  contractorAlias: string;
  title: string;
  status: ContractStatus;
  totalMilestones: number;
  currentMilestone: number;
  milestones: Milestone[];
  totalBudgetUsd: number;
  accruedUsd: number;
  ratePerHour: number;
  periodStart: string;   // ISO date string
  periodEnd: string;
  disputeArbitrator?: string;
  disputeAssignedAt?: string;
}

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: "CTR-001",
    index: 0,
    client: "7xKp9mNqABfF3sVLrZwY1dEaT4uP8cKmXhDjRb2nH5f",
    contractor: "3mVpLqRxKzT7nUoW9aEcSdFjYhBgN2vXwPkL6rA4iQ8",
    contractorAlias: "alex.sol",
    title: "DeFi Dashboard UI — Milestone Design",
    status: "Active",
    totalMilestones: 4,
    currentMilestone: 1,
    milestones: [
      { id: 0, label: "Wireframes & Spec", amount: 800, done: true },
      { id: 1, label: "Component Library", amount: 1200, done: false },
      { id: 2, label: "Integration Tests", amount: 600, done: false },
      { id: 3, label: "Final Delivery", amount: 400, done: false },
    ],
    totalBudgetUsd: 3000,
    accruedUsd: 1840.52,
    ratePerHour: 75,
    periodStart: "2026-06-01",
    periodEnd: "2026-07-15",
  },
  {
    id: "CTR-002",
    index: 1,
    client: "7xKp9mNqABfF3sVLrZwY1dEaT4uP8cKmXhDjRb2nH5f",
    contractor: "9nBcMkTrPqW4vEaXzYhFgD6sL2uN7xKjCiVwA5oR1eZ",
    contractorAlias: "maya.dev",
    title: "Solana Smart Contract Audit",
    status: "Disputed",
    totalMilestones: 2,
    currentMilestone: 1,
    milestones: [
      { id: 0, label: "Static Analysis Report", amount: 1500, done: true },
      { id: 1, label: "Remediation Verification", amount: 1000, done: false },
    ],
    totalBudgetUsd: 2500,
    accruedUsd: 1500,
    ratePerHour: 120,
    periodStart: "2026-06-10",
    periodEnd: "2026-06-30",
    disputeArbitrator: "ARB-7f2a...9c3b",
    disputeAssignedAt: "2026-06-27T04:12:00Z",
  },
  {
    id: "CTR-003",
    index: 2,
    client: "7xKp9mNqABfF3sVLrZwY1dEaT4uP8cKmXhDjRb2nH5f",
    contractor: "5tGhJkLmNpQrSuVwXyZaAbBcDdEeFfGgHh2i3j4k5l",
    contractorAlias: "riku.web3",
    title: "Backend GraphQL API Development",
    status: "Resolved",
    totalMilestones: 3,
    currentMilestone: 3,
    milestones: [
      { id: 0, label: "Schema Design", amount: 500, done: true },
      { id: 1, label: "Resolvers & Auth", amount: 1200, done: true },
      { id: 2, label: "Deployment & Docs", amount: 300, done: true },
    ],
    totalBudgetUsd: 2000,
    accruedUsd: 2000,
    ratePerHour: 60,
    periodStart: "2026-05-15",
    periodEnd: "2026-06-15",
  },
];

export const STATUS_COLORS: Record<ContractStatus, { badge: string; dot: string }> = {
  Active:   { badge: "badge-active",   dot: "#10b981" },
  Paused:   { badge: "badge-paused",   dot: "#f59e0b" },
  Disputed: { badge: "badge-disputed", dot: "#ef4444" },
  Resolved: { badge: "badge-resolved", dot: "#6366f1" },
};

/** Format lamport-like USD amounts */
export function fmtUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Shorten a pubkey */
export function shortKey(k: string, chars = 4): string {
  return `${k.slice(0, chars)}...${k.slice(-chars)}`;
}

/** Time remaining from an ISO timestamp (ms) */
export function timeRemainingMs(isoStr: string, limitMs: number): number {
  const assigned = new Date(isoStr).getTime();
  const expires  = assigned + limitMs;
  return Math.max(0, expires - Date.now());
}

export function fmtDuration(ms: number): string {
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h}h ${m}m ${s}s`;
}
