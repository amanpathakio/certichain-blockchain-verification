import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileQuestion,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  QrCode,
  Sparkles,
} from "lucide-react";
import type {
  BlockchainConnectionState,
  CertificateInputFields,
  OnChainCertificate,
  VerificationResult,
} from "../types/blockchain";
import {
  computeCertificateHash,
  formatBlockchainTimestamp,
} from "../utils/hash";
import {
  lookupCertificateById,
  parseBlockchainError,
  verifyCertificateOnChain,
} from "../services/blockchainService";

interface VerifyCertificateProps {
  connection: BlockchainConnectionState;
  initialCertificateId?: string;
  initialFields?: CertificateInputFields;
  recentIssuedFieldsMap: Record<string, CertificateInputFields>;
  onOpenQrForCert: (certificateId: string, fields?: CertificateInputFields) => void;
  onOpenSetup: () => void;
}

export const VerifyCertificate: React.FC<VerifyCertificateProps> = ({
  connection,
  initialCertificateId,
  initialFields,
  recentIssuedFieldsMap,
  onOpenQrForCert,
  onOpenSetup,
}) => {
  const [fields, setFields] = useState<CertificateInputFields>({
    certificateId: initialCertificateId || "CERT-2026-CS101",
    studentName: initialFields?.studentName || "Aarav Sharma",
    course:
      initialFields?.course || "B.Tech in Computer Science & Engineering",
    institution:
      initialFields?.institution || "National Institute of Technology",
    issueDate: initialFields?.issueDate || "2026-05-15",
  });

  const [lookupOnlyId, setLookupOnlyId] = useState(
    initialCertificateId || "CERT-2026-CS101"
  );
  const [lookupResult, setLookupResult] = useState<OnChainCertificate | null>(
    null
  );
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Sync if navigated from QR Code or Dashboard "Verify" button
  useEffect(() => {
    if (initialCertificateId) {
      const normalized = initialCertificateId.trim().toUpperCase();
      setLookupOnlyId(normalized);
      const saved = initialFields || recentIssuedFieldsMap[normalized];
      if (saved) {
        setFields(saved);
      } else {
        setFields((prev) => ({
          ...prev,
          certificateId: normalized,
        }));
      }
      setVerificationResult(null);
      setErrorMessage(null);
    }
  }, [initialCertificateId, initialFields, recentIssuedFieldsMap]);

  const { hash: liveComputedHash, canonicalJson } =
    computeCertificateHash(fields);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(val);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLookupResult(null);

    if (
      !fields.certificateId.trim() ||
      !fields.studentName.trim() ||
      !fields.course.trim() ||
      !fields.institution.trim() ||
      !fields.issueDate.trim()
    ) {
      setErrorMessage(
        "Please enter the Certificate ID and all holder fields to recompute the Keccak-256 hash."
      );
      return;
    }

    try {
      setIsVerifying(true);
      const res = await verifyCertificateOnChain(
        connection.rpcUrl,
        connection.contractAddress,
        fields
      );
      setVerificationResult(res);
    } catch (err) {
      setErrorMessage(parseBlockchainError(err));
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLookupIdOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setVerificationResult(null);

    if (!lookupOnlyId.trim()) {
      setErrorMessage("Enter a Certificate ID to check its on-chain status.");
      return;
    }

    try {
      setIsLookingUp(true);
      const record = await lookupCertificateById(
        connection.rpcUrl,
        connection.contractAddress,
        lookupOnlyId
      );
      setLookupResult(record);
      setFields((prev) => ({
        ...prev,
        certificateId: lookupOnlyId.trim().toUpperCase(),
      }));
    } catch (err) {
      setErrorMessage(parseBlockchainError(err));
      setLookupResult(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSimulateTamper = () => {
    setFields((prev) => ({
      ...prev,
      course: prev.course.includes("(Honors)")
        ? prev.course.replace(" (Honors)", "")
        : `${prev.course} (Honors)`,
    }));
    setVerificationResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Read-Only RPC Availability Banner */}
      <div className="p-5 rounded-xl bg-[#0D1326] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-cyan-400 font-medium mb-1">
            Public Trustless Verification Portal · No Wallet Required
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Employers and verifiers can verify certificates directly via read-only
            JSON-RPC (<code className="font-mono">{connection.rpcUrl}</code>)
            without connecting MetaMask. Authenticity is verified by recomputing
            the candidate&apos;s Keccak-256 fingerprint and comparing it against the
            smart contract&apos;s immutable <code className="font-mono">documentHash</code>.
          </p>
        </div>

        {!connection.rpcConnected || !connection.contractDeployed ? (
          <button
            onClick={onOpenSetup}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Retry Connection
          </button>
        ) : (
          <div className="text-xs font-mono text-emerald-400 shrink-0">
            RPC Connected (Chain {connection.rpcChainId})
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block text-sm mb-0.5">
              Verification Query Error
            </strong>
            {errorMessage}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Full Cryptographic Verification Form */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleVerifySubmit}
            className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  Verify Certificate Authenticity
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter the Certificate ID and certificate details to recompute and
                  verify the on-chain hash.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSimulateTamper}
                className="px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-center whitespace-nowrap cursor-pointer"
                title="Modifies the course field slightly so you can demonstrate Tampered Certificate Detection"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Tampering</span>
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
                  value={fields.certificateId}
                  onChange={(e) =>
                    setFields({ ...fields, certificateId: e.target.value })
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
                  value={fields.issueDate}
                  onChange={(e) =>
                    setFields({ ...fields, issueDate: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={fields.studentName}
                onChange={(e) =>
                  setFields({ ...fields, studentName: e.target.value })
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
                value={fields.course}
                onChange={(e) =>
                  setFields({ ...fields, course: e.target.value })
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
                value={fields.institution}
                onChange={(e) =>
                  setFields({ ...fields, institution: e.target.value })
                }
                placeholder="e.g. National Institute of Technology"
                className="w-full px-3.5 py-2 text-sm bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-[#070B19] border border-slate-800 space-y-1.5">
              <div className="text-xs text-slate-400">
                Recomputed Candidate Keccak-256 Hash:
              </div>
              <div className="font-mono text-xs text-cyan-300 break-all tabular-nums">
                {liveComputedHash}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="submit"
                disabled={isVerifying || !connection.rpcConnected}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>
                  {isVerifying
                    ? "Querying Smart Contract..."
                    : "Verify Against Blockchain"}
                </span>
              </button>
            </div>
          </form>

          {/* Secondary Quick ID Lookup Tool */}
          <form
            onSubmit={handleLookupIdOnly}
            className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                Quick On-Chain ID Existence Check (getCertificate)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Check if a Certificate ID is registered on the smart contract and
                view its stored hash before verifying full holder details.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={lookupOnlyId}
                onChange={(e) => setLookupOnlyId(e.target.value)}
                placeholder="Enter Certificate ID (e.g. CERT-2026-CS101)"
                className="flex-1 px-3.5 py-2 text-xs font-mono bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isLookingUp || !connection.rpcConnected}
                className="px-4 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                {isLookingUp ? "Checking..." : "Lookup ID On-Chain"}
              </button>
            </div>

            {lookupResult && (
              <div className="p-4 rounded-lg bg-[#070B19] border border-slate-800 space-y-2 text-xs font-mono tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">On-Chain Existence:</span>
                  <span
                    className={
                      lookupResult.exists ? "text-emerald-400" : "text-slate-400"
                    }
                  >
                    {lookupResult.exists
                      ? "Registered On-Chain"
                      : "Not Found On-Chain"}
                  </span>
                </div>
                {lookupResult.exists && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Revocation Status:</span>
                      <span
                        className={
                          lookupResult.isRevoked
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }
                      >
                        {lookupResult.isRevoked ? "REVOKED" : "Active (Unrevoked)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">
                        Stored On-Chain Document Hash:
                      </span>
                      <span className="text-cyan-300 break-all">
                        {lookupResult.documentHash}
                      </span>
                    </div>
                    <div className="pt-2 text-amber-300 font-sans">
                      Note: ID existence alone does not prove document authenticity.
                      Enter the student&apos;s certificate details in the form above to
                      verify that the document contents match this on-chain hash.
                    </div>
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Cryptographic Verification Verdict Panel */}
        <div className="lg:col-span-5 space-y-6">
          {!verificationResult ? (
            <div className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white font-display">
                Blockchain Verification Verdict
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit the Certificate ID and holder details on the left to
                execute <code className="font-mono text-slate-200">verifyCertificate(id, hash)</code>{" "}
                against the smart contract.
              </p>

              <div className="p-4 rounded-lg bg-[#070B19] border border-slate-800 space-y-3 text-xs">
                <div className="text-slate-300 font-semibold">
                  How the Smart Contract Evaluates Authenticity:
                </div>
                <div className="space-y-2 text-slate-400">
                  <div>
                    <strong className="text-emerald-400">1. VALID:</strong> ID
                    exists on-chain, <code className="font-mono">isRevoked == false</code>,
                    and Computed Hash equals On-Chain Hash.
                  </div>
                  <div>
                    <strong className="text-amber-400">2. TAMPERED:</strong> ID
                    exists on-chain, but Computed Hash does NOT match On-Chain Hash
                    (one or more fields were altered).
                  </div>
                  <div>
                    <strong className="text-rose-400">3. REVOKED:</strong> ID
                    exists on-chain, but <code className="font-mono">isRevoked == true</code>{" "}
                    (revoked certificates are strictly prevented from verifying as
                    valid).
                  </div>
                  <div>
                    <strong className="text-slate-200">4. NOT FOUND:</strong>{" "}
                    Certificate ID has never been issued on this smart contract.
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1.5">
                  Canonical Pre-Image Being Prepared:
                </div>
                <pre className="p-3 rounded-lg bg-[#070B19] border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {canonicalJson}
                </pre>
              </div>
            </div>
          ) : (
            <div
              className={`p-6 rounded-xl border space-y-6 ${
                verificationResult.status === "VALID"
                  ? "bg-emerald-950/20 border-emerald-500/40"
                  : verificationResult.status === "REVOKED"
                  ? "bg-rose-950/25 border-rose-500/40"
                  : verificationResult.status === "TAMPERED"
                  ? "bg-amber-950/25 border-amber-500/40"
                  : "bg-[#0D1326] border-slate-700"
              }`}
            >
              {/* Status Header */}
              <div className="flex items-start gap-4">
                {verificationResult.status === "VALID" && (
                  <ShieldCheck className="w-9 h-9 text-emerald-400 shrink-0" />
                )}
                {verificationResult.status === "TAMPERED" && (
                  <ShieldAlert className="w-9 h-9 text-amber-400 shrink-0" />
                )}
                {verificationResult.status === "REVOKED" && (
                  <ShieldX className="w-9 h-9 text-rose-400 shrink-0" />
                )}
                {verificationResult.status === "NOT_FOUND" && (
                  <FileQuestion className="w-9 h-9 text-slate-400 shrink-0" />
                )}

                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    On-Chain Verification Result
                  </div>
                  <h3
                    className={`text-2xl font-bold font-display mt-0.5 ${
                      verificationResult.status === "VALID"
                        ? "text-emerald-400"
                        : verificationResult.status === "TAMPERED"
                        ? "text-amber-400"
                        : verificationResult.status === "REVOKED"
                        ? "text-rose-400"
                        : "text-slate-200"
                    }`}
                  >
                    {verificationResult.status === "VALID" &&
                      "VALID — Authentic Credential"}
                    {verificationResult.status === "TAMPERED" &&
                      "TAMPERED — Hash Mismatch"}
                    {verificationResult.status === "REVOKED" &&
                      "REVOKED — Credential Invalidated"}
                    {verificationResult.status === "NOT_FOUND" &&
                      "NOT FOUND — Unregistered ID"}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {verificationResult.status === "VALID" &&
                      "The recomputed Keccak-256 fingerprint matches the immutable on-chain record byte-for-byte, and the certificate is active."}
                    {verificationResult.status === "TAMPERED" &&
                      "This Certificate ID exists on the blockchain, but the hash of the entered details does NOT match the on-chain fingerprint. The certificate details have been altered or forged."}
                    {verificationResult.status === "REVOKED" &&
                      "This certificate was originally issued by the institution, but has been revoked on-chain and cannot be accepted as valid."}
                    {verificationResult.status === "NOT_FOUND" &&
                      "No certificate with this ID exists on the CertificateRegistry smart contract."}
                  </p>
                </div>
              </div>

              {/* Hash Comparison Box */}
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <div className="p-3.5 rounded-lg bg-[#070B19] border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Computed Keccak-256 Hash (From Entered Details)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(verificationResult.computedHash)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === verificationResult.computedHash ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-cyan-300 break-all tabular-nums">
                    {verificationResult.computedHash}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#070B19] border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>On-Chain Stored Document Hash (Smart Contract)</span>
                    {verificationResult.exists && (
                      <span
                        className={`font-semibold ${
                          verificationResult.hashMatches
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {verificationResult.hashMatches
                          ? "Exact Match"
                          : "Mismatch Detected"}
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-mono text-xs break-all tabular-nums ${
                      !verificationResult.exists
                        ? "text-slate-500"
                        : verificationResult.hashMatches
                        ? "text-emerald-300"
                        : "text-amber-300"
                    }`}
                  >
                    {verificationResult.exists
                      ? verificationResult.onChainHash
                      : "0x0000000000000000000000000000000000000000000000000000000000000000 (Not Registered)"}
                  </div>
                </div>
              </div>

              {/* On-Chain Provenance Metadata */}
              {verificationResult.exists && (
                <div className="p-4 rounded-lg bg-[#070B19] border border-slate-800 space-y-2.5 text-xs font-mono tabular-nums">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Certificate ID:</span>
                    <span className="text-white font-semibold">
                      {verificationResult.certificateId}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Issuing Wallet:</span>
                    <span
                      className="text-cyan-300 truncate max-w-[220px]"
                      title={verificationResult.issuer}
                    >
                      {verificationResult.issuer}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Blockchain Timestamp:</span>
                    <span className="text-white font-sans">
                      {formatBlockchainTimestamp(verificationResult.issuedAt)}{" "}
                      <span className="text-slate-500 font-mono">
                        ({verificationResult.issuedAt})
                      </span>
                    </span>
                  </div>
                  {verificationResult.isRevoked && (
                    <div className="flex justify-between gap-2">
                      <span className="text-rose-400">Revoked Timestamp:</span>
                      <span className="text-rose-300 font-sans">
                        {formatBlockchainTimestamp(verificationResult.revokedAt)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {verificationResult.exists && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenQrForCert(verificationResult.certificateId, fields)
                    }
                    className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open QR Code for {verificationResult.certificateId}</span>
                  </button>

                  {verificationResult.status === "VALID" && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Verified On-Chain
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
