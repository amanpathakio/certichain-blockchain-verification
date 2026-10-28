import React, { useState } from "react";
import {
  FilePlus2,
  ShieldAlert,
  CheckCircle2,
  Ban,
  QrCode,
  Search,
  RefreshCw,
  Wallet,
  Copy,
  Check,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import type {
  BlockchainConnectionState,
  CertificateInputFields,
  ContractStats,
  OnChainCertificate,
} from "../types/blockchain";
import {
  computeCertificateHash,
  formatBlockchainTimestamp,
  shortenAddress,
  shortenHash,
} from "../utils/hash";
import {
  issueCertificateOnChain,
  parseBlockchainError,
  revokeCertificateOnChain,
} from "../services/blockchainService";

interface InstitutionDashboardProps {
  connection: BlockchainConnectionState;
  stats: ContractStats;
  certificates: OnChainCertificate[];
  isLoadingData: boolean;
  onConnectWallet: () => Promise<void>;
  onSwitchNetwork: () => Promise<void>;
  onRefreshData: () => Promise<void>;
  onOpenQrForCert: (certificateId: string, fields?: CertificateInputFields) => void;
  onOpenVerifyForCert: (certificateId: string, fields?: CertificateInputFields) => void;
  onOpenSetup: () => void;
  recentIssuedFieldsMap: Record<string, CertificateInputFields>;
  onSaveRecentIssuedFields: (
    certificateId: string,
    fields: CertificateInputFields
  ) => void;
}

const DEMO_PRESETS: CertificateInputFields[] = [
  {
    certificateId: "CERT-2026-CS101",
    studentName: "Aarav Sharma",
    course: "B.Tech in Computer Science & Engineering",
    institution: "National Institute of Technology",
    issueDate: "2026-05-15",
  },
  {
    certificateId: "CERT-2026-EC204",
    studentName: "Priya Nair",
    course: "B.Tech in Electronics & Communication",
    institution: "National Institute of Technology",
    issueDate: "2026-05-15",
  },
  {
    certificateId: "CERT-2026-AI309",
    studentName: "Rohan Verma",
    course: "M.Tech in Cybersecurity & Blockchain",
    institution: "National Institute of Technology",
    issueDate: "2026-06-01",
  },
];

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({
  connection,
  stats,
  certificates,
  isLoadingData,
  onConnectWallet,
  onSwitchNetwork,
  onRefreshData,
  onOpenQrForCert,
  onOpenVerifyForCert,
  onOpenSetup,
  recentIssuedFieldsMap,
  onSaveRecentIssuedFields,
}) => {
  const [formFields, setFormFields] = useState<CertificateInputFields>({
    certificateId: "CERT-2026-AI309",
    studentName: "Rohan Verma",
    course: "M.Tech in Cybersecurity & Blockchain",
    institution: "National Institute of Technology",
    issueDate: "2026-06-01",
  });

  const [presetIndex, setPresetIndex] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">(
    "all"
  );

  // Helper to generate a guaranteed unused Certificate ID
  const generateNextUniqueCertId = (existingCerts: OnChainCertificate[], extraUsedId?: string) => {
    const usedIds = new Set(
      existingCerts.map((c) => c.certificateId.trim().toUpperCase())
    );
    if (extraUsedId) {
      usedIds.add(extraUsedId.trim().toUpperCase());
    }
    let counter = existingCerts.length + 101;
    let candidate = `CERT-2026-CS${counter}`;
    while (usedIds.has(candidate)) {
      counter += 1;
      candidate = `CERT-2026-CS${counter}`;
    }
    return candidate;
  };

  // If the user edits Student Name, Course, or Institution while an already-issued Certificate ID
  // is still sitting in the Certificate ID box, automatically update Certificate ID to a fresh unused ID
  const updateStudentField = (
    field: "studentName" | "course" | "institution" | "issueDate",
    value: string
  ) => {
    setFormFields((prev) => {
      const currentIdUpper = prev.certificateId.trim().toUpperCase();
      const isAlreadyIssued = certificates.some(
        (c) => c.certificateId.trim().toUpperCase() === currentIdUpper
      );
      const nextCertId = isAlreadyIssued
        ? generateNextUniqueCertId(certificates, currentIdUpper)
        : prev.certificateId;
      return {
        ...prev,
        [field]: value,
        certificateId: nextCertId,
      };
    });
  };

  // Transaction execution states
  const [txState, setTxState] = useState<{
    status: "idle" | "signing" | "confirming" | "success" | "error";
    actionLabel?: string;
    txHash?: string;
    blockNumber?: number;
    gasUsed?: string;
    certificateId?: string;
    documentHash?: string;
    errorMessage?: string;
  }>({ status: "idle" });

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { hash: previewHash, canonicalJson } = computeCertificateHash(formFields);

  const handleLoadNextPreset = () => {
    const nextIdx = (presetIndex + 1) % DEMO_PRESETS.length;
    setPresetIndex(nextIdx);
    const preset = DEMO_PRESETS[nextIdx];
    const isPresetUsed = certificates.some(
      (c) =>
        c.certificateId.trim().toUpperCase() ===
        preset.certificateId.trim().toUpperCase()
    );
    setFormFields({
      ...preset,
      certificateId: isPresetUsed
        ? generateNextUniqueCertId(certificates, preset.certificateId)
        : preset.certificateId,
    });
    setTxState({ status: "idle" });
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedHash(value);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formFields.certificateId.trim() ||
      !formFields.studentName.trim() ||
      !formFields.course.trim() ||
      !formFields.institution.trim() ||
      !formFields.issueDate.trim()
    ) {
      setTxState({
        status: "error",
        errorMessage: "All certificate fields are required to compute the canonical hash.",
      });
      return;
    }

    try {
      let normalizedId = formFields.certificateId.trim().toUpperCase();
      // If the current ID in the box was already issued earlier, automatically assign a fresh unique ID
      const alreadyExists = certificates.some(
        (c) => c.certificateId.trim().toUpperCase() === normalizedId
      );
      if (alreadyExists) {
        normalizedId = generateNextUniqueCertId(certificates, normalizedId);
      }

      const payloadToIssue: CertificateInputFields = {
        ...formFields,
        certificateId: normalizedId,
      };

      setTxState({
        status: "signing",
        actionLabel: `Issuing ${normalizedId} on Hardhat Blockchain...`,
      });

      const result = await issueCertificateOnChain(
        connection.contractAddress,
        payloadToIssue,
        connection.rpcUrl
      );

      onSaveRecentIssuedFields(normalizedId, payloadToIssue);

      // Advance Certificate ID box to the next unused ID so the user can immediately issue another one
      const nextAvailableId = generateNextUniqueCertId(
        certificates,
        normalizedId
      );
      setFormFields((prev) => ({
        ...prev,
        certificateId: nextAvailableId,
      }));

      setTxState({
        status: "success",
        actionLabel: `Certificate ${normalizedId} anchored on-chain`,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        certificateId: normalizedId,
        documentHash: result.documentHash,
      });

      await onRefreshData();
    } catch (err) {
      setTxState({
        status: "error",
        errorMessage: parseBlockchainError(err),
      });
    }
  };

  const handleRevokeCertificate = async (certId: string) => {
    try {
      setRevokingId(certId);
      setTxState({
        status: "signing",
        actionLabel: `Revoking ${certId} on Hardhat Blockchain...`,
      });

      const result = await revokeCertificateOnChain(
        connection.contractAddress,
        certId,
        connection.rpcUrl
      );

      setTxState({
        status: "success",
        actionLabel: `Certificate ${certId} permanently revoked on-chain`,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        certificateId: certId,
      });

      await onRefreshData();
    } catch (err) {
      setTxState({
        status: "error",
        errorMessage: parseBlockchainError(err),
      });
    } finally {
      setRevokingId(null);
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    const matchesQuery =
      cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.documentHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.issuer.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (statusFilter === "active") return !cert.isRevoked;
    if (statusFilter === "revoked") return cert.isRevoked;
    return true;
  });

  const canTransact =
    connection.rpcConnected &&
    connection.contractDeployed &&
    connection.walletConnected &&
    connection.isCorrectNetwork &&
    connection.isOwnerWallet;

  return (
    <div className="space-y-8">
      {/* Warning / Connection Banners */}
      {(!connection.rpcConnected || !connection.contractDeployed) && (
        <div className="p-5 rounded-xl bg-amber-950/25 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                {!connection.rpcConnected
                  ? "Local Hardhat Node Not Connected"
                  : "CertificateRegistry Smart Contract Not Deployed"}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {connection.connectionError ||
                  'Start your local blockchain with "npm run node" and deploy the contract with "npm run deploy".'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSetup}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Configure Endpoint
          </button>
        </div>
      )}

      {connection.rpcConnected &&
        connection.contractDeployed &&
        !connection.walletConnected && (
          <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Connect Authorized Institution Wallet to Issue or Revoke
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Read-only contract statistics are loaded below. Connect MetaMask
                  with the contract owner account (
                  <code className="font-mono text-indigo-300">
                    {shortenAddress(connection.contractOwner)}
                  </code>
                  ) to sign transactions.
                </p>
              </div>
            </div>
            <button
              onClick={onConnectWallet}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Connect MetaMask
            </button>
          </div>
        )}

      {connection.walletConnected && !connection.isCorrectNetwork && (
        <div className="p-5 rounded-xl bg-rose-950/30 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Wrong Network Selected in MetaMask (Chain ID{" "}
                {connection.walletChainId})
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Switch MetaMask to Hardhat Localhost (Chain ID 31337) to interact
                with the local smart contract.
              </p>
            </div>
          </div>
          <button
            onClick={onSwitchNetwork}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Switch to Hardhat (31337)
          </button>
        </div>
      )}

      {connection.walletConnected &&
        connection.isCorrectNetwork &&
        connection.contractDeployed &&
        !connection.isOwnerWallet && (
          <div className="p-5 rounded-xl bg-amber-950/25 border border-amber-500/40 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white block text-sm mb-0.5">
                Connected Wallet Is Not the Contract Owner
              </strong>
              Your connected wallet (
              <code className="font-mono text-amber-300">
                {connection.walletAddress}
              </code>
              ) does not match the contract&apos;s <code className="font-mono">Ownable</code>{" "}
              deployer address (
              <code className="font-mono text-emerald-300">
                {connection.contractOwner}
              </code>
              ). Switch to Hardhat Account #0 in MetaMask to issue or revoke
              certificates, or test clicking Issue below to see the smart
              contract&apos;s <code className="font-mono">OwnableUnauthorizedAccount</code>{" "}
              security revert in action.
            </div>
          </div>
        )}

      {/* Contract-Derived Statistics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0D1326] border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">
            Total Certificates Issued
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {connection.contractDeployed ? stats.totalIssued : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Derived from getCertificateCount()
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0D1326] border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">
            Active Valid Credentials
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {connection.contractDeployed ? stats.activeValid : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Unrevoked on-chain records
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0D1326] border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">
            Revoked Certificates
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
            {connection.contractDeployed ? stats.totalRevoked : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Derived from revokedCount()
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0D1326] border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">
            Authorized Institution Owner
          </div>
          <div
            className="text-base font-semibold text-cyan-300 font-mono truncate"
            title={stats.contractOwner || ""}
          >
            {connection.contractDeployed && stats.contractOwner
              ? shortenAddress(stats.contractOwner, 6)
              : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            {connection.isOwnerWallet
              ? "Matched with active wallet"
              : "OpenZeppelin Ownable"}
          </div>
        </div>
      </div>

      {/* Main Split: Issue Certificate Form + Canonical Fingerprint Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Issue Certificate Form */}
        <form
          onSubmit={handleIssueCertificate}
          className="lg:col-span-7 p-6 rounded-xl bg-[#0D1326] border border-slate-800 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Issue Academic Certificate
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter candidate details to compute the Keccak-256 fingerprint and
                write it to the blockchain.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadNextPreset}
              className="px-3 py-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-center whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cycle Demo Record</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Certificate ID *
              </label>
              <input
                type="text"
                required
                value={formFields.certificateId}
                onChange={(e) =>
                  setFormFields({ ...formFields, certificateId: e.target.value })
                }
                placeholder="e.g. CERT-2026-CS101"
                className="w-full px-3.5 py-2 text-sm font-mono bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Issue Date *
              </label>
              <input
                type="date"
                required
                value={formFields.issueDate}
                onChange={(e) =>
                  updateStudentField("issueDate", e.target.value)
                }
                className="w-full px-3.5 py-2 text-sm font-mono bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Student Full Name * (Hashed Locally — Never Stored in Plaintext On-Chain)
            </label>
            <input
              type="text"
              required
              value={formFields.studentName}
              onChange={(e) =>
                updateStudentField("studentName", e.target.value)
              }
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3.5 py-2 text-sm bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Academic Course / Degree Program *
            </label>
            <input
              type="text"
              required
              value={formFields.course}
              onChange={(e) =>
                updateStudentField("course", e.target.value)
              }
              placeholder="e.g. B.Tech in Computer Science & Engineering"
              className="w-full px-3.5 py-2 text-sm bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Issuing Institution *
            </label>
            <input
              type="text"
              required
              value={formFields.institution}
              onChange={(e) =>
                updateStudentField("institution", e.target.value)
              }
              placeholder="e.g. National Institute of Technology"
              className="w-full px-3.5 py-2 text-sm bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              {canTransact
                ? "Ready to sign transaction via MetaMask"
                : "Connect owner wallet on Hardhat (31337) to issue"}
            </div>
            <button
              type="submit"
              disabled={
                !connection.rpcConnected ||
                !connection.contractDeployed ||
                !connection.walletConnected ||
                txState.status === "signing" ||
                txState.status === "confirming"
              }
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>
                {txState.status === "signing" || txState.status === "confirming"
                  ? "Processing Transaction..."
                  : "Issue Certificate On-Chain"}
              </span>
            </button>
          </div>
        </form>

        {/* Right: Live Canonical Hash Inspector & Real-Time Transaction Receipt */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Live Cryptographic Fingerprint Preview
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact canonical payload and Keccak-256 digest computed via Ethers.js
                v6.
              </p>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-1.5">
                Canonical JSON Representation (Hashed Client-Side)
              </div>
              <pre className="p-3 rounded-lg bg-[#070B19] border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                {canonicalJson}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-cyan-400 mb-1.5">
                <span>Keccak-256 Document Hash (bytes32)</span>
                <button
                  type="button"
                  onClick={() => handleCopy(previewHash)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedHash === previewHash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Hash</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 font-mono text-xs text-cyan-300 break-all tabular-nums">
                {previewHash}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#070B19] border border-slate-800/90 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200">
                Smart Contract Call Parameters:
              </div>
              <div className="font-mono text-slate-300 break-all">
                issueCertificate(&quot;
                {formFields.certificateId.trim().toUpperCase()}&quot;,{" "}
                {shortenHash(previewHash, 10, 8)})
              </div>
            </div>
          </div>

          {/* Real-Time Transaction Status Feedback Card */}
          {txState.status !== "idle" && (
            <div
              className={`p-5 rounded-xl border ${
                txState.status === "success"
                  ? "bg-emerald-950/25 border-emerald-500/40"
                  : txState.status === "error"
                  ? "bg-rose-950/25 border-rose-500/40"
                  : "bg-indigo-950/30 border-indigo-500/40"
              }`}
            >
              <div className="flex items-start gap-3">
                {txState.status === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : txState.status === "error" ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">
                    {txState.status === "success"
                      ? txState.actionLabel
                      : txState.status === "error"
                      ? "Transaction Failed or Rejected"
                      : txState.actionLabel}
                  </div>

                  {txState.errorMessage && (
                    <p className="text-xs text-rose-200 mt-1 leading-relaxed break-words">
                      {txState.errorMessage}
                    </p>
                  )}

                  {txState.txHash && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono tabular-nums">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Tx Hash:</span>
                        <button
                          onClick={() => handleCopy(txState.txHash!)}
                          className="text-cyan-300 hover:underline flex items-center gap-1 truncate cursor-pointer"
                          title={txState.txHash}
                        >
                          <span>{shortenHash(txState.txHash, 12, 10)}</span>
                          <Copy className="w-3 h-3 shrink-0" />
                        </button>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Block Number:</span>
                        <span className="text-white">#{txState.blockNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Gas Used:</span>
                        <span className="text-white">{txState.gasUsed} gas</span>
                      </div>
                    </div>
                  )}

                  {txState.status === "success" && txState.certificateId && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenVerifyForCert(
                            txState.certificateId!,
                            recentIssuedFieldsMap[txState.certificateId!]
                          )
                        }
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
                      >
                        Verify This Certificate
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenQrForCert(
                            txState.certificateId!,
                            recentIssuedFieldsMap[txState.certificateId!]
                          )
                        }
                        className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View QR Code</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Issued Certificate Records Table */}
      <div className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white font-display">
              On-Chain Certificate Registry Records
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fetched directly from <code className="font-mono">CertificateRegistry.sol</code>{" "}
              at <code className="font-mono">{shortenAddress(connection.contractAddress, 6)}</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID or hash..."
                className="pl-9 pr-3 py-1.5 text-xs bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Interactive Segmented Filter Controls */}
            <div className="flex items-center gap-1 p-1 bg-[#070B19] border border-slate-800 rounded-lg">
              {(["all", "active", "revoked"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap cursor-pointer ${
                    statusFilter === tab
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onRefreshData}
              disabled={isLoadingData}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {!connection.rpcConnected || !connection.contractDeployed ? (
          <div className="p-10 text-center rounded-lg bg-[#070B19] border border-slate-800/80">
            <p className="text-sm text-slate-300 font-medium">
              Smart Contract Not Reachable
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Start your Hardhat node (<code className="font-mono">npm run node</code>)
              and deploy the contract (<code className="font-mono">npm run deploy</code>)
              to view on-chain certificates.
            </p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-10 text-center rounded-lg bg-[#070B19] border border-slate-800/80">
            <p className="text-sm text-slate-300 font-medium">
              {certificates.length === 0
                ? "No Certificates Issued On-Chain Yet"
                : "No Matching Certificates Found"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {certificates.length === 0
                ? "Use the Issue Academic Certificate form above to anchor your first certificate fingerprint on the blockchain."
                : "Try clearing your search query or switching the status filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="py-3 px-3 font-medium">Certificate ID</th>
                  <th className="py-3 px-3 font-medium">On-Chain Document Hash</th>
                  <th className="py-3 px-3 font-medium">Issuer Wallet</th>
                  <th className="py-3 px-3 font-medium">Issued Timestamp</th>
                  <th className="py-3 px-3 font-medium">Tx Hash</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs font-mono tabular-nums">
                {filteredCertificates.map((cert) => {
                  const savedFields = recentIssuedFieldsMap[cert.certificateId];
                  return (
                    <tr
                      key={cert.certificateId}
                      className="hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-semibold text-white whitespace-nowrap">
                        {cert.certificateId}
                      </td>
                      <td className="py-3.5 px-3 text-cyan-300 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopy(cert.documentHash)}
                          className="hover:underline flex items-center gap-1.5 cursor-pointer"
                          title={cert.documentHash}
                        >
                          <span>{shortenHash(cert.documentHash, 10, 8)}</span>
                          {copiedHash === cert.documentHash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td
                        className="py-3.5 px-3 text-slate-300 whitespace-nowrap"
                        title={cert.issuer}
                      >
                        {shortenAddress(cert.issuer, 4)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap font-sans">
                        {formatBlockchainTimestamp(cert.issuedAt)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                        {cert.issueTxHash ? (
                          <button
                            type="button"
                            onClick={() => handleCopy(cert.issueTxHash!)}
                            className="hover:text-white flex items-center gap-1 cursor-pointer"
                            title={`Block #${cert.issueBlockNumber} · ${cert.issueTxHash}`}
                          >
                            <span>{shortenHash(cert.issueTxHash, 8, 6)}</span>
                            <Copy className="w-3 h-3 text-slate-500" />
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-sans">
                        {cert.isRevoked ? (
                          <span className="text-rose-400 font-medium">
                            Revoked
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium">
                            Active Valid
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-sans">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenVerifyForCert(cert.certificateId, savedFields)
                            }
                            className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Verify</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onOpenQrForCert(cert.certificateId, savedFields)
                            }
                            className="px-2.5 py-1 text-xs font-medium text-cyan-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>QR</span>
                          </button>

                          {!cert.isRevoked && (
                            <button
                              type="button"
                              disabled={
                                revokingId === cert.certificateId ||
                                !connection.walletConnected
                              }
                              onClick={() =>
                                handleRevokeCertificate(cert.certificateId)
                              }
                              className="px-2.5 py-1 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-600 border border-rose-500/30 disabled:opacity-40 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              <span>
                                {revokingId === cert.certificateId
                                  ? "Revoking..."
                                  : "Revoke"}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
