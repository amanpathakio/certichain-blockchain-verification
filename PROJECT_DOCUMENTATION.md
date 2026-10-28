# CertiChain: Blockchain-Based Academic Certificate Verification System
## Comprehensive Academic Project Documentation

---

## 1. Abstract

Academic credential forgery and unauthorized tampering of university transcripts pose significant challenges to educational institutions and employers worldwide. Conventional verification workflows rely on slow manual correspondence or centralized databases that remain vulnerable to single-point failures, insider manipulation, and downtime.

**CertiChain** presents a decentralized, privacy-preserving academic certificate verification system built on an Ethereum-compatible blockchain using **Solidity 0.8.28**, **Hardhat 3**, **OpenZeppelin Ownable access control**, **Ethers.js v6**, and **React 19**. Instead of storing sensitive personal student records on-chain, CertiChain normalizes certificate fields into a deterministic canonical JSON format in the client browser and computes a 256-bit **Keccak-256** cryptographic fingerprint. Only the Certificate ID, 32-byte document hash, issuer wallet address, block timestamp, and revocation flag are recorded on the smart contract. Employers and verifiers can independently recompute the hash of a presented certificate and query the smart contract via read-only JSON-RPC—without requiring a cryptocurrency wallet—to deterministically classify any credential as **Valid**, **Tampered**, **Revoked**, or **Not Found**.

---

## 2. Introduction

Academic certificates serve as foundational proof of a graduate's qualifications. Whenever a student applies for higher education or employment, the receiving organization must verify that:
1. The certificate was genuinely issued by the stated university.
2. None of the fields (such as student name, degree program, or issue date) have been altered after issuance.
3. The certificate has not been subsequently revoked by the institution due to academic misconduct or administrative error.

Blockchain technology provides an append-only, cryptographically verifiable ledger executed by deterministic smart contracts. By combining Solidity smart contracts with collision-resistant Keccak-256 hashing, CertiChain establishes a trustless verification layer that eliminates reliance on third-party intermediaries while preserving student data privacy.

---

## 3. Existing System & Limitations

### 3.1 Manual Registrar Verification
- **Process:** Employers email or call the university examination cell and wait for manual lookup in physical ledgers.
- **Drawbacks:** High turnaround time (days to weeks), administrative overhead, and susceptibility to phishing or fake registrar contact details.

### 3.2 Centralized Web Databases
- **Process:** Universities host a SQL/NoSQL database of issued certificates on a web server.
- **Drawbacks:**
  - **Single Point of Failure:** If the server goes offline, verification becomes impossible.
  - **Mutable Records:** Database administrators or attackers who breach the server can silently insert or alter records without leaving an immutable audit trail.

### 3.3 Naive On-Chain Document Storage
- **Process:** Writing student names, grades, and personal data directly into smart contract strings.
- **Drawbacks:** Violates data privacy regulations (since public blockchain state is permanently readable by anyone) and incurs prohibitive gas costs.

---

## 4. Proposed System (CertiChain)

CertiChain introduces a hybrid **Off-Chain Canonical Hashing + On-Chain Fingerprint Registry** architecture:

1. **Privacy by Design:** Student names, courses, and institutions are never transmitted to or stored on the smart contract.
2. **Deterministic Canonical Hashing:** Certificate fields are trimmed, normalized for casing, serialized into a canonical JSON payload, and hashed via `keccak256(toUtf8Bytes(canonicalJson))` in Ethers.js v6.
3. **Role-Based Smart Contract Security:** The `CertificateRegistry` contract inherits OpenZeppelin's `Ownable` contract, ensuring that only the authorized university deployer wallet (`onlyOwner`) can issue or revoke certificates.
4. **Four-State Verification Logic:** The smart contract evaluates candidate hashes against stored records and explicitly prevents revoked or tampered credentials from verifying as valid.
5. **Walletless Public Verification:** Anyone with access to the JSON-RPC endpoint can verify credentials for free using read-only `view` calls (`verifyCertificate` and `getCertificate`).

---

## 5. Objectives

1. **Design and implement `CertificateRegistry.sol`** in Solidity `0.8.28` with OpenZeppelin `Ownable` access control, duplicate ID prevention, revocation support, and event emission (`CertificateIssued`, `CertificateRevoked`).
2. **Configure a local Hardhat 3 blockchain environment** (Chain ID `31337`) with a Hardhat Ignition deployment module and an automated Mocha/Chai test suite.
3. **Develop an Institution Dashboard** in React and TypeScript that connects to MetaMask, enforces network and owner checks, computes live Keccak-256 hashes, signs transactions, and displays contract-derived statistics.
4. **Build a Public Verification Portal** capable of detecting **Valid**, **Tampered**, **Revoked**, and **Not Found** states without requiring a connected wallet.
5. **Integrate QR Code Verification Slips** and an event-driven **Blockchain Transaction Explorer** showing real transaction hashes, block numbers, and gas consumption.

---

## 6. System Architecture & Data Flow

### 6.1 Smart Contract Data Structure (`CertificateRegistry.sol`)

Each certificate on-chain is represented by the following Solidity `struct`:

```solidity
struct Certificate {
    string certificateId;
    bytes32 documentHash;
    address issuer;
    uint256 issuedAt;
    bool isRevoked;
    uint256 revokedAt;
    bool exists;
}
```

### 6.2 Canonical Hashing Specification (`src/utils/hash.ts`)

Given the input fields `(certificateId, studentName, course, institution, issueDate)`, the frontend constructs a normalized JSON string:

```json
{
  "certificateId": "CERT-2026-CS101",
  "studentName": "aarav sharma",
  "course": "b.tech in computer science & engineering",
  "institution": "national institute of technology",
  "issueDate": "2026-05-15"
}
```

