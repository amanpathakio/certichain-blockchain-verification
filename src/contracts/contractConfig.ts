/**
 * Frontend Blockchain & Smart Contract Configuration
 * Automatically uses the same-origin /api/rpc Hardhat 3 JSON-RPC proxy when running
 * in the browser so that the application works seamlessly from anywhere (cloud preview,
 * deployed URL, mobile QR scan, or localhost:3000).
 */
const getDefaultRpcUrl = (): string => {
  if (import.meta.env.VITE_RPC_URL) {
    return import.meta.env.VITE_RPC_URL;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/rpc`;
  }
  return "http://127.0.0.1:8545";
};

export const BLOCKCHAIN_CONFIG = {
  /**
   * Standard deterministic contract address when deployed to Hardhat network
   * using Account #0 (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) at nonce 0.
   */
  DEFAULT_CONTRACT_ADDRESS:
    import.meta.env.VITE_CONTRACT_ADDRESS ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",

  /**
   * JSON-RPC URL (proxies to the live Hardhat 3 node on port 8545)
   */
  DEFAULT_RPC_URL: getDefaultRpcUrl(),

  /**
   * Fallback direct localhost RPC URL
   */
  LOCALHOST_DIRECT_RPC_URL: "http://127.0.0.1:8545",

  /**
   * Hardhat Chain ID (31337 in decimal, 0x7a69 in hexadecimal)
   */
  CHAIN_ID: 31337,
  CHAIN_ID_HEX: "0x7a69",

  /**
   * Human-readable network metadata for MetaMask wallet_addEthereumChain
   */
  NETWORK_NAME: "Hardhat Localhost",
  CURRENCY_SYMBOL: "ETH",
  CURRENCY_DECIMALS: 18,

  /**
   * Default Hardhat Test Account #0 (Deployer / Institution Owner)
   */
  DEFAULT_HARDHAT_OWNER: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",

  /**
   * Public Hardhat Account #0 test key used ONLY for signing against the embedded
   * Chain ID 31337 Hardhat node when MetaMask is not connected on the device.
   */
  HARDHAT_ACCOUNT_0_TEST_KEY:
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
} as const;
