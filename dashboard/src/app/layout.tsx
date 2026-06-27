import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sems-Pay — Confidential Freelance Escrow on Solana",
  description: "Stream wages in real-time, lock milestones in FHE-encrypted escrow, and resolve disputes anonymously in 5 hours. Built on Solana Devnet.",
  keywords: ["solana", "escrow", "freelance", "FHE", "streaming payments", "web3", "MagicBlock", "Inco"],
  openGraph: {
    title: "Sems-Pay",
    description: "Confidential streaming escrow for remote freelancers on Solana.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="page-bg">
        </div>
        <div className="page-content">{children}</div>
      </body>
    </html>
  );
}
