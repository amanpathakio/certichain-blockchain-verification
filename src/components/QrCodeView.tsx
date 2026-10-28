import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Copy,
  Check,
  ArrowUpRight,
  ShieldAlert,
  Printer,
  Link2,
} from "lucide-react";
import type {
  CertificateInputFields,
  OnChainCertificate,
} from "../types/blockchain";
import { formatBlockchainTimestamp, shortenAddress } from "../utils/hash";

interface QrCodeViewProps {
  certificates: OnChainCertificate[];
  selectedCertificateId?: string;
  selectedFields?: CertificateInputFields;
  onOpenVerify: (certificateId: string, fields?: CertificateInputFields) => void;
}

export const QrCodeView: React.FC<QrCodeViewProps> = ({
  certificates,
  selectedCertificateId,
  selectedFields,
  onOpenVerify,
}) => {
  const [certId, setCertId] = useState(
    selectedCertificateId ||
      (certificates.length > 0 ? certificates[0].certificateId : "CERT-2026-CS101")
  );
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (selectedCertificateId) {
      setCertId(selectedCertificateId);
    }
  }, [selectedCertificateId]);

  const normalizedId = certId.trim().toUpperCase() || "CERT-2026-CS101";

  // Real verification URL pointing to the verification page with ?tab=verify&certId=...
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const verificationUrl = `${origin}/?tab=verify&certId=${encodeURIComponent(
    normalizedId
  )}`;

  const matchedOnChainCert = certificates.find(
    (c) => c.certificateId.toUpperCase() === normalizedId
  );

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Unverified Notice Banner */}
      <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white block text-sm mb-0.5">
            Cryptographic QR Verification Protocol
          </strong>
          This QR code encodes the real verification URL and Certificate ID (
          <code className="font-mono text-cyan-300">{normalizedId}</code>).
          Scanning or opening the link directs the verifier to the public
          Verification Portal. In accordance with zero-trust blockchain rules,
          the QR code itself does not claim authenticity—the verifier must verify
          the certificate details against the smart contract&apos;s on-chain{" "}
          <code className="font-mono">documentHash</code>.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Certificate ID Selector & URL Controls */}
        <div className="lg:col-span-6 p-6 rounded-xl bg-[#0D1326] border border-slate-800 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white font-display">
              Configure Verification QR Code
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an issued on-chain certificate or enter a Certificate ID to
              generate its verification QR code.
            </p>
          </div>

          {certificates.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Select From On-Chain Issued Certificates
              </label>
              <select
                value={normalizedId}
                onChange={(e) => setCertId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                {certificates.map((c) => (
                  <option key={c.certificateId} value={c.certificateId}>
                    {c.certificateId}{" "}
                    {c.isRevoked ? "(Revoked)" : "(Active On-Chain)"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Certificate ID
            </label>
            <input
              type="text"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="e.g. CERT-2026-CS101"
              className="w-full px-3.5 py-2 text-sm font-mono bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Encoded Verification Target URL
            </label>
            <div className="p-3.5 rounded-lg bg-[#070B19] border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-mono text-xs text-cyan-300 truncate">
                  {verificationUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {matchedOnChainCert ? (
            <div className="p-4 rounded-lg bg-[#070B19] border border-slate-800 space-y-2 text-xs font-mono tabular-nums">
              <div className="text-slate-400 font-sans font-medium">
                On-Chain Reference Found for {normalizedId}:
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issuer Wallet:</span>
                <span className="text-slate-200">
                  {shortenAddress(matchedOnChainCert.issuer, 6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issued At:</span>
                <span className="text-slate-200 font-sans">
                  {formatBlockchainTimestamp(matchedOnChainCert.issuedAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">
                  On-Chain Document Hash:
                </span>
                <span className="text-cyan-300 break-all">
                  {matchedOnChainCert.documentHash}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#070B19] border border-slate-800 text-xs text-slate-400">
              Certificate ID <code className="font-mono text-white">{normalizedId}</code>{" "}
              is not currently in the loaded on-chain list. You can still generate
              its verification QR code or issue it first from the Institution
              Dashboard.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenVerify(normalizedId, selectedFields)}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Open Verification Page for {normalizedId}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handlePrintSlip}
              className="px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Verification Slip</span>
            </button>
          </div>
        </div>

        {/* Right: Printable QR Code Verification Slip */}
        <div className="lg:col-span-6 p-8 rounded-xl bg-[#0D1326] border border-slate-800 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
            <QrCode className="w-4 h-4" />
            <span>CERTICHAIN VERIFICATION SLIP</span>
          </div>

          <h3 className="text-xl font-bold text-white font-display mb-1">
            Certificate ID: {normalizedId}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-6">
            Scan this QR code or visit the verification URL below to verify the
            certificate details against the Ethereum / Hardhat smart contract.
          </p>

          {/* High-Contrast White Frame for Reliable Optical QR Scanning */}
          <div className="p-5 rounded-xl bg-white shadow-sm inline-block mb-6">
            <QRCodeSVG
              value={verificationUrl}
              size={210}
              bgColor="#FFFFFF"
              fgColor="#070B19"
              level="M"
              includeMargin={false}
            />
          </div>

          <div className="w-full max-w-md p-4 rounded-lg bg-[#070B19] border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Certificate ID:</span>
              <span className="text-white font-semibold">{normalizedId}</span>
            </div>
            <div className="font-mono">
              <span className="text-slate-400 block mb-0.5">
                Verification URL:
              </span>
              <span className="text-cyan-300 break-all">{verificationUrl}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-slate-400 leading-relaxed">
              <strong className="text-amber-300">Verification Required:</strong>{" "}
              This slip is a lookup pointer, not proof of validity on its own.
              Authenticity is confirmed only when the certificate details match
              the on-chain Keccak-256 hash on the Verification Page.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
