import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { mainnet, sepolia } from "wagmi/chains";

export const avalancheMainnet = {
  id: 43114,
  name: "Avalanche Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "AVAX",
    symbol: "AVAX",
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Snowtrace",
      url: "https://snowtrace.io",
    },
  },
} as const;

export const avalancheFuji = {
  id: 43113,
  name: "Avalanche Fuji Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "AVAX",
    symbol: "AVAX",
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Snowtrace Testnet",
      url: "https://testnet.snowtrace.io",
    },
  },
  testnet: true,
} as const;

export const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "your_project_id_here";

if (!projectId) throw new Error("Project ID is not defined");

const metadata = {
  name: "Space Fleet Game",
  description: "A thrilling 3D space fleet combat game on Avalanche",
  url: "https://your-domain.com",
  icons: ["https://your-domain.com/icon.png"],
};

const chains = [avalancheMainnet, avalancheFuji, mainnet, sepolia] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});
