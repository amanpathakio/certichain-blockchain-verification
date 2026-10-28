# CertiChain — Blockchain-Based Academic Certificate Verification System

**CertiChain** is a complete, decentralized academic credential issuance and verification web application built with **Solidity 0.8.28**, **Hardhat 3**, **OpenZeppelin Contracts v5**, **Ethers.js v6**, **React 19**, **TypeScript**, and **Tailwind CSS**.

It is designed specifically as an authentic, beginner-friendly, fully local blockchain engineering project for college demonstrations, lab evaluations, and final-year vivas.

---

## 1. Project Introduction

Academic credential fraud and forged degree certificates pose a significant challenge for universities and hiring organizations. Traditional verification processes rely on manual emails, physical seals, or centralized databases that act as single points of failure.

**CertiChain** solves this by anchoring cryptographic **Keccak-256 certificate fingerprints** onto an Ethereum-compatible smart contract (`CertificateRegistry.sol`). Personal student records (names, courses, dates) are normalized into a canonical JSON structure and hashed locally in the browser—ensuring **zero personally identifiable information (PII)** is exposed on the public ledger while guaranteeing mathematical tamper detection.

---

## 2. Problem Statement

1. **Counterfeit Credentials:** Paper and PDF certificates can be easily altered using image or document editors.
2. **Slow Manual Verification:** Employers often wait days or weeks for university registrars to manually confirm a graduate's diploma.
3. **Centralized Vulnerability:** Centralized college portals can suffer downtime, SQL tampering, or unauthorized database edits.
4. **On-Chain Privacy Risks:** Storing raw student transcripts or full PDFs directly on a blockchain exposes sensitive personal data and costs excessive gas.

---

## 3. Objectives

- Enable an authorized academic institution (the smart contract `Ownable` deployer) to issue tamper-proof digital certificate fingerprints on-chain.
- Compute deterministic **Keccak-256** hashes of normalized certificate fields client-side using **Ethers.js v6**.
- Store only `certificateId`, `documentHash` (`bytes32`), `issuer` (`address`), `issuedAt` (`uint256`), and revocation state on the blockchain.
- Provide a public, walletless verification portal that classifies credentials into four unambiguous states: **Valid**, **Tampered**, **Revoked**, or **Not Found**.
- Generate scannable **QR Codes** encoding the real verification URL and Certificate ID.
- Provide an on-chain **Transaction Explorer** that queries real `CertificateIssued` and `CertificateRevoked` event logs and transaction receipts.

---

## 4. System Architecture

```text
+-------------------------------------------------------------------------+
|                        REACT 19 + TYPESCRIPT UI                         |
|  - Landing Page & Live Keccak-256 Sandbox                               |
|  - Institution Dashboard (Issue & Revoke via MetaMask BrowserProvider)  |
|  - Public Verification Portal (Read-Only via Ethers.js JsonRpcProvider) |
|  - QR Code Verification Slip Generator (qrcode.react)                   |
|  - Blockchain Transaction Explorer (EventLog + TransactionReceipts)     |
+------------------------------------+------------------------------------+
                                     |
              Canonical JSON -> keccak256(toUtf8Bytes(json))
                                     |
                                     v
+-------------------------------------------------------------------------+
|                   ETHERS.JS v6 + METAMASK WALLET                        |
|  - Signs write transactions (issueCertificate, revokeCertificate)       |
|  - Executes free read calls (verifyCertificate, getCertificate)         |
+------------------------------------+------------------------------------+
                                     |
                   JSON-RPC (http://127.0.0.1:8545 | Chain ID 31337)
                                     |
                                     v
+-------------------------------------------------------------------------+
|             HARDHAT 3 LOCAL BLOCKCHAIN & SOLIDITY CONTRACT              |
|  Contract: contracts/CertificateRegistry.sol (Solidity 0.8.28)          |
|  Access Control: OpenZeppelin Ownable (onlyOwner)                       |
|  Events: CertificateIssued, CertificateRevoked                          |
+-------------------------------------------------------------------------+
```

---

