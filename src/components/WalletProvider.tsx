"use client";

import { type ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { RPC_ENDPOINT } from "@/lib/solana";

import "@solana/wallet-adapter-react-ui/styles.css";

interface AppWalletProviderProps {
  children: ReactNode;
}

export function AppWalletProvider({ children }: AppWalletProviderProps) {
  // Phantom, Solflare, etc. are auto-detected as "Standard Wallets"
  // when installed as browser extensions - no need to list them manually.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
