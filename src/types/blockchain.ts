export interface CertificateInputFields {
  certificateId: string;
  studentName: string;
  course: string;
  institution: string;
  issueDate: string;
}

export interface OnChainCertificate {
  certificateId: string;
  documentHash: string;
  issuer: string;
  issuedAt: number;
  isRevoked: boolean;
  revokedAt: number;
  exists: boolean;
  issueTxHash?: string;
  issueBlockNumber?: number;
  revokeTxHash?: string;
  revokeBlockNumber?: number;
}

export type VerificationStatusType =
  | "VALID"
  | "REVOKED"
  | "TAMPERED"
  | "NOT_FOUND";

export interface VerificationResult {
  status: VerificationStatusType;
  certificateId: string;
  computedHash: string;
  canonicalJson: string;
  onChainHash: string;
  issuer: string;
  issuedAt: number;
  revokedAt: number;
  isValid: boolean;
  exists: boolean;
  isRevoked: boolean;
  hashMatches: boolean;
}

export interface BlockchainTransactionRecord {
  txHash: string;
  eventType: "CertificateIssued" | "CertificateRevoked";
  certificateId: string;
  documentHash?: string;
  actor: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: string;
  status: "Confirmed" | "Failed";
  contractAddress: string;
  networkName: string;
}

export interface ContractStats {
  totalIssued: number;
  activeValid: number;
  totalRevoked: number;
  contractOwner: string;
}

export interface BlockchainConnectionState {
  rpcConnected: boolean;
  contractDeployed: boolean;
  rpcUrl: string;
  contractAddress: string;
  rpcChainId: number | null;
  latestBlock: number | null;
  contractOwner: string | null;
  walletInstalled: boolean;
  walletConnected: boolean;
  walletAddress: string | null;
  walletChainId: number | null;
  isCorrectNetwork: boolean;
  isOwnerWallet: boolean;
  connectionError: string | null;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
