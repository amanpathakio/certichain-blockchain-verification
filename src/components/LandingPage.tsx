import React, { useState } from "react";
import {
  ShieldCheck,
  FileCheck2,
  QrCode,
  Blocks,
  ArrowRight,
  Lock,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { computeCertificateHash } from "../utils/hash";

interface LandingPageProps {
  onOpenWorkspace: (
    initialTab: "dashboard" | "verify" | "qr" | "transactions"
  ) => void;
  rpcConnected: boolean;
  contractDeployed: boolean;
  totalIssued: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenWorkspace,
  rpcConnected,
  contractDeployed,
  totalIssued,
}) => {
  const [previewFields, setPreviewFields] = useState({
    certificateId: "CERT-2026-CS101",
    studentName: "Aarav Sharma",
    course: "B.Tech in Computer Science & Engineering",
    institution: "National Institute of Technology",
    issueDate: "2026-05-15",
  });

  const { hash: liveHash, canonicalJson } = computeCertificateHash(previewFields);

  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-[#070B19]/90 backdrop-blur-md border-b border-slate-800/80">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0"
        >
          CertiChain
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a
            href="#how-it-works"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            How It Works
          </a>
          <a
            href="#hash-demo"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Cryptography
          </a>
          <a
            href="#features"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Features
          </a>
          <a
            href="#tech-stack"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Tech Stack
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => onOpenWorkspace("dashboard")}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Institution Portal
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main id="top" className="flex-1">
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-14 pb-20 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            {/* Left Column: Value Proposition & Primary Actions */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-cyan-400 tracking-wide mb-4">
                  Decentralized Academic Registry · Ethereum Smart Contract
                </div>

                <h1
                  className="font-display font-bold text-white tracking-tight leading-[1.12] mb-6"
                  style={{
                    fontSize: "clamp(2.25rem, 4vw, 3.6rem)",
                    textWrap: "balance",
                  }}
                >
                  Tamper-evident academic credential verification on the blockchain.
                </h1>

                <p className="text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl mb-8">
                  CertiChain enables authorized universities to anchor cryptographic
                  Keccak-256 certificate fingerprints on an immutable Solidity smart
                  contract. Employers and students can verify credential authenticity
                  in seconds without exposing private academic transcripts on-chain.
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <button
                    onClick={() => onOpenWorkspace("dashboard")}
                    className="px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Issue Certificate</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenWorkspace("verify")}
                    className="px-5 py-3 text-sm font-semibold text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Verify Certificate
                  </button>
                </div>
              </div>

              {/* Unboxed Metadata Proof Bar */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <span>Chain ID: 31337</span>
                <span aria-hidden="true">·</span>
                <span>Hash Function: Keccak-256</span>
                <span aria-hidden="true">·</span>
                <span>Access Control: OpenZeppelin Ownable</span>
                <span aria-hidden="true">·</span>
                <span>
                  Registry Status:{" "}
                  <strong className="text-slate-200 font-mono tabular-nums">
                    {rpcConnected && contractDeployed
                      ? `Online (${totalIssued} issued)`
                      : "Awaiting Local Node"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Right Column: Architectural Cryptographic Ledger Visual Showcase */}
            <div className="lg:col-span-5 flex">
              <div className="w-full rounded-xl bg-[#0D1326] border border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div>
                    <div className="text-xs text-slate-400">Smart Contract Storage Architecture</div>
                    <div className="text-sm font-semibold text-white font-mono mt-0.5">
                      CertificateRegistry.sol
                    </div>
                  </div>
                  <Blocks className="w-5 h-5 text-cyan-400 shrink-0" />
                </div>

                <div className="my-6 space-y-4">
                  <div className="p-4 rounded-lg bg-[#070B19] border border-slate-800/90">
                    <div className="text-xs text-slate-400 mb-2">
                      1. Off-Chain Academic Record (Client Browser Only)
                    </div>
                    <div className="font-mono text-xs text-slate-200 space-y-1">
                      <div>ID: &quot;CERT-2026-CS101&quot;</div>
                      <div>Student: &quot;Aarav Sharma&quot;</div>
                      <div>Course: &quot;B.Tech Computer Science&quot;</div>
                      <div>Institution: &quot;National Institute of Technology&quot;</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-400">
                    <span>↓ keccak256(toUtf8Bytes(canonicalJSON)) ↓</span>
                  </div>

                  <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/30">
                    <div className="text-xs text-indigo-300 mb-2">
                      2. Immutable On-Chain Struct (Stored on Blockchain)
                    </div>
                    <div className="font-mono text-xs text-slate-200 space-y-1.5 tabular-nums">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">certificateId:</span>
                        <span className="text-white">&quot;CERT-2026-CS101&quot;</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">documentHash:</span>
                        <span className="text-cyan-300 truncate max-w-[210px]">
                          {liveHash}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">issuer:</span>
                        <span className="text-slate-300">0xf39F...2266</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">isRevoked:</span>
                        <span className="text-emerald-400">false</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Zero PII Stored On-Chain</span>
                  <button
                    onClick={() => onOpenWorkspace("verify")}
                    className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    Open Verifier →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Cryptographic Hashing Explanation Section */}
        <section
          id="hash-demo"
          className="border-t border-slate-800/80 bg-[#0A0F20] py-20"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mb-12">
              <div className="text-xs font-medium text-cyan-400 mb-2">
                01. Cryptographic Integrity Mechanism
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white font-display tracking-tight mb-4">
                Why store Keccak-256 fingerprints instead of raw PDFs?
              </h2>
              <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
                Storing student names, grades, or full documents directly on a public
                blockchain violates student privacy and incurs high gas costs.
                CertiChain normalizes the certificate fields into a deterministic JSON
                structure and computes a 256-bit{" "}
                <code className="text-cyan-300 font-mono">Keccak-256</code> hash.
                Try editing a single character below to observe the avalanche effect in
                real time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6 rounded-xl bg-[#070B19] border border-slate-800 p-6 space-y-4">
                <div className="text-sm font-semibold text-white mb-2">
                  Interactive Hash Calculator: Edit Any Certificate Field
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">
                      Certificate ID
                    </label>
                    <input
                      type="text"
                      value={previewFields.certificateId}
                      onChange={(e) =>
                        setPreviewFields({
                          ...previewFields,
                          certificateId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-[#0D1326] border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={previewFields.issueDate}
                      onChange={(e) =>
                        setPreviewFields({
                          ...previewFields,
                          issueDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-[#0D1326] border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    value={previewFields.studentName}
                    onChange={(e) =>
                      setPreviewFields({
                        ...previewFields,
                        studentName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-[#0D1326] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Academic Course / Degree
                  </label>
                  <input
                    type="text"
                    value={previewFields.course}
                    onChange={(e) =>
                      setPreviewFields({
                        ...previewFields,
                        course: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-[#0D1326] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Issuing Institution
                  </label>
                  <input
                    type="text"
                    value={previewFields.institution}
                    onChange={(e) =>
                      setPreviewFields({
                        ...previewFields,
                        institution: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-[#0D1326] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="lg:col-span-6 rounded-xl bg-[#070B19] border border-slate-800 p-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <div>
                    <div className="text-xs text-slate-400 mb-2">
                      Canonical Normalized JSON Payload (Pre-Image)
                    </div>
                    <pre className="p-3.5 rounded-lg bg-[#0D1326] border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                      {canonicalJson}
                    </pre>
                  </div>

                  <div>
                    <div className="text-xs text-cyan-400 mb-2">
                      Computed 32-Byte Keccak-256 Document Hash (On-Chain Value)
                    </div>
                    <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/30 font-mono text-xs sm:text-sm text-cyan-300 break-all tabular-nums">
                      {liveHash}
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-6 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                  During verification, the verifier enters the certificate details
                  above. If even a single letter or date is altered, the recomputed
                  hash will differ completely from the on-chain{" "}
                  <code className="text-slate-200 font-mono">documentHash</code>,
                  immediately flagging the certificate as{" "}
                  <strong className="text-amber-400">Tampered</strong>.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mb-12">
              <div className="text-xs font-medium text-cyan-400 mb-2">
                02. End-to-End Verification Workflow
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white font-display tracking-tight">
                How CertiChain Works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-indigo-400 mb-3">
                    01. Authorization
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    Institution Connects Wallet
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    The university administrator connects their authorized MetaMask
                    wallet (the smart contract deployer controlled via OpenZeppelin{" "}
                    <code className="text-slate-300 font-mono">Ownable</code>).
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 font-mono">
                  modifier onlyOwner()
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-indigo-400 mb-3">
                    02. Fingerprinting
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    Canonical Hashing &amp; Issuance
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Certificate fields are normalized and hashed with Keccak-256 in the
                    browser. Only the Certificate ID, 32-byte hash, issuer address, and
                    block timestamp are written on-chain.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 font-mono">
                  issueCertificate(id, hash)
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-indigo-400 mb-3">
                    03. Distribution
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    QR Code &amp; Credential Slip
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    A QR code linking to the public verification endpoint with the
                    Certificate ID is generated for the graduate to include on their
                    resume or physical diploma.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 font-mono">
                  /?tab=verify&amp;certId=...
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-indigo-400 mb-3">
                    04. Public Audit
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    Walletless Verification
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Employers enter the certificate details on the verification page.
                    The app queries the smart contract via RPC to return{" "}
                    <span className="text-emerald-400">Valid</span>,{" "}
                    <span className="text-amber-400">Tampered</span>,{" "}
                    <span className="text-rose-400">Revoked</span>, or{" "}
                    <span className="text-slate-300">Not Found</span>.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 font-mono">
                  verifyCertificate(id, hash)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Asymmetric Bento Grid */}
        <section
          id="features"
          className="py-20 border-t border-slate-800/80 bg-[#0A0F20]"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mb-12">
              <div className="text-xs font-medium text-cyan-400 mb-2">
                03. System Capabilities
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white font-display tracking-tight">
                Engineered for Academic Integrity
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-xl bg-[#070B19] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-cyan-400">
                      01. Four-State Smart Contract Verification
                    </span>
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Deterministic Detection of Forged, Revoked, and Missing Credentials
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    Unlike basic boolean registries,{" "}
                    <code className="text-slate-200 font-mono">
                      CertificateRegistry.sol
                    </code>{" "}
                    returns granular verification telemetry—distinguishing between an
                    unregistered Certificate ID, a valid ID whose holder details were
                    tampered with, a credential later revoked by the university senate,
                    and an authentic active certificate.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs">
                  <div>
                    <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </div>
                    <div className="text-slate-400 mt-0.5">Hash match &amp; active</div>
                  </div>
                  <div>
                    <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Tampered
                    </div>
                    <div className="text-slate-400 mt-0.5">ID exists, hash mismatch</div>
                  </div>
                  <div>
                    <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Revoked
                    </div>
                    <div className="text-slate-400 mt-0.5">Invalidated on-chain</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" /> Not Found
                    </div>
                    <div className="text-slate-400 mt-0.5">Never issued on-chain</div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#070B19] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-cyan-400">
                      02. Access Control
                    </span>
                    <Lock className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    OpenZeppelin Ownable Security
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    State-mutating transactions (<code className="font-mono">issueCertificate</code> and{" "}
                    <code className="font-mono">revokeCertificate</code>) are strictly
                    guarded by <code className="font-mono">onlyOwner</code>. Any
                    unauthorized wallet attempting to issue or revoke a certificate
                    reverts with{" "}
                    <code className="font-mono text-rose-300">
                      OwnableUnauthorizedAccount
                    </code>
                    .
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-slate-800/80 text-xs text-slate-400">
                  Duplicate Certificate IDs are strictly prevented on-chain.
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#070B19] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-cyan-400">
                      03. QR Verification Routing
                    </span>
                    <QrCode className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Verifiable QR Code Slips
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Generates scannable QR codes encoding the real verification URL and
                    Certificate ID. Scanning opens the public verification page and
                    requires cryptographic hash matching before confirming validity.
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-slate-800/80">
                  <button
                    onClick={() => onOpenWorkspace("qr")}
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Open QR Generator →
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 p-6 rounded-xl bg-[#070B19] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-cyan-400">
                      04. Real Blockchain Telemetry
                    </span>
                    <Terminal className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Event-Indexed Transaction Explorer
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Every issuance and revocation emits a Solidity event (
                    <code className="font-mono text-slate-200">CertificateIssued</code>{" "}
                    and{" "}
                    <code className="font-mono text-slate-200">
                      CertificateRevoked
                    </code>
                    ). The Transaction Explorer queries these on-chain logs and
                    transaction receipts directly from the blockchain to display real
                    transaction hashes, block numbers, and gas consumption.
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    100% Ethers.js v6 JSON-RPC queries
                  </span>
                  <button
                    onClick={() => onOpenWorkspace("transactions")}
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Inspect Transactions →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack Section */}
        <section id="tech-stack" className="py-20 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mb-12">
              <div className="text-xs font-medium text-cyan-400 mb-2">
                04. Engineering Stack
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white font-display tracking-tight">
                Built with Modern Web3 &amp; Frontend Standards
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "Solidity 0.8.28 & OpenZeppelin v5",
                  role: "Smart Contract Layer",
                  desc: "On-chain certificate registry using Ownable access control, custom structs, mappings, and indexed events.",
                },
                {
                  name: "Hardhat 3 & Hardhat Ignition",
                  role: "Blockchain & Deployment",
                  desc: "Ethereum development environment on Chain ID 31337, declarative Ignition deployment module, and Mocha/Chai test suite.",
                },
                {
                  name: "Ethers.js v6",
                  role: "Blockchain Interaction & Hashing",
                  desc: "BrowserProvider for MetaMask signing, JsonRpcProvider for walletless verification, and Keccak-256 hashing.",
                },
                {
                  name: "MetaMask Wallet",
                  role: "Key Management & Signing",
                  desc: "Connects institutional accounts, detects wrong networks, and signs issuance/revocation transactions.",
                },
                {
                  name: "React 19, TypeScript & Vite",
                  role: "Frontend Application",
                  desc: "Type-safe modular interface with real-time contract state synchronization and responsive dashboard views.",
                },
                {
                  name: "Tailwind CSS & QRCode.react",
                  role: "UI Design & Verification Slips",
                  desc: "Clean dark-navy SaaS interface with tabular numerals and SVG QR code generation for public verification.",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="p-5 rounded-xl bg-[#0D1326] border border-slate-800"
                >
                  <div className="text-xs text-cyan-400 mb-1">{item.role}</div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-14 p-8 rounded-xl bg-gradient-to-r from-indigo-950/60 via-[#0D1326] to-[#0D1326] border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white font-display mb-1">
                  Issue or Verify Academic Credentials
                </h3>
                <p className="text-sm text-slate-300">
                  Access the Institution Dashboard to issue credentials with MetaMask,
                  or open the public Verification Portal to audit an existing certificate.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={() => onOpenWorkspace("dashboard")}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Institution Dashboard
                </button>
                <button
                  onClick={() => onOpenWorkspace("verify")}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Verify Certificate
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 lg:px-12 bg-[#070B19]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-200">CertiChain</span>
            <span>·</span>
            <span>Blockchain-Based Academic Certificate Verification System</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onOpenWorkspace("dashboard")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => onOpenWorkspace("verify")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Verify
            </button>
            <button
              onClick={() => onOpenWorkspace("qr")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              QR Code
            </button>
            <button
              onClick={() => onOpenWorkspace("transactions")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Transactions
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
