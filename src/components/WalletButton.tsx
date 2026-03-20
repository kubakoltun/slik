"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

/**
 * Styled wallet connect/disconnect button.
 * All visual overrides are applied via globals.css wallet-adapter selectors
 * to keep this component clean and let CSS handle the theming.
 */
export function WalletButton() {
  return (
    <div className="wallet-button-wrapper">
      <WalletMultiButton />
    </div>
  );
}
