"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { fmtUsd, fmtDuration, timeRemainingMs } from "@/lib/mock";

const FIVE_HOURS = 5 * 60 * 60 * 1000;

const MOCK_DISPUTES = [
  {
    contractId: "CTR-002",
    escrowUsd: 2500,
    totalMilestones: 2,
    currentMilestone: 1,
    summary: "Smart contract audit engagement. Client claims deliverables were incomplete. Contractor claims full scope was delivered per agreed spec.",
    submittedBy: "client",
    assignedAt: "2026-06-27T04:12:00Z",
    evidenceClient: "The remediation verification was not done to the agreed standard. I provided 3 issues that were unaddressed.",
    evidenceContractor: "All issues in the audit scope were addressed. The 3 items mentioned were out-of-scope additions.",
  },
];

type Verdict = "contractor" | "client" | null;

function Timer({ assignedAt }: { assignedAt: string }) {
  const [rem, setRem] = useState(() => timeRemainingMs(assignedAt, FIVE_HOURS));
  useEffect(() => {
    const id = setInterval(() => setRem(timeRemainingMs(assignedAt, FIVE_HOURS)), 1000);
    return () => clearInterval(id);
  }, [assignedAt]);

  const pct = Math.max(0, (rem / FIVE_HOURS) * 100);
  const urgent = pct < 20;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <span className="text-xs sm:w-20 sm:text-right font-mono" style={{ color: urgent ? "var(--red-400)" : "var(--amber-400)" }}>
        {fmtDuration(rem)}
      </span>
      <div className="progress-track flex-1">
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: urgent ? "linear-gradient(90deg, var(--red-500), #f97316)" : "linear-gradient(90deg, var(--amber-500), var(--amber-400))",
            transition: "width 1s linear",
          }}
        />
      </div>
      {urgent && <span className="chip chip-red text-[10px]">Urgent</span>}
    </div>
  );
}

function OnlineStatus({ online }: { online: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg max-w-full"
      style={{ background: online ? "rgba(16,185,129,0.08)" : "rgba(99,102,241,0.08)", border: `1px solid ${online ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)"}` }}>
      <span className={`w-2 h-2 rounded-full ${online ? "pulse-ring" : ""}`}
        style={{ background: online ? "#10b981" : "#475569" }} />
      <span className="text-xs font-semibold uppercase tracking-wider text-[10px] text-wrap-safe" style={{ color: online ? "#10b981" : "var(--text-muted)" }}>
        {online ? "Online — Eligible for cases" : "Offline"}
      </span>
    </div>
  );
}

