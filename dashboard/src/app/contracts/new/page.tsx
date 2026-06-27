"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = 1 | 2 | 3;

interface FormData {
  contractor: string;
  title: string;
  description: string;
  totalBudget: string;
  ratePerHour: string;
  milestones: string[];
  periodEnd: string;
  payoutToken: string;
}

const TOKENS = ["USDC", "SOL", "USDT", "JUP"];

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {([1, 2, 3] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-2 flex-1">
          <div className={`step-dot ${step > s ? "done" : step === s ? "active" : "pending"}`}>
            {step > s ? "✓" : s}
          </div>
          {s < 3 && (
            <div className={`step-line ${step > s ? "done" : ""}`} />
          )}
        </div>
      ))}
      <span className="text-xs text-label font-bold tracking-widest uppercase ml-2">
        {step === 1 ? "Setup" : step === 2 ? "Financing" : "Deploy"}
      </span>
    </div>
  );
}

export default function NewContractPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    contractor: "",
    title: "",
    description: "",
    totalBudget: "",
    ratePerHour: "",
    milestones: ["", ""],
    periodEnd: "",
    payoutToken: "USDC",
  });

  const set = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addMilestone = () =>
    setForm((f) => ({ ...f, milestones: [...f.milestones, ""] }));

  const setMilestone = (i: number, v: string) =>
    setForm((f) => {
      const m = [...f.milestones];
      m[i] = v;
      return { ...f, milestones: m };
    });

  const handleSubmit = async () => {
    setSubmitting(true);
    // Simulate smart contract PDA creation and FHE payload generation
    await new Promise((r) => setTimeout(r, 1800));
    setSubmitting(false);
    router.push("/contracts");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="section-shell section-shell-narrow">
        <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          <Link href="/contracts" className="hover:text-white transition-colors">Contracts</Link>
          <span>/</span>
          <span style={{ color: "var(--text-secondary)" }}>Create Contract</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Create Escrow Contract</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Stream wages second-by-second with an encrypted contract.
          </p>
        </div>

        <StepIndicator step={step} />

        <div className="card p-6">
          {/* Step 1 — Parties */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-semibold text-white mb-1">Contract Parties & Title</h2>

              <div>
                <label className="label">Contractor Wallet Address</label>
                <input
                  className="input mono"
                  placeholder="Solana Pubkey (e.g. 7xKp...4fRq)"
                  value={form.contractor}
                  onChange={(e) => set("contractor", e.target.value)}
                />
              </div>

              <div>
                <label className="label">Project Title</label>
                <input
                  className="input"
                  placeholder="e.g. Frontend UI Polish & Animations"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>

              <div>
                <label className="label">Scope of Work</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Summarize the core requirements and deliverables..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary self-end"
                disabled={!form.contractor || !form.title}
                onClick={() => setStep(2)}
              >
                Next →
              </button>
            </div>
          )}

          {/* Step 2 — Budget & Milestones */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-semibold text-white mb-1">Budget, Rate & Milestones</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Total Budget (USD)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="3000"
                    value={form.totalBudget}
                    onChange={(e) => set("totalBudget", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Rate per Hour (USD)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="75"
                    value={form.ratePerHour}
                    onChange={(e) => set("ratePerHour", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Contract Target End Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.periodEnd}
                    onChange={(e) => set("periodEnd", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Payout Token Preference</label>
                  <select
                    className="input"
                    value={form.payoutToken}
                    onChange={(e) => set("payoutToken", e.target.value)}
                  >
                    {TOKENS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <label className="label mb-0">Milestones ({form.milestones.length})</label>
                  <button onClick={addMilestone} className="btn btn-ghost btn-sm">
                    Add Milestone
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {form.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-mono w-5 text-center pt-3" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                      <input
                        className="input flex-1"
                        placeholder={`Milestone ${i + 1} Target Deliverable`}
                        value={m}
                        onChange={(e) => setMilestone(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-end mt-2">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button
                  className="btn btn-primary"
                  disabled={!form.totalBudget || !form.ratePerHour}
                  onClick={() => setStep(3)}
                >
                  Review Terms →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-semibold text-white mb-1">Review & Deploy</h2>

              <div className="card-inset p-4 flex flex-col gap-3">
                <Row label="Project Title" value={form.title} />
                <Row label="Contractor Wallet" value={form.contractor || "—"} mono />
                <Row label="Hourly Wage Rate" value={`$${form.ratePerHour} USD / hour`} />
                <Row label="Total Escrow Budget" value={`$${form.totalBudget} USD`} />
                <Row label="Target Milestones" value={`${form.milestones.filter(Boolean).length} configured`} />
                <Row label="Payout Currency" value={form.payoutToken} />
                <Row label="Termination Date" value={form.periodEnd || "Open-ended (stream until manually stopped)"} />
              </div>

              <div
                className="flex items-start gap-3 p-4 rounded-xl text-xs"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}
              >
                <span className="text-lg">🛡️</span>
                <div>
                  <p className="font-semibold text-indigo-300 mb-1">Fully Homomorphic Encryption (FHE)</p>
                  <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Sems-Pay automatically encrypts your rate and remaining balance using Inco FHE before publishing to Solana. Your financial details remain completely confidential.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-end mt-2">
                <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Initiating on Solana..." : "Deploy Streaming Escrow"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="kv-row text-sm">
      <span className="kv-label">{label}</span>
      <span className={`kv-value ${mono ? "font-mono text-xs text-white" : "font-medium text-white"}`}>{value}</span>
    </div>
  );
}