## 5. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Smart Contract** | Solidity `0.8.28` | On-chain certificate registry logic & storage |
| **Access Control** | OpenZeppelin Contracts `^5.6.1` | `Ownable` authorization (`onlyOwner`) |
| **Local Blockchain** | Hardhat 3 (`^3.21.1`) | Local Ethereum node (Chain ID `31337`), compilation, testing |
| **Deployment** | Hardhat Ignition (`^3.1.9`) | Declarative smart contract deployment module |
| **Testing** | Mocha + Chai + Hardhat Ethers | Automated smart contract unit tests (9 test cases) |
| **Blockchain SDK** | Ethers.js v6 (`^6.17.0`) | Wallet connection, contract calls, event indexing, Keccak-256 hashing |
| **Frontend** | React 19, TypeScript, Vite | Responsive single-page web application |
| **Styling & Icons** | Tailwind CSS v4, Lucide React | Dark-navy SaaS dashboard UI & iconography |
| **QR Generation** | `qrcode.react` (`^4.2.0`) | SVG QR codes linking to the verification portal |

---

## 6. Features

1. **Landing Page:** Hero overview, live interactive Keccak-256 avalanche-effect sandbox, 4-step workflow explanation, architecture bento grid, and technology stack.
2. **Institution Dashboard:**
   - Connects MetaMask and verifies whether the active wallet matches the contract's `Ownable` owner.
   - Computes the canonical JSON representation and 32-byte Keccak-256 hash of certificate fields.
   - Issues certificates on-chain (`issueCertificate`) and displays the real transaction hash, block number, and gas used.
   - Lists all on-chain certificates and allows instant one-click revocation (`revokeCertificate`).
3. **Public Certificate Verification:**
   - Works **without connecting a wallet** whenever the local Hardhat JSON-RPC node is running.
   - Recomputes the Keccak-256 hash from entered certificate details and calls `verifyCertificate` on-chain.
   - Accurately detects and displays **Valid**, **Tampered** (hash mismatch), **Revoked**, or **Not Found**.
   - Includes a **"Simulate Tampering"** button for live viva demonstrations.
4. **QR Code & Verification Slip:**
   - Generates a scannable QR code containing the real verification URL (`/?tab=verify&certId=...`).
   - Does not claim validity until the certificate details are verified against the smart contract.
5. **Blockchain Transaction Explorer:**
   - Queries real `CertificateIssued` and `CertificateRevoked` events from the blockchain and fetches `TransactionReceipt` data (Transaction Hash, Block Number, Gas Used, Contract Address, Network Name, Status).

---

## 7. Folder Structure

```text
certichain/
├── contracts/
│   └── CertificateRegistry.sol         # Solidity 0.8.28 smart contract (Ownable)
├── ignition/
│   └── modules/
│       └── CertificateRegistry.ts      # Hardhat Ignition deployment module
├── test/
│   └── CertificateRegistry.test.ts     # 9 automated Mocha/Chai smart contract tests
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx             # Landing page & interactive hash sandbox
│   │   ├── InstitutionDashboard.tsx    # Owner issuance, revocation & records table
│   │   ├── VerifyCertificate.tsx       # Public 4-state cryptographic verifier
│   │   ├── QrCodeView.tsx              # QR code & printable verification slip
│   │   ├── TransactionsPage.tsx        # Real event & receipt transaction explorer
│   │   └── SetupGuideModal.tsx         # Local setup guide & RPC configuration
│   ├── contracts/
│   │   ├── CertificateRegistryABI.ts   # Exported compiled contract ABI
│   │   └── contractConfig.ts           # Chain ID 31337, RPC URL & contract address
│   ├── services/
│   │   └── blockchainService.ts        # Ethers.js v6 read/write & MetaMask service
│   ├── types/
│   │   └── blockchain.ts               # TypeScript interfaces
│   ├── utils/
│   │   └── hash.ts                     # Canonical JSON & Keccak-256 hashing
│   ├── App.tsx                         # Main application layout & routing
│   ├── index.css                       # Tailwind CSS & typography rules
│   └── main.tsx                        # React DOM entry point
├── hardhat.config.ts                   # Hardhat 3 configuration
├── package.json                        # Scripts and dependencies
├── tsconfig.json                       # TypeScript configuration
├── README.md                           # Step-by-step setup & viva guide
└── PROJECT_DOCUMENTATION.md            # Academic project report documentation
```

