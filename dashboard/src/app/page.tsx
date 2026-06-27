"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

/* ── Live streaming counter ─────────────────── */
function LiveCounter() {
  const [val, setVal] = useState(2481320.48);
  useEffect(() => {
    const id = setInterval(() => setVal(v => parseFloat((v + 0.0031).toFixed(4))), 180);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="mono" style={{ color: "var(--emerald-400)", fontWeight: 700 }}>
      ${val.toLocaleString("en-US", { minimumFractionDigits: 4 })}
    </span>
  );
}

/* ── Flow step ──────────────────────────────── */
function FlowStep({ n, title, desc, color }: { n: string; title: string; desc: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginTop: 2,
        background: `${color}18`, border: `1px solid ${color}35`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 14, color,
      }}>{n}</div>
      <div>
        <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text-100)", marginBottom: 4 }}>{title}</p>
        <p className="text-body">{desc}</p>
      </div>
    </div>
  );
}

/* ── Feature card ───────────────────────────── */
function Feature({ icon, title, desc, accent }: { icon: string; title: string; desc: string; accent: string }) {
  return (
    <div className="card card-lift" style={{ padding: 24 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 16,
        background: `${accent}14`, border: `1px solid ${accent}25`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
      }}>{icon}</div>
      <p className="title-card" style={{ marginBottom: 8 }}>{title}</p>
      <p className="text-body">{desc}</p>
    </div>
  );
}

