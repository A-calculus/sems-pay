"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { use } from "react";
import {
  MOCK_CONTRACTS,
  STATUS_COLORS,
  fmtUsd,
  shortKey,
  timeRemainingMs,
  fmtDuration,
  type Milestone,
} from "@/lib/mock";

const FIVE_HOURS = 5 * 60 * 60 * 1000;

// ── Milestone timeline ─────────────────────────────────────────
function MilestoneTimeline({ milestones, current }: { milestones: Milestone[]; current: number }) {
  return (
    <div className="flex flex-col gap-4 mt-2">
      {milestones.map((m, i) => (
        <div key={m.id} className="milestone-row">
          <div className={`milestone-icon ${m.done ? "done" : i === current ? "active" : ""}`}>
            {m.done ? "✓" : i + 1}
          </div>
          <div
            className="card px-4 py-3 ml-2"
            style={{ borderColor: i === current && !m.done ? "var(--border-mid)" : undefined }}
          >
            <div className="card-header">
              <div className="card-title-area">
                <p className="text-sm font-semibold text-white text-wrap-safe">{m.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Milestone #{i + 1}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: m.done ? "var(--emerald-400)" : "var(--text-secondary)" }}>
                  {fmtUsd(m.amount)}
                </p>
                <span
                  className="text-xs font-semibold uppercase tracking-wider text-[10px]"
                  style={{ color: m.done ? "var(--emerald-400)" : i === current ? "var(--amber-400)" : "var(--text-muted)" }}
                >
                  {m.done ? "Approved" : i === current ? "Accruing" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dispute timer ──────────────────────────────────────────────
function DisputeTimer({ assignedAt }: { assignedAt: string }) {
  const [remaining, setRemaining] = useState(() => timeRemainingMs(assignedAt, FIVE_HOURS));

  useEffect(() => {
    const id = setInterval(() => setRemaining(timeRemainingMs(assignedAt, FIVE_HOURS)), 1000);
    return () => clearInterval(id);
  }, [assignedAt]);

  const pct = Math.max(0, (remaining / FIVE_HOURS) * 100);
  const urgent = pct < 20;

  return (
    <div
      className="panel panel-pad card-stack"
      style={{ borderColor: urgent ? "rgba(239,68,68,0.4)" : undefined }}
    >
      <div className="card-header">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-wrap-safe" style={{ color: urgent ? "var(--red-400)" : "var(--amber-400)" }}>
          <span>⚖️</span> Dispute Escaped to Jury
        </h3>
        {urgent && (
          <span className="chip chip-red text-[9px] font-bold">
            <span className="dot-live blink bg-red-400" />
            Time Running Out
          </span>
        )}
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs mb-1.5">
          <span style={{ color: "var(--text-muted)" }}>Arbitrator vote countdown</span>
          <span className="mono font-bold" style={{ color: urgent ? "var(--red-400)" : "var(--amber-400)" }}>
            {fmtDuration(remaining)}
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${pct}%`,
              background: urgent
                ? "linear-gradient(90deg, var(--red-500), #f97316)"
                : "linear-gradient(90deg, var(--amber-500), var(--amber-400))",
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        Jury arbitrators must submit their split decision within 5 hours. Failure cycles to the next jury member.
      </p>
    </div>
  );
}

// ── Live stream accrual ────────────────────────────────────────
function StreamBadge({ ratePerHour, active }: { ratePerHour: number; active: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const earned = ((ratePerHour / 3600) * tick).toFixed(4);

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-2.5 px-3 py-2 rounded-xl text-sm"
      style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)" }}
    >
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-ring" />
      <span style={{ color: "var(--text-secondary)" }}>Live stream:</span>
      <span className="mono font-bold text-emerald-400">+{earned} accrued this session</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const contract = MOCK_CONTRACTS.find((c) => c.index === parseInt(id));

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-lg font-bold text-white mb-2">Escrow Contract Not Found</h2>
          <Link href="/contracts" className="btn btn-secondary mt-2">← Back to contracts</Link>
        </div>
      </div>
    );
  }

  const { dot } = STATUS_COLORS[contract.status];
  const completedAmount = contract.milestones
    .filter((m) => m.done)
    .reduce((s, m) => s + m.amount, 0);

  let chipClass = "chip-indigo";
  if (contract.status === "Active") chipClass = "chip-emerald";
  else if (contract.status === "Paused") chipClass = "chip-amber";
  else if (contract.status === "Disputed") chipClass = "chip-red";
  else if (contract.status === "Resolved") chipClass = "chip-violet";

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-shell" style={{ maxWidth: 1040 }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--text-muted)" }}>
          <Link href="/contracts" className="hover:text-white transition-colors">Contracts</Link>
          <span>/</span>
          <span style={{ color: "var(--text-secondary)" }}>{contract.id}</span>
        </div>

        {/* Header */}
        <div className="page-header">
          <div className="page-title-group">
            <div className="meta-line mb-2.5">
              <span className={`chip ${chipClass} text-[10px]`}>
                <span className="dot-live blink" style={{ width: 6, height: 6, background: dot }} />
                {contract.status}
              </span>
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{contract.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-white text-wrap-safe">{contract.title}</h1>
            <div className="meta-line text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              <span>Client: <span className="mono text-white">{shortKey(contract.client, 6)}</span></span>
              <span>Contractor: <span className="font-semibold text-white">{contract.contractorAlias}</span> <span className="mono">({shortKey(contract.contractor)})</span></span>
            </div>
          </div>

          <div className="page-header-actions">
            {contract.status === "Active" && (
              <button className="btn btn-secondary btn-sm">Pause Stream</button>
            )}
            {contract.status === "Paused" && (
              <button className="btn btn-primary btn-sm">Resume Stream</button>
            )}
            {(contract.status === "Active" || contract.status === "Paused") && (
              <button className="btn btn-danger btn-sm">Raise Dispute</button>
            )}
          </div>
        </div>

        {/* Stream ticker */}
        {contract.status === "Active" && (
          <div className="mb-6">
            <StreamBadge ratePerHour={contract.ratePerHour} active={true} />
          </div>
        )}

        {/* Dispute alert */}
        {contract.status === "Disputed" && contract.disputeAssignedAt && (
          <div className="mb-6">
            <DisputeTimer assignedAt={contract.disputeAssignedAt} />
          </div>
        )}

        {/* Main layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Milestone timeline */}
          <div className="lg:col-span-2">
            <div className="panel panel-pad">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="font-semibold text-white text-sm">Milestone Deliverables</h2>
                {contract.status === "Active" && (
                  <button className="btn btn-primary btn-sm">✓ Approve Milestone</button>
                )}
              </div>
              <MilestoneTimeline milestones={contract.milestones} current={contract.currentMilestone} />
            </div>
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-4">
            {/* Financial Info */}
            <div className="panel panel-pad">
              <h2 className="font-semibold text-white text-sm mb-4">Financials</h2>
              <div className="flex flex-col gap-3">
                <FinRow label="Total Budget" value={fmtUsd(contract.totalBudgetUsd)} />
                <FinRow label="Accrued (FHE)" value={fmtUsd(contract.accruedUsd)} highlight />
                <FinRow label="Total Paid" value={fmtUsd(completedAmount)} />
                <FinRow label="Wage Rate" value={`$${contract.ratePerHour}/hr`} />
                <FinRow label="Escrow Balance" value={fmtUsd(contract.totalBudgetUsd - completedAmount)} />
              </div>

              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-dim)" }}>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                  <span>Escrow consumption</span>
                  <span>{Math.round((contract.accruedUsd / contract.totalBudgetUsd) * 100)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${(contract.accruedUsd / contract.totalBudgetUsd) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="panel panel-pad">
              <h2 className="font-semibold text-white text-sm mb-4">Escrow Details</h2>
              <div className="flex flex-col gap-2.5 text-xs">
                <MetaRow label="Created Date" value={contract.periodStart} />
                <MetaRow label="Target End Date" value={contract.periodEnd} />
                <MetaRow label="Milestone State" value={`${contract.currentMilestone} of ${contract.totalMilestones}`} />
              </div>
            </div>

            {/* Security shield notice */}
            <div
              className="panel panel-pad text-xs"
              style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)" }}
            >
              <p className="font-semibold text-indigo-300 mb-1">🔐 Privacy Secured</p>
              <p style={{ color: "var(--text-muted)" }}>
                Contract values are obscured on-chain using homomorphic logic. All escrow functions compute privately.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FinRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="kv-row text-sm">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="kv-value" style={{ color: highlight ? "var(--emerald-400)" : "var(--text-secondary)", fontWeight: highlight ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="kv-row">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="kv-value">{value}</span>
    </div>
  );
}
