"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { MOCK_CONTRACTS, STATUS_COLORS, fmtUsd, shortKey } from "@/lib/mock";

type Tab = "all" | "active" | "disputed" | "resolved";

const TABS: { id: Tab; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "active",   label: "Active" },
  { id: "disputed", label: "Disputed" },
  { id: "resolved", label: "Resolved" },
];

export default function ContractsPage() {
  const [tab, setTab] = useState<Tab>("all");

  const filtered = tab === "all"
    ? MOCK_CONTRACTS
    : MOCK_CONTRACTS.filter((c) => c.status.toLowerCase() === tab);

  const countFor = (id: Tab) =>
    id === "all" ? MOCK_CONTRACTS.length : MOCK_CONTRACTS.filter((c) => c.status.toLowerCase() === id).length;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-shell section-shell-wide content-stack">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="text-2xl font-bold text-white">Contracts</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Manage, review, and initiate streaming escrow agreements
            </p>
          </div>
          <div className="page-header-actions">
            <Link href="/contracts/new" className="btn btn-primary">New Contract</Link>
          </div>
        </div>

        <div className="segmented-control" role="tablist" aria-label="Filter contracts">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`segment-button${tab === t.id ? " active" : ""}`}
              role="tab"
              aria-selected={tab === t.id}
            >
              {t.label}
              <span className="segment-count">{countFor(t.id)}</span>
            </button>
          ))}
        </div>

        <div className="card overflow-hidden desktop-table">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse data-table">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
                  {["Contract Details", "Contractor", "Status", "Progress", "Escrowed", "Rate", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-label shrink-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const { dot } = STATUS_COLORS[c.status];
                  const pct = Math.round((c.currentMilestone / c.totalMilestones) * 100);

                  let chipClass = "chip-indigo";
                  if (c.status === "Active") chipClass = "chip-emerald";
                  else if (c.status === "Paused") chipClass = "chip-amber";
                  else if (c.status === "Disputed") chipClass = "chip-red";
                  else if (c.status === "Resolved") chipClass = "chip-violet";

                  return (
                    <tr
                      key={c.id}
                      className="table-row"
                    >
                      <td className="px-5 py-5">
                        <p className="text-sm font-semibold text-white">{c.title}</p>
                        <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>{c.id}</p>
                      </td>
                      <td className="px-5 py-5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <p className="font-medium text-white">{c.contractorAlias}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>{shortKey(c.contractor)}</p>
                      </td>
                      <td className="px-5 py-5">
                        <span className={`chip ${chipClass} text-[10px]`}>
                          <span className="dot-live blink" style={{ width: 6, height: 6, background: dot }} />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="progress-track flex-1">
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold font-mono text-white">{pct}%</span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {c.currentMilestone} of {c.totalMilestones} Milestones Completed
                        </p>
                      </td>
                      <td className="px-5 py-5 text-sm">
                        <p className="font-semibold text-white">{fmtUsd(c.accruedUsd)}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total: {fmtUsd(c.totalBudgetUsd)}</p>
                      </td>
                      <td className="px-5 py-5 text-sm font-mono text-white">
                        ${c.ratePerHour}/hr
                      </td>
                      <td className="px-5 py-5 text-right">
                        <Link href={`/contracts/${c.index}`} className="btn btn-secondary btn-sm">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>
              <p className="text-4xl mb-4">📭</p>
              <p className="font-medium text-white">No contracts found</p>
              <p className="text-xs mt-1">There are no contracts matching the selection.</p>
            </div>
          )}
        </div>

        <div className="mobile-card-list">
          {filtered.map((c) => {
            const { dot } = STATUS_COLORS[c.status];
            const pct = Math.round((c.currentMilestone / c.totalMilestones) * 100);
            let chipClass = "chip-indigo";
            if (c.status === "Active") chipClass = "chip-emerald";
            else if (c.status === "Paused") chipClass = "chip-amber";
            else if (c.status === "Disputed") chipClass = "chip-red";
            else if (c.status === "Resolved") chipClass = "chip-violet";

            return (
              <article key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{c.title}</p>
                    <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>{c.id}</p>
                  </div>
                  <span className={`chip ${chipClass} text-[10px] shrink-0`}>
                    <span className="dot-live blink" style={{ width: 6, height: 6, background: dot }} />
                    {c.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Contractor</p>
                    <p className="font-medium text-white">{c.contractorAlias}</p>
                    <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{shortKey(c.contractor)}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Budget</p>
                    <p className="font-semibold text-white">{fmtUsd(c.accruedUsd)}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>of {fmtUsd(c.totalBudgetUsd)}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                    <span>{c.currentMilestone} of {c.totalMilestones} milestones</span>
                    <span className="mono text-white">{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <Link href={`/contracts/${c.index}`} className="btn btn-secondary btn-sm w-full">
                  View Details
                </Link>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