---

## 8. Installation Prerequisites

Before running the project on your computer, install:

1. **Node.js (v20 LTS or v22 LTS recommended):** Download from [https://nodejs.org/](https://nodejs.org/)
2. **MetaMask Browser Extension:** Install in Chrome, Edge, or Brave from [https://metamask.io/](https://metamask.io/)
3. **Windows PowerShell** (or VS Code integrated terminal).

Verify Node.js and npm in PowerShell:
```powershell
node -v
npm -v
```

---

## 9. Exact Windows PowerShell Commands (Step-by-Step Local Setup)

Follow these exact steps in order. You will use **three PowerShell terminal windows** (one for the local blockchain node, one for deploying/testing, and one for the React website).

### Step 1: Install Node.js Dependencies
Open **PowerShell Window 1** in the project root folder and run:
```powershell
npm install
```

### Step 2: Compile the Solidity Smart Contract
```powershell
npm run compile
```
*Expected output:* `Compiled 1 Solidity file with solc 0.8.28 (evm target: cancun)`

### Step 3: Run the Automated Smart Contract Tests
```powershell
npm test
```
*Expected output:* All **9 Mocha tests passing** (authorized issuance, unauthorized issuance rejection, duplicate prevention, valid verification, missing certificate, revocation, unauthorized revocation rejection, tampered detection, and input validation).

### Step 4: Start the Hardhat Localhost Blockchain (Keep Running!)
In **PowerShell Window 1**, start the local Ethereum node:
```powershell
npm run node
```
*Expected output:*
`Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/`
Followed by a list of **20 funded test accounts** (`Account #0` through `Account #19`), each pre-funded with `10000 ETH`.
> **IMPORTANT:** Do **not** close PowerShell Window 1. Keep it running in the background.

### Step 5: Deploy the Smart Contract to Localhost
Open a **new PowerShell Window 2** in the same project directory and run:
```powershell
npm run deploy
```
*(When prompted by Hardhat Ignition to confirm deployment to network `localhost` (chainId `31337`), press `y` and hit Enter.)*

*Expected output:*
```text
[ CertificateRegistryModule ] successfully deployed 🚀
Deployed Addresses
CertificateRegistryModule#CertificateRegistry - 0x5FbDB2315678afecb367f032d93F642f64180aa3
```
*(Note: The frontend is pre-configured with `0x5FbDB2315678afecb367f032d93F642f64180aa3`. If you deploy multiple times and get a new address, you can paste it into the website's **Local Setup Guide -> Connection Endpoint & Contract Address** box.)*

### Step 6: Start the React Frontend Website
In **PowerShell Window 2** (or a 3rd window), start the Vite server:
```powershell
npm run dev
```
Open your browser and go to:
```text
http://localhost:3000
```

---

## 10. How to Configure MetaMask for Hardhat Localhost

### A. Add the Hardhat Localhost Network
1. Open the CertiChain website (`http://localhost:3000`), click **Open Workspace**, go to **Local Setup Guide**, and click **"Add / Switch to Hardhat Localhost in MetaMask"**, **OR** add it manually in MetaMask:
   - **Network Name:** `Hardhat Localhost`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`

### B. Import Hardhat Test Account #0 (Contract Owner)
1. Look at **PowerShell Window 1** where `npm run node` is running.
2. Copy the **Private Key** printed under **`Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)`**.
3. In MetaMask, click the account selector at the top -> **Add account or hardware wallet** -> **Import account** -> Paste Account #0's local test private key.
4. Click **Connect MetaMask** in the top-right corner of CertiChain. You will see `0xf39F...2266 · Owner`.

> **Security Reminder:** Never use Hardhat test accounts on mainnet or with real funds, and never import your personal wallet keys into a student demo project.

---

## 11. Viva Demonstration Walkthrough (Issue, Verify, Tamper, and Revoke)

### 1. Issue a Demo Certificate
1. Navigate to **Institution Dashboard**.
2. Click **"Cycle Demo Record"** (or enter):
   - **Certificate ID:** `CERT-2026-CS101`
   - **Issue Date:** `2026-05-15`
   - **Student Full Name:** `Aarav Sharma`
   - **Course:** `B.Tech in Computer Science & Engineering`
   - **Institution:** `National Institute of Technology`
3. Observe the **Live Cryptographic Fingerprint Preview** on the right showing the normalized JSON and its 32-byte `Keccak-256` hash.
4. Click **"Issue Certificate On-Chain"** and confirm the transaction in MetaMask.
5. Once confirmed, note the real **Tx Hash**, **Block Number**, and **Gas Used**, and see the certificate appear in the **On-Chain Certificate Registry Records** table.

### 2. Generate the QR Code Slip
1. Click the **QR** button in the certificate's row (or open **QR Code & Slip** in the sidebar).
2. Show the examiner the generated QR code encoding `http://localhost:3000/?tab=verify&certId=CERT-2026-CS101`.

### 3. Verify the Authentic Certificate
1. Click **"Verify"** on the certificate row (or open **Verify Certificate**).
2. With the authentic fields entered, click **"Verify Against Blockchain"**.
3. The portal displays **VALID — Authentic Credential**, proving that the recomputed hash matches the on-chain `documentHash` byte-for-byte.

### 4. Demonstrate Tamper Detection
1. On the **Verify Certificate** page, click the **"Simulate Tampering"** button (or change a single letter in the Student Name or Course).
2. Click **"Verify Against Blockchain"**.
3. The portal immediately flags **TAMPERED — Hash Mismatch**, showing the side-by-side difference between the Computed Hash and the On-Chain Stored Hash.

### 5. Revoke the Certificate
1. Return to **Institution Dashboard** and click **"Revoke"** next to `CERT-2026-CS101`.
2. Confirm the transaction in MetaMask.
3. Now click **"Verify"** for `CERT-2026-CS101` again with the original authentic details.
4. The portal displays **REVOKED — Credential Invalidated**, demonstrating that revoked certificates can never verify as valid.

### 6. Inspect Blockchain Transactions
1. Open **Transactions** in the sidebar.
2. Show the examiner both real transactions (`CertificateIssued` and `CertificateRevoked`) along with their Transaction Hashes, Block Numbers, Gas Used, Contract Address, and Timestamps.

---

## 12. Common Troubleshooting Steps

- **"Local Hardhat Node Not Connected" Banner:**
  Make sure `npm run node` is actively running in PowerShell Window 1 and listening on `http://127.0.0.1:8545`.
- **"CertificateRegistry Smart Contract Not Deployed" Warning:**
  Whenever you stop and restart `npm run node`, the in-memory local blockchain resets. Run `npm run deploy` again after restarting `npm run node`.
- **MetaMask "Nonce too high" or Stuck Transaction after Restarting Hardhat Node:**
  When you restart `npm run node`, block numbers reset to 0, but MetaMask caches old nonces. Fix this in MetaMask: **Settings -> Advanced -> Clear activity and nonce data**.
- **"Unauthorized wallet: Only the contract owner can issue or revoke certificates":**
  Switch MetaMask to **Account #0** (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`), which deployed the contract.

---

## 13. Expected Output & Screenshots Checklist (For Project Report)

- [ ] **Screenshot 1:** PowerShell terminal showing `npm run compile` and `npm test` with **9 passing** tests.
- [ ] **Screenshot 2:** PowerShell terminal showing `npm run node` and `npm run deploy` with the deployed address `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
- [ ] **Screenshot 3:** CertiChain Landing Page with the Interactive Keccak-256 Sandbox.
- [ ] **Screenshot 4:** Institution Dashboard with MetaMask connected (`0xf39F...2266 · Owner`) and a confirmed certificate issuance receipt.
- [ ] **Screenshot 5:** Public Verification Page showing **VALID — Authentic Credential**.
- [ ] **Screenshot 6:** Public Verification Page showing **TAMPERED — Hash Mismatch** when a student field is modified.
- [ ] **Screenshot 7:** Public Verification Page showing **REVOKED — Credential Invalidated** after revocation.
- [ ] **Screenshot 8:** QR Code Verification Slip and Blockchain Transaction Explorer table.
