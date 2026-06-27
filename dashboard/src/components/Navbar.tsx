"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard",  label: "Overview" },
  { href: "/contracts",  label: "Contracts" },
  { href: "/arbitrator", label: "Arbitrate" },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-mark">S</div>
          <span className="nav-wordmark">Sems-Pay</span>
          <span className="chip chip-indigo" style={{ marginLeft: 8, fontSize: 10 }}>Devnet</span>
        </Link>
        <div className="nav-links">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`nav-link${path.startsWith(l.href) ? " active" : ""}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <div className="wallet-pill" aria-label="Connected wallet">
            <span className="dot-live pulse-ring" style={{ width: 7, height: 7 }} />
            <span className="mono" style={{ color: "var(--text-400)" }}>7xKp…4fRq</span>
          </div>
          <Link href="/contracts/new" className="btn btn-primary btn-sm">+ New</Link>
        </div>
      </div>
    </nav>
  );
}