export default function ArbitratorPage() {
  const [online, setOnline] = useState(false);
  const [selectedCase, setSelectedCase] = useState<typeof MOCK_DISPUTES[0] | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [split, setSplit] = useState({ contractor: 100, client: 0 });
  const [reasoning, setReasoning] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleVerdictSelect = (v: Verdict) => {
    setVerdict(v);
    if (v === "contractor") setSplit({ contractor: 100, client: 0 });
    else if (v === "client") setSplit({ contractor: 0, client: 100 });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSubmitting(false);
    setSubmitted(true);
  };

  // ── Onboarding / Registration ─────────────────────────────
  if (!online) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="section-shell section-shell-narrow content-stack">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4 float-y" aria-hidden="true">⚖️</div>
            <h1 className="text-3xl font-bold text-white mb-3">Become an Arbitrator</h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Join the anonymous dispute resolution pool. You&apos;ll be randomly assigned to active disputes,
              review anonymized evidence, and vote on fair outcomes — earning resolution fees.
            </p>
          </div>

          <div className="metric-grid">
            {[
              { icon: "🎭", label: "Fully Anonymous", desc: "Your identity is never revealed to the parties" },
              { icon: "⏱️", label: "5-Hour Window", desc: "Resolve in time or a new arbitrator is selected" },
              { icon: "💰", label: "Earn Fees", desc: "Collect the resolution fee upon successful vote" },
            ].map((f) => (
              <div key={f.label} className="card p-4 text-center">
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-xs font-semibold text-white mb-1">{f.label}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="panel panel-pad">
            <h2 className="text-sm font-semibold text-white mb-4">How it works</h2>
            <div className="flex flex-col gap-3">
              {[
                "Connect your wallet and go online. Your wallet is registered on-chain as an eligible arbitrator.",
                "When a dispute is raised, you may be randomly selected. You'll be notified immediately.",
                "Review the anonymized contract summary and evidence from both sides.",
                "Cast your verdict (pay contractor, refund client, or custom split) with reasoning.",
                "The escrow is settled on-chain. You receive the resolution fee.",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", marginTop: "1px" }}>
                    {i + 1}
                  </span>
                  <p style={{ color: "var(--text-secondary)" }}>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary w-full justify-center py-3 text-base" onClick={() => setOnline(true)}>
            Go Online as Arbitrator
          </button>
        </main>
      </div>
    );
  }

  // ── Case list ──────────────────────────────────────────────
  if (!selectedCase) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="section-shell content-stack" style={{ maxWidth: 920 }}>
          <div className="page-header">
            <div className="page-title-group">
              <h1 className="text-2xl font-bold text-white">Dispute Queue</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Cases assigned to your session
              </p>
            </div>
            <div className="page-header-actions">
              <OnlineStatus online={online} />
              <button className="btn btn-secondary btn-sm" onClick={() => setOnline(false)}>Go Offline</button>
            </div>
          </div>

          {MOCK_DISPUTES.length === 0 ? (
            <div className="card py-20 text-center">
              <p className="text-4xl mb-4">✅</p>
              <p className="text-white font-medium mb-1">No cases assigned yet</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Stay online — disputes are randomly assigned</p>
            </div>
          ) : (
            <div className="content-stack">
              {MOCK_DISPUTES.map((d) => (
                <div key={d.contractId} className="panel panel-pad">
                  <div className="panel-header">
                    <div className="card-title-area">
                      <div className="meta-line">
                        <span className="chip chip-red text-[10px]">
                          <span className="dot-live blink bg-red-400" />
                          Disputed
                        </span>
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{d.contractId}</span>
                      </div>
                      <p className="text-sm text-white font-semibold">Escrow: {fmtUsd(d.escrowUsd)}</p>
                      <p className="text-xs text-wrap-safe" style={{ color: "var(--text-secondary)" }}>
                        Raised by: {d.submittedBy} · {d.totalMilestones} milestones, at milestone {d.currentMilestone}
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm shrink-0" onClick={() => setSelectedCase(d)}>
                      Review Case
                    </button>
                  </div>

                  <div className="mb-2">
                    <p className="text-xs mb-2 text-label">Resolution window</p>
                    <Timer assignedAt={d.assignedAt} />
                  </div>

                  <p className="text-xs mt-3 leading-relaxed text-wrap-safe" style={{ color: "var(--text-secondary)" }}>
                    {d.summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Case review ────────────────────────────────────────────
  const d = selectedCase;
  const contractorPayout = Math.round(d.escrowUsd * (split.contractor / 100));
  const clientPayout = Math.round(d.escrowUsd * (split.client / 100));

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Navbar />
        <div className="panel panel-pad text-center mx-4">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Verdict Submitted</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            The escrow has been settled on-chain. Your resolution fee has been credited.
          </p>
          <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setSelectedCase(null); setVerdict(null); }}>
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="section-shell section-shell-narrow content-stack">
        <button
          className="flex items-center gap-1.5 text-xs mb-6 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          onClick={() => setSelectedCase(null)}
        >
          Back to queue
        </button>

        <div className="page-header">
          <h1 className="text-xl font-bold text-white text-wrap-safe">Case Review — {d.contractId}</h1>
          <OnlineStatus online={online} />
        </div>

        {/* Timer */}
        <div className="panel panel-pad">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-label">TIME REMAINING TO RESOLVE</p>
          </div>
          <Timer assignedAt={d.assignedAt} />
        </div>

        {/* Case summary */}
        <div className="panel panel-pad">
          <h2 className="text-sm font-semibold text-white mb-3">📋 Case Summary</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{d.summary}</p>
          <div className="mt-5 metric-grid text-center">
            <div className="card-inset p-3">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Escrow Balance</p>
              <p className="text-base font-bold text-white">{fmtUsd(d.escrowUsd)}</p>
            </div>
            <div className="card-inset p-3">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Milestone State</p>
              <p className="text-base font-bold text-white">{d.currentMilestone}/{d.totalMilestones}</p>
            </div>
            <div className="card-inset p-3">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Initiated By</p>
              <p className="text-base font-bold text-white capitalize">{d.submittedBy}</p>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="evidence-grid">
          <div className="panel panel-pad">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--amber-400)" }}>CLIENT STATEMENT</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{d.evidenceClient}</p>
          </div>
          <div className="panel panel-pad">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--cyan-400)" }}>CONTRACTOR STATEMENT</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{d.evidenceContractor}</p>
          </div>
        </div>

        {/* Verdict */}
        <div className="panel panel-pad">
          <h2 className="text-sm font-semibold text-white mb-4">🗳️ Your Verdict</h2>

          <div className="verdict-grid mb-5">
            {([
              { id: "contractor", label: "Pay Contractor", desc: "Work was delivered", color: "var(--cyan-400)" },
              { id: "client",     label: "Refund Client",  desc: "Work not delivered", color: "var(--amber-400)" },
              { id: null,         label: "Custom Split",   desc: "Partial completion",  color: "var(--violet-400)" },
            ] as { id: Verdict; label: string; desc: string; color: string }[]).map((opt) => (
              <button
                key={String(opt.id)}
                onClick={() => handleVerdictSelect(opt.id)}
                className="rounded-xl p-3 text-left transition-all cursor-pointer bg-transparent min-h-[88px]"
                style={{
                  background: verdict === opt.id ? `${opt.color}15` : "rgba(99,102,241,0.03)",
                  border: verdict === opt.id ? `1px solid ${opt.color}` : "1px solid var(--border-dim)",
                }}
              >
                <p className="text-xs font-bold mb-1 text-wrap-safe" style={{ color: verdict === opt.id ? opt.color : "var(--text-secondary)" }}>
                  {opt.label}
                </p>
                <p className="text-[11px] leading-relaxed text-wrap-safe" style={{ color: "var(--text-muted)" }}>{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Custom split slider */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs mb-2">
              <span style={{ color: "var(--text-muted)" }}>Contractor receives: <strong style={{ color: "var(--cyan-400)" }}>{split.contractor}%</strong> ({fmtUsd(contractorPayout)})</span>
              <span style={{ color: "var(--text-muted)" }}>Client receives: <strong style={{ color: "var(--amber-400)" }}>{split.client}%</strong> ({fmtUsd(clientPayout)})</span>
            </div>
            <input
              type="range" min={0} max={100} value={split.contractor}
              onChange={(e) => { const v = parseInt(e.target.value); setSplit({ contractor: v, client: 100 - v }); setVerdict(null); }}
              className="w-full"
              style={{ "--pct": `${split.contractor}%` } as React.CSSProperties}
            />
          </div>

          <div className="mb-4">
            <label className="label">Decision Justification (required)</label>
            <textarea
              className="input text-sm"
              rows={3}
              placeholder="Explain your split verdict based on the statements..."
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary w-full justify-center py-2.5"
            disabled={!reasoning.trim() || submitting}
            onClick={handleSubmit}
            style={{ opacity: !reasoning.trim() || submitting ? 0.6 : 1 }}
          >
            {submitting ? "Submitting verdict..." : "Submit Verdict"}
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Your vote is private and cast from an anonymous pool address.
        </p>
      </main>
    </div>
  );
}