This UTF-8 string is passed into `ethers.keccak256(ethers.toUtf8Bytes(json))` to produce a 32-byte hexadecimal digest (`0x...`). Because Keccak-256 exhibits the **avalanche effect**, modifying even a single character in any field produces a completely different 256-bit hash.

---

## 7. Methodology & Implementation

### 7.1 Smart Contract Implementation (`contracts/CertificateRegistry.sol`)
- **`constructor()`**: Initializes `Ownable(msg.sender)`, designating the deploying account as the authorized institution owner.
- **`issueCertificate(string _certificateId, bytes32 _documentHash)`**:
  - Restricted by `onlyOwner`.
  - Validates that `_certificateId` is non-empty, `_documentHash` is non-zero, and `!certificates[_certificateId].exists`.
  - Stores the `Certificate` struct, appends `_certificateId` to `certificateIds`, and emits `CertificateIssued`.
- **`revokeCertificate(string _certificateId)`**:
  - Restricted by `onlyOwner`.
  - Validates that the certificate exists and is not already revoked.
  - Sets `isRevoked = true`, records `revokedAt = block.timestamp`, increments `revokedCount`, and emits `CertificateRevoked`.
- **`verifyCertificate(string _certificateId, bytes32 _documentHash)`**:
  - Public `view` function returning `(isValid, exists, isRevoked, hashMatches, issuer, issuedAt, revokedAt)`.
  - Computes `matches = (cert.documentHash == _documentHash)` and `valid = matches && !cert.isRevoked`.

### 7.2 Blockchain Service Layer (`src/services/blockchainService.ts`)
- **Read Operations:** Uses `JsonRpcProvider("http://127.0.0.1:8545")` so public verifiers do not need MetaMask installed. Checks contract deployment status via `provider.getCode(contractAddress)`.
- **Write Operations:** Uses `BrowserProvider(window.ethereum)` to request MetaMask signatures from the institution owner on Chain ID `31337`.
- **Transaction Indexing:** Queries `CertificateIssued` and `CertificateRevoked` logs via `contract.queryFilter(...)` and enriches each event with `provider.getTransactionReceipt(txHash)` to display actual gas used and confirmation status.

---

## 8. Automated Testing

The smart contract is verified using **Hardhat 3**, **Mocha**, **Chai**, and `@nomicfoundation/hardhat-ethers` in `test/CertificateRegistry.test.ts`.

| Test # | Test Case Name | Purpose | Result |
| :--- | :--- | :--- | :--- |
| **1** | Authorized Issuance | Verifies owner can issue a certificate and `CertificateIssued` is recorded | **PASS** |
| **2** | Unauthorized Issuance Rejection | Verifies non-owner accounts revert with `OwnableUnauthorizedAccount` | **PASS** |
| **3** | Duplicate Certificate Prevention | Verifies issuing an existing ID reverts with `"Certificate ID already exists"` | **PASS** |
| **4** | Successful Certificate Verification | Verifies `verifyCertificate` returns `isValid = true` for matching active records | **PASS** |
| **5** | Invalid or Missing Certificate | Verifies unknown IDs return `exists = false` and `isValid = false` | **PASS** |
| **6** | Certificate Revocation | Verifies owner can revoke a certificate and `isValid` becomes `false` | **PASS** |
| **7** | Unauthorized Revocation Rejection | Verifies non-owner revocation attempts revert with `OwnableUnauthorizedAccount` | **PASS** |
| **8** | Tampered Certificate Detection | Verifies altered fields produce `exists = true`, `hashMatches = false`, `isValid = false` | **PASS** |
| **9** | Input Validation | Verifies empty Certificate IDs and zero hashes are rejected | **PASS** |

---

## 9. Limitations of the Current System

1. **Local Development Network:** By design for an educational mini-project, the blockchain runs on a local Hardhat node (`Chain ID 31337`). Restarting `npm run node` resets the in-memory blockchain state.
2. **Single-Owner Governance:** The current contract uses single-address `Ownable` access control rather than a multi-signature university board or multi-institution registry.
3. **Manual Off-Chain Field Entry during Verification:** Since personal student fields are kept off-chain for privacy, the verifier enters the certificate details presented on the student's diploma to recompute and match the on-chain hash.

---

## 10. Future Scope

1. **Testnet / Mainnet L2 Deployment:** Deploy `CertificateRegistry.sol` to Ethereum Sepolia Testnet, Polygon PoS, or Arbitrum to provide permanent public accessibility across the internet.
2. **Role-Based Multi-University Registry:** Upgrade from `Ownable` to OpenZeppelin `AccessControl` (`REGISTRAR_ROLE`, `DEAN_ROLE`) so a national accreditation board can authorize multiple universities within a single smart contract.
3. **Batch Issuance via Merkle Trees:** Allow universities to issue an entire graduating batch of 1,000+ certificates in a single transaction by anchoring a Merkle Root on-chain.
4. **Encrypted Verifiable Credentials (W3C VC):** Embed signed JSON-LD payload parameters into an encrypted QR archive so verifiers can scan and populate candidate fields automatically without manual typing.

---

## 11. Conclusion

**CertiChain** demonstrates a complete, end-to-end Web3 engineering workflow—from Solidity smart contract development and automated Mocha/Chai unit testing in Hardhat 3 to Ethers.js v6 cryptographic hashing, MetaMask transaction signing, and public read-only verification in React. By anchoring compact Keccak-256 fingerprints on-chain rather than plaintext personal records, the system achieves both cryptographic immutability and student data privacy.
