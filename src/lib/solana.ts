import { Connection, clusterApiUrl } from "@solana/web3.js";

export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
  "devnet") as "devnet" | "mainnet-beta";

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || clusterApiUrl(SOLANA_NETWORK);

export const connection = new Connection(RPC_ENDPOINT, "confirmed");