/* ── Stat ───────────────────────────────────── */
function Stat({ val, label }: { val: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p className="grad-primary" style={{ fontFamily: "Space Grotesk", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{val}</p>
      <p className="text-small">{label}</p>
    </div>
  );
}

/* ── Mini contract card (hero demo) ─────────── */
function DemoCard() {
  const [accrued, setAccrued] = useState(1247.83);
  useEffect(() => {
    const id = setInterval(() => setAccrued(v => parseFloat((v + 0.021).toFixed(3))), 250);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="card card-glow float-y" style={{ padding: 24, maxWidth: 360, width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Live Contract</p>
          <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 16, color: "var(--text-100)" }}>DeFi Dashboard UI</p>
        </div>
        <span className="chip chip-emerald" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span className="dot-live blink" style={{ width: 6, height: 6 }} />Active
        </span>
      </div>

      {/* Live accrual */}
      <div style={{
        background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)",
        borderRadius: 12, padding: "12px 16px", marginBottom: 16,
      }}>
        <p style={{ fontSize: 11, color: "var(--text-500)", marginBottom: 6 }}>ACCRUED IN ESCROW (FHE encrypted)</p>
        <p style={{ fontFamily: "JetBrains Mono", fontSize: 22, fontWeight: 700, color: "var(--emerald-400)" }}>
          ${accrued.toFixed(3)}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-500)", marginTop: 4 }}>streaming at $75.00/hr</p>
      </div>

      {/* Milestone progress */}
      <p style={{ fontSize: 11, color: "var(--text-500)", marginBottom: 8 }}>MILESTONES</p>
      {["Wireframes ✓", "Component Library", "Integration Tests", "Final Delivery"].map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
            background: i === 0 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.08)",
            border: `1.5px solid ${i === 0 ? "var(--indigo-500)" : i === 1 ? "var(--amber-400)" : "var(--border-dim)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, color: "white",
          }}>{i === 0 ? "✓" : ""}</div>
          <p style={{
            fontSize: 13, color: i === 0 ? "var(--text-400)" : i === 1 ? "var(--text-200)" : "var(--text-600)",
            textDecoration: i === 0 ? "line-through" : "none",
          }}>{m}</p>
          {i === 1 && <span className="chip chip-amber" style={{ marginLeft: "auto", fontSize: 10, padding: "2px 7px" }}>Active</span>}
        </div>
      ))}

      {/* Divider */}
      <div className="divider" style={{ margin: "14px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-500)" }}>
        <span>Budget: <span style={{ color: "var(--text-300)" }}>$3,000</span></span>
        <span>🔐 FHE Protected</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      {/* ── NAV ─────────────────────────────── */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-mark">S</div>
            <span className="nav-wordmark">Sems-Pay</span>
            <span className="chip chip-indigo" style={{ marginLeft: 8, fontSize: 10 }}>Devnet</span>
          </Link>
          <div className="nav-links">
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
            <Link href="/contracts" className="nav-link">Contracts</Link>
            <Link href="/arbitrator" className="nav-link">Arbitrate</Link>
          </div>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Launch App →</Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────── */}
      <section style={{ paddingTop: 140, paddingBottom: 80 }}>
        <div className="container-xl">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 64, alignItems: "center" }}>
            <div>
              {/* Pill */}
              <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
                <span className="chip chip-emerald">
                  <span className="dot-live pulse-ring" style={{ width: 7, height: 7 }} />
                  Live on Solana Devnet
                </span>
                <span className="chip chip-indigo">FHE + TEE Secured</span>
              </div>

              <h1 className="title-hero grad-primary fade-up delay-100" style={{ marginBottom: 24 }}>
                Freelance Escrow<br />That Streams Live
              </h1>

              <p className="text-lead fade-up delay-200" style={{ maxWidth: 520, marginBottom: 36 }}>
                Wages flow <strong style={{ color: "var(--text-200)" }}>second-by-second</strong> into a confidential escrow.
                Milestones unlock payments. Disputes resolved by anonymous community jury in <strong style={{ color: "var(--text-200)" }}>under 5 hours</strong>.
                No trust required.
              </p>

              {/* Live ticker */}
              <div className="fade-up delay-300" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)",
                borderRadius: 12, padding: "10px 18px", marginBottom: 36,
              }}>
                <span className="dot-live blink" />
                <span style={{ fontSize: 13, color: "var(--text-500)" }}>Total streamed today:</span>
                <LiveCounter />
              </div>

              <div className="fade-up delay-400" style={{ display: "flex", gap: 12 }}>
                <Link href="/contracts/new" className="btn btn-primary btn-lg">Start a Contract</Link>
                <Link href="/dashboard" className="btn btn-ghost btn-lg">View Dashboard</Link>
              </div>
            </div>

            {/* Demo card */}
            <div className="fade-up delay-300" style={{ display: "flex", justifyContent: "flex-end" }}>
              <DemoCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────── */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="container-xl">
          <div className="card" style={{ padding: "28px 48px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, alignItems: "center" }}>
              <Stat val="$2.4M" label="Total escrowed" />
              <div className="divider" style={{ width: 1, height: 40, margin: "0 auto" }} />
              <Stat val="1,248" label="Contracts created" />
              <div className="divider" style={{ width: 1, height: 40, margin: "0 auto" }} />
              <Stat val="4.1h" label="Avg. dispute time" />
              <div className="divider" style={{ width: 1, height: 40, margin: "0 auto" }} />
              <Stat val="99.2%" label="Resolution rate" />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────── */}
      <section style={{ padding: "0 0 100px" }}>
        <div className="container-xl">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p className="text-label" style={{ marginBottom: 12 }}>How it works</p>
            <h2 className="title-section" style={{ color: "var(--text-100)" }}>From agreement to payout — on-chain</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            {/* Client flow */}
            <div className="card" style={{ padding: 32 }}>
              <p className="text-label" style={{ marginBottom: 24, color: "var(--indigo-400)" }}>Client (Employer)</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <FlowStep n="1" title="Create escrow contract" desc="Set the contractor's wallet, milestone targets, budget, and hourly rate. Privacy-encrypted from the start." color="var(--indigo-400)" />
                <FlowStep n="2" title="Fund the escrow" desc="Deposit any token — SOL, USDC, or any SPL asset. It's tracked internally as USD." color="var(--indigo-400)" />
                <FlowStep n="3" title="Wages stream automatically" desc="As long as the contractor works, funds accumulate in real-time in the encrypted vault." color="var(--indigo-400)" />
                <FlowStep n="4" title="Approve milestones → pay" desc="When work is delivered, approve the milestone and funds release to the contractor instantly." color="var(--indigo-400)" />
              </div>
            </div>
            {/* Contractor flow */}
            <div className="card" style={{ padding: 32 }}>
              <p className="text-label" style={{ marginBottom: 24, color: "var(--cyan-400)" }}>Contractor (Freelancer)</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <FlowStep n="1" title="Accept contract terms" desc="Review the encrypted job details. Wage rate and total budget are private — only you and the client can see them." color="var(--cyan-400)" />
                <FlowStep n="2" title="Watch funds stream in" desc="The escrow balance grows as you work. You can see it accumulating in real-time." color="var(--cyan-400)" />
                <FlowStep n="3" title="Submit milestone updates" desc="Mark milestones complete and submit evidence. The client reviews and approves." color="var(--cyan-400)" />
                <FlowStep n="4" title="Withdraw to any token" desc="On milestone approval, funds are automatically swapped to your preferred payout token." color="var(--cyan-400)" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────── */}
      <section style={{ padding: "0 0 100px" }}>
        <div className="container-xl">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p className="text-label" style={{ marginBottom: 12 }}>Core technology</p>
            <h2 className="title-section" style={{ color: "var(--text-100)" }}>Built different, secured by design</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            <Feature icon="⚡" title="Real-Time Streaming" desc="MagicBlock TEE Ephemeral Rollups process wage accrual every second with sub-10ms latency. No cron jobs, no keepers." accent="var(--indigo-400)" />
            <Feature icon="🔐" title="FHE Encryption" desc="Inco Lightning FHE keeps salary rates and balances mathematically invisible on-chain. Not even validators can read them." accent="var(--violet-400)" />
            <Feature icon="⚖️" title="Anonymous Jury" desc="Disputes go to randomly selected, anonymous online users who resolve within 5 hours or are cycled out automatically." accent="var(--cyan-400)" />
            <Feature icon="💱" title="Any Token, USD-Tracked" desc="Deposit or receive any supported token. All escrow accounting is in USD. Swaps via Jupiter on withdrawal." accent="var(--emerald-400)" />
            <Feature icon="🔌" title="B2B SDK" desc="Platforms integrate in minutes via @sems-pay/sdk. Get payout directions programmatically — no UI required." accent="var(--amber-400)" />
            <Feature icon="🛡️" title="Non-Custodial" desc="Funds are locked in program-owned PDAs. No multisig, no admin key, no rug surface. Pure on-chain logic." accent="var(--red-400)" />
          </div>
        </div>
      </section>

      {/* ── DISPUTE CTA ─────────────────────── */}
      <section style={{ padding: "0 0 100px" }}>
        <div className="container-lg">
          <div className="card" style={{
            padding: "48px 56px",
            background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))",
            borderColor: "var(--border-mid)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center" }}>
              <div>
                <span className="chip chip-violet" style={{ marginBottom: 16 }}>⚖️ Earn while you arbitrate</span>
                <h2 className="title-section" style={{ color: "var(--text-100)", marginBottom: 16 }}>
                  Become an anonymous arbitrator
                </h2>
                <p className="text-body" style={{ maxWidth: 480 }}>
                  Join the dispute resolution pool. Earn resolution fees by fairly judging anonymized freelance disputes.
                  Your identity is never revealed. Decisions are final and enforced on-chain.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
                <Link href="/arbitrator" className="btn btn-primary btn-lg">Join the Pool →</Link>
                <p className="text-small">~$5–50 per resolved dispute</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────── */}
      <footer style={{ padding: "28px 0", borderTop: "1px solid var(--border-subtle)" }}>
        <div className="container-xl" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="nav-logo-mark" style={{ width: 26, height: 26, fontSize: 12 }}>S</div>
            <span style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 14, color: "var(--text-300)" }}>Sems-Pay</span>
          </div>
          <p className="text-small">Built on Solana Devnet · FHE by Inco · Streaming by MagicBlock</p>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: "var(--text-500)", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/contracts/new" style={{ fontSize: 13, color: "var(--text-500)", textDecoration: "none" }}>New Contract</Link>
            <Link href="/arbitrator" style={{ fontSize: 13, color: "var(--text-500)", textDecoration: "none" }}>Arbitrate</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
