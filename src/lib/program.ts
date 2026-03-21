import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { connection } from "./solana";

// ---------------------------------------------------------------------------
// Program constants
// ---------------------------------------------------------------------------

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "AqdVcH7aYHXtWCQbkEweCDoXGR8qMn4pdKhWScbMcyNv"
);

// Anchor discriminator for the `pay` instruction (first 8 bytes of SHA256("global:pay"))
const PAY_DISCRIMINATOR = Buffer.from([119, 18, 216, 65, 192, 117, 122, 220]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a UUID string (e.g. "550e8400-e29b-41d4-a716-446655440000")
 * to a 16-byte Uint8Array.
 */
export function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Derive the receipt PDA address from a payment ID (16 bytes).
 * Seeds: [b"receipt", payment_id]
 */
export function deriveReceiptPda(
  paymentIdBytes: Uint8Array
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("receipt"), Buffer.from(paymentIdBytes)],
    PROGRAM_ID
  );
}

// ---------------------------------------------------------------------------
// Transaction builder
// ---------------------------------------------------------------------------

/**
 * Build an Anchor `pay` instruction as an unsigned Transaction.
 *
 * @param customerPubkey  The payer's public key (signer)
 * @param merchantPubkey  The merchant's wallet (receives SOL)
 * @param solAmount       Amount in SOL (human-readable, e.g. 0.05)
 * @param paymentId       UUID string from the backend
 * @returns               Unsigned Transaction + receipt PDA address
 */
export async function createAnchorPaymentTransaction(
  customerPubkey: PublicKey,
  merchantPubkey: PublicKey,
  solAmount: number,
  paymentId: string
): Promise<{ transaction: Transaction; receiptPda: PublicKey }> {
  const paymentIdBytes = uuidToBytes(paymentId);
  const lamports = BigInt(Math.round(solAmount * LAMPORTS_PER_SOL));
  const [receiptPda] = deriveReceiptPda(paymentIdBytes);

  // Serialize instruction data:
  // discriminator (8) + amount (u64 LE, 8) + payment_id (16) = 32 bytes
  const data = Buffer.alloc(32);
  PAY_DISCRIMINATOR.copy(data, 0);
  data.writeBigUInt64LE(lamports, 8);
  Buffer.from(paymentIdBytes).copy(data, 16);

  const payIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: customerPubkey, isSigner: true, isWritable: true },
      { pubkey: merchantPubkey, isSigner: false, isWritable: true },
      { pubkey: receiptPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: customerPubkey,
  });

  tx.add(payIx);

  return { transaction: tx, receiptPda };
}
