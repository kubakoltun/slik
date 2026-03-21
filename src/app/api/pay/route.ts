import { type NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getPayment, updatePayment } from "@/lib/codes";
import {
  createAnchorPaymentTransaction,
  deriveReceiptPda,
  uuidToBytes,
} from "@/lib/payment";

/**
 * Solana Pay Transaction Request - GET
 */
export async function GET() {
  return Response.json({
    label: "SolanaBLIK",
    icon: "/icon.png",
  });
}

/**
 * Solana Pay Transaction Request - POST
 *
 * Builds an Anchor `pay` instruction and returns it serialized.
 *
 * Query params:
 *   - paymentId: the payment UUID to fulfill
 */
export async function POST(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get("paymentId");

    if (!paymentId) {
      return Response.json(
        { error: "Missing paymentId query parameter." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { account } = body;

    if (!account || typeof account !== "string") {
      return Response.json(
        { error: "Missing or invalid account in request body." },
        { status: 400 }
      );
    }

    let senderPubkey: PublicKey;
    try {
      senderPubkey = new PublicKey(account);
    } catch {
      return Response.json(
        { error: "Invalid Solana public key." },
        { status: 400 }
      );
    }

    const payment = await getPayment(paymentId);
    if (!payment) {
      return Response.json(
        { error: "Payment not found or expired." },
        { status: 404 }
      );
    }

    if (payment.status !== "linked") {
      return Response.json(
        {
          error: `Payment is not ready for transaction. Current status: ${payment.status}`,
        },
        { status: 409 }
      );
    }

    const merchantPubkey = new PublicKey(payment.merchantWallet);

    // Build Anchor pay instruction
    const { transaction, receiptPda } = await createAnchorPaymentTransaction(
      senderPubkey,
      merchantPubkey,
      payment.amount,
      paymentId
    );

    // Store receipt PDA in payment record
    await updatePayment(paymentId, {
      reference: receiptPda.toBase58(),
    });

    const serialized = transaction
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    return Response.json({
      transaction: serialized,
      message: `Pay ${payment.amount} SOL via SolanaBLIK`,
      receiptPda: receiptPda.toBase58(),
    });
  } catch (error) {
    console.error("[POST /api/pay]", error);
    return Response.json(
      { error: "Failed to create payment transaction." },
      { status: 500 }
    );
  }
}
