import { type NextRequest } from "next/server";
import {
  resolveCode,
  getPayment,
  updatePayment,
  linkCodeToPayment,
} from "@/lib/codes";
import { deriveReceiptPda, uuidToBytes } from "@/lib/payment";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, code } = body;

    if (!paymentId || typeof paymentId !== "string") {
      return Response.json(
        { error: "Missing or invalid paymentId." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return Response.json(
        { error: "Invalid code. Must be a 6-digit number." },
        { status: 400 }
      );
    }

    const codeData = await resolveCode(code);
    if (!codeData) {
      return Response.json(
        { error: "Code not found or expired." },
        { status: 404 }
      );
    }

    const payment = await getPayment(paymentId);
    if (!payment) {
      return Response.json(
        { error: "Payment not found or expired." },
        { status: 404 }
      );
    }

    if (payment.status !== "awaiting_code") {
      return Response.json(
        {
          error: `Payment cannot be linked. Current status: ${payment.status}`,
        },
        { status: 409 }
      );
    }

    // Derive receipt PDA deterministically from paymentId
    const paymentIdBytes = uuidToBytes(paymentId);
    const [receiptPda] = deriveReceiptPda(paymentIdBytes);

    // Link the code to the payment
    await linkCodeToPayment(code, paymentId);

    // Update payment with linked data
    await updatePayment(paymentId, {
      status: "linked",
      code,
      walletPubkey: codeData.walletPubkey,
      reference: receiptPda.toBase58(),
    });

    return Response.json({
      matched: true,
      amount: payment.amount,
      walletPubkey: codeData.walletPubkey,
      reference: receiptPda.toBase58(),
      receiptPda: receiptPda.toBase58(),
    });
  } catch (error) {
    console.error("[POST /api/payments/link]", error);
    return Response.json(
      { error: "Failed to link payment." },
      { status: 500 }
    );
  }
}
