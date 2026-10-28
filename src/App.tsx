/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  QrCode,
  Blocks,
  Home,
  Wallet,
  AlertTriangle,
  Menu,
  X,
  Settings,
  RefreshCw,
} from "lucide-react";
import { BLOCKCHAIN_CONFIG } from "./contracts/contractConfig";
import type {
  BlockchainConnectionState,
  BlockchainTransactionRecord,
  CertificateInputFields,
  ContractStats,
  OnChainCertificate,
} from "./types/blockchain";
import {
  connectMetaMaskWallet,
  fetchAllBlockchainData,
  parseBlockchainError,
  probeBlockchainState,
  switchToHardhatNetwork,
} from "./services/blockchainService";
import { shortenAddress } from "./utils/hash";
import { LandingPage } from "./components/LandingPage";
import { InstitutionDashboard } from "./components/InstitutionDashboard";
import { VerifyCertificate } from "./components/VerifyCertificate";
import { QrCodeView } from "./components/QrCodeView";
import { TransactionsPage } from "./components/TransactionsPage";

type ActiveTab = "landing" | "dashboard" | "verify" | "qr" | "transactions";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("landing");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Configurable local Hardhat RPC URL and deployed contract address
  const [rpcUrl, setRpcUrl] = useState<string>(
    BLOCKCHAIN_CONFIG.DEFAULT_RPC_URL
  );
  const [contractAddress, setContractAddress] = useState<string>(
    BLOCKCHAIN_CONFIG.DEFAULT_CONTRACT_ADDRESS
  );
  const [draftRpc, setDraftRpc] = useState<string>(
    BLOCKCHAIN_CONFIG.DEFAULT_RPC_URL
  );
  const [draftContract, setDraftContract] = useState<string>(
    BLOCKCHAIN_CONFIG.DEFAULT_CONTRACT_ADDRESS
  );

  // Connection and contract state
  const [connection, setConnection] = useState<BlockchainConnectionState>({
    rpcConnected: false,
    contractDeployed: false,
    rpcUrl: BLOCKCHAIN_CONFIG.DEFAULT_RPC_URL,
    contractAddress: BLOCKCHAIN_CONFIG.DEFAULT_CONTRACT_ADDRESS,
    rpcChainId: null,
    latestBlock: null,
    contractOwner: null,
    walletInstalled: false,
    walletConnected: false,
    walletAddress: null,
    walletChainId: null,
    isCorrectNetwork: false,
    isOwnerWallet: false,
    connectionError: null,
  });

  const [stats, setStats] = useState<ContractStats>({
    totalIssued: 0,
    activeValid: 0,
    totalRevoked: 0,
    contractOwner: "",
  });
  const [certificates, setCertificates] = useState<OnChainCertificate[]>([]);
  const [transactions, setTransactions] = useState<
    BlockchainTransactionRecord[]
  >([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Selected certificate ID & optional in-session fields for quick navigation between Dashboard -> Verify / QR
  const [targetCertId, setTargetCertId] = useState<string | undefined>(
    undefined
  );
  const [targetFields, setTargetFields] = useState<
    CertificateInputFields | undefined
  >(undefined);
  const [recentIssuedFieldsMap, setRecentIssuedFieldsMap] = useState<
    Record<string, CertificateInputFields>
  >({
    "CERT-2026-CS101": {
      certificateId: "CERT-2026-CS101",
      studentName: "Aarav Sharma",
      course: "B.Tech in Computer Science & Engineering",
      institution: "National Institute of Technology",
      issueDate: "2026-05-15",
    },
    "CERT-2026-EC204": {
      certificateId: "CERT-2026-EC204",
      studentName: "Priya Nair",
      course: "B.Tech in Electronics & Communication",
      institution: "National Institute of Technology",
      issueDate: "2026-05-15",
    },
  });

  // Check URL query parameters on initial load (e.g., from scanning a QR code: /?tab=verify&certId=CERT-2026-CS101)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const certIdParam = params.get("certId");

    if (certIdParam) {
      setTargetCertId(certIdParam.trim().toUpperCase());
      setActiveTab("verify");
    } else if (
      tabParam === "dashboard" ||
      tabParam === "verify" ||
      tabParam === "qr" ||
      tabParam === "transactions"
    ) {
      setActiveTab(tabParam);
    }
  }, []);

  // Synchronize blockchain connection & on-chain records
  const refreshAllState = useCallback(
    async (overrideRpc?: string, overrideContract?: string) => {
      const targetRpc = overrideRpc ?? rpcUrl;
      const targetContract = overrideContract ?? contractAddress;

      setIsLoadingData(true);
      try {
        const state = await probeBlockchainState(targetRpc, targetContract);
        setConnection(state);

        if (state.rpcConnected && state.contractDeployed) {
          const data = await fetchAllBlockchainData(targetRpc, targetContract);
          setStats(data.stats);
          setCertificates(data.certificates);
          setTransactions(data.transactions);
        } else {
          setCertificates([]);
          setTransactions([]);
          setStats({
            totalIssued: 0,
            activeValid: 0,
            totalRevoked: 0,
            contractOwner: state.contractOwner || "",
          });
        }
      } catch {
        // State is already captured in probeBlockchainState
      } finally {
        setIsLoadingData(false);
      }
    },
    [rpcUrl, contractAddress]
  );

  useEffect(() => {
    refreshAllState();
  }, [refreshAllState]);

  // Subscribe to MetaMask account and network changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum?.on) return;

    const handleAccountsChanged = () => {
      setWalletError(null);
      refreshAllState();
    };
    const handleChainChanged = () => {
      setWalletError(null);
      refreshAllState();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [refreshAllState]);

  const handleConnectWallet = async () => {
    setWalletError(null);
    try {
      await connectMetaMaskWallet();
      await refreshAllState();
    } catch (err) {
      setWalletError(parseBlockchainError(err));
    }
  };

  const handleSwitchNetwork = async () => {
    setWalletError(null);
    try {
      await switchToHardhatNetwork(rpcUrl);
      await refreshAllState();
    } catch (err) {
      setWalletError(parseBlockchainError(err));
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRpc = draftRpc.trim() || BLOCKCHAIN_CONFIG.DEFAULT_RPC_URL;
    const cleanContract =
      draftContract.trim() || BLOCKCHAIN_CONFIG.DEFAULT_CONTRACT_ADDRESS;
    setRpcUrl(cleanRpc);
    setContractAddress(cleanContract);
    setSettingsModalOpen(false);
    refreshAllState(cleanRpc, cleanContract);
  };

  const handleSaveRecentIssuedFields = (
    certId: string,
    fields: CertificateInputFields
  ) => {
    setRecentIssuedFieldsMap((prev) => ({
      ...prev,
      [certId.toUpperCase()]: fields,
    }));
  };

  const handleOpenQrForCert = (
    certId: string,
    fields?: CertificateInputFields
  ) => {
    setTargetCertId(certId);
    setTargetFields(fields);
    setActiveTab("qr");
  };

  const handleOpenVerifyForCert = (
    certId: string,
    fields?: CertificateInputFields
  ) => {
    setTargetCertId(certId);
    setTargetFields(fields);
    setActiveTab("verify");
  };

  if (activeTab === "landing") {
    return (
      <LandingPage
        onOpenWorkspace={(tab) => setActiveTab(tab)}
        rpcConnected={connection.rpcConnected}
        contractDeployed={connection.contractDeployed}
        totalIssued={stats.totalIssued}
      />
    );
  }

  const navItems: {
    id: Exclude<ActiveTab, "landing">;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: "dashboard",
      label: "Institution Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "verify",
      label: "Verify Certificate",
      icon: ShieldCheck,
    },
    {
      id: "qr",
      label: "QR Code & Slip",
      icon: QrCode,
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: Blocks,
    },
  ];

  const currentTabTitle =
    navItems.find((i) => i.id === activeTab)?.label || "Portal";

  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 flex">
      {/* Desktop Sidebar Navigation (260px) */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col justify-between bg-[#0A0F20] border-r border-slate-800/80">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab("landing")}
              className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap cursor-pointer"
            >
              CertiChain
            </button>
            <span className="text-xs font-mono text-slate-400">31337</span>
          </div>

          {/* Primary Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("landing")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Home</span>
            </button>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Blockchain Connection Status */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 text-xs">
          <div className="p-3.5 rounded-lg bg-[#070B19] border border-slate-800 space-y-1.5 font-mono tabular-nums">
            <div className="flex items-center justify-between font-sans">
              <span className="text-slate-400">Network Node:</span>
              <span
                className={
                  connection.rpcConnected
                    ? "text-emerald-400 font-semibold"
                    : "text-amber-400 font-semibold"
                }
              >
                {connection.rpcConnected ? "Connected" : "Offline"}
              </span>
            </div>
            <div className="flex items-center justify-between font-sans">
              <span className="text-slate-400">Contract:</span>
              <span
                className={
                  connection.contractDeployed
                    ? "text-cyan-300 font-mono"
                    : "text-amber-400 font-sans"
                }
              >
                {connection.contractDeployed
                  ? shortenAddress(connection.contractAddress, 4)
                  : "Not Deployed"}
              </span>
            </div>
            {connection.latestBlock !== null && (
              <div className="flex items-center justify-between font-sans">
                <span className="text-slate-400">Block Height:</span>
                <span className="text-slate-200 font-mono">
                  #{connection.latestBlock}
                </span>
              </div>
            )}
            <div className="pt-2 mt-1 border-t border-slate-800/80 flex items-center justify-between font-sans">
              <button
                type="button"
                onClick={() => refreshAllState()}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isLoadingData ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftRpc(rpcUrl);
                  setDraftContract(contractAddress);
                  setSettingsModalOpen(true);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>Endpoint</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-[#0A0F20] border-r border-slate-800 flex flex-col justify-between z-10">
            <div>
              <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
                <span className="text-lg font-bold text-white font-display">
                  CertiChain
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("landing");
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors whitespace-nowrap"
                >
                  <Home className="w-4 h-4 shrink-0" />
                  <span>Home</span>
                </button>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Compact RPC / Contract Address Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="w-full max-w-md rounded-xl bg-[#0D1326] border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-display">
                Network &amp; Contract Configuration
              </h3>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Hardhat RPC Endpoint (Chain ID 31337)
                </label>
                <input
                  type="text"
                  value={draftRpc}
                  onChange={(e) => setDraftRpc(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  CertificateRegistry Contract Address
                </label>
                <input
                  type="text"
                  value={draftContract}
                  onChange={(e) => setDraftContract(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#070B19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftRpc(BLOCKCHAIN_CONFIG.DEFAULT_RPC_URL);
                    setDraftContract(BLOCKCHAIN_CONFIG.DEFAULT_CONTRACT_ADDRESS);
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                >
                  Reset Default
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer"
                >
                  Save &amp; Reconnect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* SaaS Top Bar Contract: Breadcrumb on Left, Primary Wallet Action on Right */}
        <header className="h-16 px-6 lg:px-10 bg-[#0A0F20]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800/60"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <button
                type="button"
                onClick={() => setActiveTab("landing")}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                CertiChain
              </button>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-white truncate">
                {currentTabTitle}
              </span>
            </div>
          </div>

          {/* Right Zone: Primary Wallet Action */}
          <div className="flex items-center gap-3 shrink-0">
            {connection.walletConnected && !connection.isCorrectNetwork && (
              <button
                type="button"
                onClick={handleSwitchNetwork}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Switch to Hardhat (31337)
              </button>
            )}

            {connection.walletConnected ? (
              <button
                type="button"
                onClick={() => {
                  setDraftRpc(rpcUrl);
                  setDraftContract(contractAddress);
                  setSettingsModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-mono font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                title={connection.walletAddress || ""}
              >
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span>{shortenAddress(connection.walletAddress, 4)}</span>
                <span className="text-slate-400 font-sans">
                  · {connection.isOwnerWallet ? "Owner" : "Connected"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectWallet}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect MetaMask</span>
              </button>
            )}
          </div>
        </header>

        {/* Wallet Error Banner if any */}
        {walletError && (
          <div className="mx-6 lg:mx-10 mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between gap-4 text-xs text-rose-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{walletError}</span>
            </div>
            <button
              type="button"
              onClick={() => setWalletError(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active View Viewport */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <InstitutionDashboard
              connection={connection}
              stats={stats}
              certificates={certificates}
              isLoadingData={isLoadingData}
              onConnectWallet={handleConnectWallet}
              onSwitchNetwork={handleSwitchNetwork}
              onRefreshData={() => refreshAllState()}
              onOpenQrForCert={handleOpenQrForCert}
              onOpenVerifyForCert={handleOpenVerifyForCert}
              onOpenSetup={() => {
                setDraftRpc(rpcUrl);
                setDraftContract(contractAddress);
                setSettingsModalOpen(true);
              }}
              recentIssuedFieldsMap={recentIssuedFieldsMap}
              onSaveRecentIssuedFields={handleSaveRecentIssuedFields}
            />
          )}

          {activeTab === "verify" && (
            <VerifyCertificate
              connection={connection}
              initialCertificateId={targetCertId}
              initialFields={targetFields}
              recentIssuedFieldsMap={recentIssuedFieldsMap}
              onOpenQrForCert={handleOpenQrForCert}
              onOpenSetup={() => refreshAllState()}
            />
          )}

          {activeTab === "qr" && (
            <QrCodeView
              certificates={certificates}
              selectedCertificateId={targetCertId}
              selectedFields={targetFields}
              onOpenVerify={handleOpenVerifyForCert}
            />
          )}

          {activeTab === "transactions" && (
            <TransactionsPage
              connection={connection}
              transactions={transactions}
              isLoading={isLoadingData}
              onRefresh={() => refreshAllState()}
              onOpenVerify={(certId) =>
                handleOpenVerifyForCert(
                  certId,
                  recentIssuedFieldsMap[certId.toUpperCase()]
                )
              }
              onOpenSetup={() => refreshAllState()}
            />
          )}
        </main>
      </div>
    </div>
  );
}
