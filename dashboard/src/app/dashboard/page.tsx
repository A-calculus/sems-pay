"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  MOCK_CONTRACTS,
  STATUS_COLORS,
  fmtUsd,
  shortKey,
  type Contract,
} from "@/lib/mock";

// ── Live accrual counter ───────────────────────────────────────
function LiveAccrual({ initial, ratePerHour, active }: { initial: number; ratePerHour: number; active: boolean }) {
  const [val, setVal] = useState(initial);
  useEffect(() => {
    if (!active) return;
    const ratePerMs = ratePerHour / 3_600_000;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      setVal((v) => parseFloat((v + ratePerMs * (now - last)).toFixed(4)));
      last = now;
    }, 250);
    return () => clearInterval(id);
  }, [active, ratePerHour]);

  return (
    <span className="mono font-bold" style={{ color: active ? "var(--emerald-400)" : "var(--text-secondary)" }}>
      {fmtUsd(val)}
    </span>
  );
}

// ── Progress bar ──────────────────────────────────────────────
function MilestoneBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
        <span>Milestone {current}/{total}</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Contract card ──────────────────────────────────────────────
function ContractCard({ c }: { c: Contract }) {
  const { dot } = STATUS_COLORS[c.status];
  const pctBudget = Math.min(100, (c.accruedUsd / c.totalBudgetUsd) * 100);

  // Map local statuses to design tokens
  let chipClass = "chip-indigo";
  if (c.status === "Active") chipClass = "chip-emerald";
  else if (c.status === "Paused") chipClass = "chip-amber";
  else if (c.status === "Disputed") chipClass = "chip-red";
  else if (c.status === "Resolved") chipClass = "chip-violet";

  return (
    <div className="card card-lift p-5 card-stack min-h-[260px]">
      <div className="card-header">
        <div className="card-title-area">
          <div className="meta-line">
            <span className={`chip ${chipClass} text-[10px]`}>
              <span className="dot-live blink" style={{ width: 6, height: 6, background: dot }} />
              {c.status}
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{c.id}</span>
          </div>
          <h3 className="font-semibold text-white text-sm leading-tight text-wrap-safe">{c.title}</h3>
          <p className="text-xs text-wrap-safe" style={{ color: "var(--text-secondary)" }}>
            {c.contractorAlias} <span className="mono text-muted">({shortKey(c.contractor)})</span>
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <p className="text-[10px] mb-0.5 text-label">Accrued</p>
          <LiveAccrual initial={c.accruedUsd} ratePerHour={c.ratePerHour} active={c.status === "Active"} />
        </div>
      </div>

      {/* Budget bar */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
          <span>Budget consumed</span>
          <span>{fmtUsd(c.totalBudgetUsd)}</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${pctBudget}%`,
              background:
                c.status === "Disputed"
                  ? "linear-gradient(90deg, var(--red-500), #f97316)"
                  : undefined,
            }}
          />
        </div>
      </div>

      <MilestoneBar current={c.currentMilestone} total={c.totalMilestones} />

      <div className="divider" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-auto">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Rate: <span className="mono text-white">${c.ratePerHour}/hr</span>
        </span>
        <Link href={`/contracts/${c.index}`} className="btn btn-secondary btn-sm">
          View Details
        </Link>
      </div>
    </div>
  );
}

// ── Summary stat card ─────────────────────────────────────────
function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card stat-card p-5">
      <p className="text-label mb-1.5">{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{sub}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const active = MOCK_CONTRACTS.filter((c) => c.status === "Active").length;
  const disputed = MOCK_CONTRACTS.filter((c) => c.status === "Disputed").length;
  const totalEscrowed = MOCK_CONTRACTS.reduce((s, c) => s + c.totalBudgetUsd, 0);
  const totalAccrued  = MOCK_CONTRACTS.reduce((s, c) => s + c.accruedUsd, 0);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-shell section-shell-wide content-stack">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="text-2xl font-bold text-white">Overview</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Manage active escrow contracts and streaming positions in real-time
            </p>
          </div>
          <div className="page-header-actions">
            <Link href="/contracts/new" className="btn btn-primary">
              New Contract
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="dashboard-stats">
          <SummaryCard
            label="Total Escrowed"
            value={fmtUsd(totalEscrowed)}
            sub={`across ${MOCK_CONTRACTS.length} contracts`}
            color="var(--indigo-300)"
          />
          <SummaryCard
            label="Total Accrued"
            value={fmtUsd(totalAccrued)}
            sub="accumulated wait for release"
            color="var(--emerald-400)"
          />
          <SummaryCard
            label="Active Streams"
            value={String(active)}
            sub="currently per-second streaming"
            color="var(--cyan-400)"
          />
          <SummaryCard
            label="Open Disputes"
            value={String(disputed)}
            sub={disputed ? "requires jury action" : "all dispute-free"}
            color={disputed ? "var(--red-400)" : "var(--indigo-400)"}
          />
        </div>

        {/* Contracts grid */}
        <div className="section-kicker">
          <span className="text-xs text-label">ALL CONTRACTS</span>
        </div>
        <div className="dashboard-contracts">
          {MOCK_CONTRACTS.map((c) => (
            <ContractCard key={c.id} c={c} />
          ))}

          {/* New contract CTA card */}
          <Link
            href="/contracts/new"
            className="card card-lift p-5 flex flex-col items-center justify-center gap-3 min-h-[260px] text-center"
            style={{ borderStyle: "dashed", borderColor: "var(--border-mid)", textDecoration: "none" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: "rgba(99,102,241,0.06)", border: "1px solid var(--border-mid)" }}
            >
              +
            </div>
            <p className="text-sm font-semibold text-white">Create Escrow Contract</p>
            <p className="text-xs" style={{ color: "var(--text-muted)", maxWidth: 180 }}>
              Initiate a streaming payroll deal with custom milestones.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
