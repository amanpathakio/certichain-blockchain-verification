import React, { useState } from "react";
import {
  Blocks,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Search,
  ArrowUpRight,
} from "lucide-react";
import type {
  BlockchainConnectionState,
  BlockchainTransactionRecord,
} from "../types/blockchain";
import {
  formatBlockchainTimestamp,
  shortenAddress,
  shortenHash,
} from "../utils/hash";

interface TransactionsPageProps {
  connection: BlockchainConnectionState;
  transactions: BlockchainTransactionRecord[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onOpenVerify: (certificateId: string) => void;
  onOpenSetup: () => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  connection,
  transactions,
  isLoading,
  onRefresh,
  onOpenVerify,
  onOpenSetup,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedHash(val);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  const filteredTx = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    return (
      tx.txHash.toLowerCase().includes(q) ||
      tx.certificateId.toLowerCase().includes(q) ||
      tx.eventType.toLowerCase().includes(q) ||
      tx.actor.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Network & Contract Telemetry Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0D1326] border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Network Name</div>
          <div className="text-base font-bold text-white font-display">
            {connection.rpcConnected
              ? `Hardhat Localhost (${connection.rpcChainId})`
              : "Disconnected"}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            {connection.rpcUrl}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0D1326] border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Contract Address</div>
          <div
            className="text-base font-semibold text-cyan-300 font-mono truncate"
            title={connection.contractAddress}
          >
            {shortenAddress(connection.contractAddress, 6)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {connection.contractDeployed ? "Bytecode Verified" : "Not Deployed"}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0D1326] border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Latest Block Number</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {connection.rpcConnected && connection.latestBlock !== null
              ? `#${connection.latestBlock}`
              : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Real-time RPC block height
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0D1326] border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">
            Indexed Contract Transactions
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono tabular-nums">
            {connection.contractDeployed ? transactions.length : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            CertificateIssued &amp; Revoked logs
          </div>
        </div>
      </div>

      {/* Main Transactions Table Card */}
      <div className="p-6 rounded-xl bg-[#0D1326] border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white font-display">
              On-Chain Transaction Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real blockchain event logs and transaction receipts queried via
              Ethers.js v6 (<code className="font-mono">queryFilter</code> &amp;{" "}
              <code className="font-mono">getTransactionReceipt</code>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tx hash or ID..."
                className="pl-9 pr-3 py-1.5 text-xs bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* Empty / Disconnected / Populated States */}
        {!connection.rpcConnected || !connection.contractDeployed ? (
          <div className="p-10 rounded-xl bg-[#070B19] border border-slate-800 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <div className="text-sm font-semibold text-white">
              No Blockchain Connection Available
            </div>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              CertiChain displays real blockchain transactions only and never
              fabricates mock transaction hashes. Start your local Hardhat 3 node
              (<code className="font-mono text-slate-200">npm run node</code>) and
              deploy the contract (
              <code className="font-mono text-slate-200">npm run deploy</code>) to
              inspect live transactions.
            </p>
            <button
              type="button"
              onClick={onOpenSetup}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="p-10 rounded-xl bg-[#070B19] border border-slate-800 text-center space-y-2">
            <Blocks className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-sm font-semibold text-white">
              {transactions.length === 0
                ? "No Blockchain Transactions Recorded Yet"
                : "No Matching Transactions Found"}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {transactions.length === 0
                ? "The CertificateRegistry smart contract is deployed, but no issueCertificate or revokeCertificate transactions have been mined yet. Issue a certificate in the Institution Dashboard to generate your first on-chain transaction."
                : "No transactions matched your search filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="py-3 px-3 font-medium">Transaction Hash</th>
                  <th className="py-3 px-3 font-medium">Event Action</th>
                  <th className="py-3 px-3 font-medium">Certificate ID</th>
                  <th className="py-3 px-3 font-medium">Block</th>
                  <th className="py-3 px-3 font-medium">Gas Used</th>
                  <th className="py-3 px-3 font-medium">Contract Address</th>
                  <th className="py-3 px-3 font-medium">Network</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-3 font-medium text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs font-mono tabular-nums">
                {filteredTx.map((tx) => (
                  <tr
                    key={`${tx.txHash}-${tx.eventType}-${tx.certificateId}`}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="py-3.5 px-3 text-cyan-300 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleCopy(tx.txHash)}
                        className="hover:underline flex items-center gap-1.5 cursor-pointer"
                        title={tx.txHash}
                      >
                        <span>{shortenHash(tx.txHash, 10, 8)}</span>
                        {copiedHash === tx.txHash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-sans">
                      {tx.eventType === "CertificateIssued" ? (
                        <span className="text-indigo-300 font-medium">
                          CertificateIssued
                        </span>
                      ) : (
                        <span className="text-rose-300 font-medium">
                          CertificateRevoked
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-white font-semibold whitespace-nowrap">
                      {tx.certificateId}
                    </td>
                    <td className="py-3.5 px-3 text-slate-200 whitespace-nowrap">
                      #{tx.blockNumber}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap">
                      {tx.gasUsed !== "—"
                        ? `${Number(tx.gasUsed).toLocaleString()} gas`
                        : "—"}
                    </td>
                    <td
                      className="py-3.5 px-3 text-slate-400 whitespace-nowrap"
                      title={tx.contractAddress}
                    >
                      {shortenAddress(tx.contractAddress, 4)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap font-sans">
                      {tx.networkName}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-sans">
                      <span
                        className={
                          tx.status === "Confirmed"
                            ? "text-emerald-400 font-medium"
                            : "text-rose-400 font-medium"
                        }
                      >
                        {tx.status}
                      </span>
                      <span className="text-slate-500 ml-1.5">
                        · {formatBlockchainTimestamp(tx.timestamp)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap font-sans">
                      <button
                        type="button"
                        onClick={() => onOpenVerify(tx.certificateId)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Verify ID</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
