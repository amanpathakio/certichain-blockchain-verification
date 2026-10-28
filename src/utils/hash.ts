import { keccak256, toUtf8Bytes } from "ethers";
import type { CertificateInputFields } from "../types/blockchain";

/**
 * Normalizes certificate input fields into a deterministic canonical JSON string.
 * This ensures that identical academic records always produce the exact same
 * 256-bit Keccak-256 fingerprint across issuance, verification, and automated tests.
 *
 * Importantly, personal student fields are hashed locally in the browser and
 * NEVER stored in plaintext on the blockchain.
 */
export function createCanonicalPayload(fields: CertificateInputFields): string {
  return JSON.stringify({
    certificateId: fields.certificateId.trim().toUpperCase(),
    studentName: fields.studentName.trim().toLowerCase(),
    course: fields.course.trim().toLowerCase(),
    institution: fields.institution.trim().toLowerCase(),
    issueDate: fields.issueDate.trim(),
  });
}

/**
 * Computes the Keccak-256 hash of the canonical certificate representation
 * using Ethers.js v6.
 */
export function computeCertificateHash(fields: CertificateInputFields): {
  hash: string;
  canonicalJson: string;
} {
  const canonicalJson = createCanonicalPayload(fields);
  const hash = keccak256(toUtf8Bytes(canonicalJson));
  return { hash, canonicalJson };
}

/**
 * Formats an Ethereum wallet or contract address into a concise 0x1234...abcd string.
 */
export function shortenAddress(address: string | null | undefined, chars = 4): string {
  if (!address || address.length < 10) return address || "—";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Formats a 32-byte Keccak-256 hash or transaction hash for compact table display.
 */
export function shortenHash(hash: string | null | undefined, start = 10, end = 8): string {
  if (!hash || hash.length < start + end) return hash || "—";
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

/**
 * Formats a Unix epoch timestamp (in seconds) into a human-readable date/time string.
 */
export function formatBlockchainTimestamp(unixSeconds: number): string {
  if (!unixSeconds || unixSeconds <= 0) return "—";
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
