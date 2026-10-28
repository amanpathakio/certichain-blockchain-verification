import fs from "fs";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import {
  Contract,
  ContractFactory,
  JsonRpcProvider,
  Wallet,
  keccak256,
  toUtf8Bytes,
} from "ethers";
import { CERTIFICATE_REGISTRY_ABI } from "./src/contracts/CertificateRegistryABI.ts";

const PORT = 3000;
const HARDHAT_RPC_PORT = 8545;
const HARDHAT_RPC_URL = `http://127.0.0.1:${HARDHAT_RPC_PORT}`;

// Standard public Hardhat Account #0 private key (strictly for local/educational Hardhat 31337 node)
const HARDHAT_OWNER_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const EXPECTED_CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

let deployedContractAddress = EXPECTED_CONTRACT_ADDRESS;

function computeCanonicalHash(fields: {
  certificateId: string;
  studentName: string;
  course: string;
  institution: string;
  issueDate: string;
}): string {
  const payload = JSON.stringify({
    certificateId: fields.certificateId.trim().toUpperCase(),
    studentName: fields.studentName.trim().toLowerCase(),
    course: fields.course.trim().toLowerCase(),
    institution: fields.institution.trim().toLowerCase(),
    issueDate: fields.issueDate.trim(),
  });
  return keccak256(toUtf8Bytes(payload));
}

async function isRpcReachable(): Promise<boolean> {
  try {
    const res = await fetch(HARDHAT_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_chainId",
        params: [],
        id: 1,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureHardhatNodeAndContract(): Promise<void> {
  const alreadyRunning = await isRpcReachable();
  if (!alreadyRunning) {
    console.log("Starting embedded Hardhat 3 JSON-RPC node on 127.0.0.1:8545...");
    const hreModule = await import("hardhat");
    const hre = hreModule.default;
    const rpcServer = await hre.network.createServer(
      "default",
      "127.0.0.1",
      HARDHAT_RPC_PORT
    );
    await rpcServer.listen();
    console.log("Hardhat 3 JSON-RPC server listening on http://127.0.0.1:8545 (Chain ID 31337)");
  } else {
    console.log("Detected existing Hardhat JSON-RPC server on http://127.0.0.1:8545");
  }

  const provider = new JsonRpcProvider(HARDHAT_RPC_URL, undefined, {
    staticNetwork: false,
    batchMaxCount: 1,
    cacheTimeout: -1,
  });
  const existingCode = await provider.getCode(EXPECTED_CONTRACT_ADDRESS);

  if (existingCode && existingCode !== "0x" && existingCode !== "0x0") {
    console.log(
      `CertificateRegistry already deployed at ${EXPECTED_CONTRACT_ADDRESS}`
    );
    deployedContractAddress = EXPECTED_CONTRACT_ADDRESS;
    return;
  }

  console.log("Deploying CertificateRegistry.sol to Hardhat network...");
  const artifactPath = path.resolve(
    process.cwd(),
    "artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"
  );
  const artifactRaw = fs.readFileSync(artifactPath, "utf8");
  const artifact = JSON.parse(artifactRaw);

  const deployerWallet = new Wallet(HARDHAT_OWNER_PRIVATE_KEY, provider);
  const factory = new ContractFactory(
    artifact.abi,
    artifact.bytecode,
    deployerWallet
  );
  let nextNonce = await provider.getTransactionCount(
    deployerWallet.address,
    "latest"
  );
  const contract = await factory.deploy({ nonce: nextNonce++ });
  await contract.waitForDeployment();
  deployedContractAddress = await contract.getAddress();
  console.log(
    `CertificateRegistry deployed at ${deployedContractAddress} by owner ${deployerWallet.address}`
  );

  // Seed 2 real on-chain academic certificates so the ledger has immediate verifiable records
  const typedContract = new Contract(
    deployedContractAddress,
    CERTIFICATE_REGISTRY_ABI,
    deployerWallet
  );

  const initialRecords = [
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
  ];

  for (const rec of initialRecords) {
    const docHash = computeCanonicalHash(rec);
    const tx = await typedContract.issueCertificate(
      rec.certificateId,
      docHash,
      { nonce: nextNonce++ }
    );
    await tx.wait();
    console.log(
      `Issued on-chain certificate ${rec.certificateId} (hash: ${docHash})`
    );
  }
}

async function startServer() {
  await ensureHardhatNodeAndContract();

  const app = express();
  app.use(express.json({ limit: "2mb" }));

  // Allow CORS on /api/rpc so MetaMask and external verifiers can connect from anywhere
  app.options("/api/rpc", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  app.post("/api/rpc", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const rpcResponse = await fetch(HARDHAT_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await rpcResponse.json();
      res.status(rpcResponse.status).json(data);
    } catch (err) {
      res.status(502).json({
        jsonrpc: "2.0",
        id: req.body?.id ?? null,
        error: {
          code: -32603,
          message:
            err instanceof Error
              ? err.message
              : "Hardhat JSON-RPC proxy error",
        },
      });
    }
  });

  app.get("/api/blockchain-status", (_req, res) => {
    res.json({
      rpcOnline: true,
      chainId: 31337,
      contractAddress: deployedContractAddress,
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CertiChain full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
