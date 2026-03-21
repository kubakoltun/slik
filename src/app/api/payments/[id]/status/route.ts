import { type NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getPayment, updatePayment } from "@/lib/codes";
import { connection } from "@/lib/solana";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: "Missing payment ID." },
        { status: 400 }
      );
    }

    const payment = await getPayment(id);

    if (!payment) {
      return Response.json(
        { error: "Payment not found or expired." },
        { status: 404 }
      );
    }

    // Lazy on-chain check: if payment is linked and has a receipt PDA reference,
    // check if the receipt account exists on-chain (meaning payment was confirmed)
    if (payment.status === "linked" && payment.reference) {
      try {
        const receiptAccount = await connection.getAccountInfo(
          new PublicKey(payment.reference)
        );
        if (receiptAccount && receiptAccount.data.length > 0) {
          await updatePayment(id, { status: "paid" });
          payment.status = "paid";
        }
      } catch {
        // ignore - return current status
      }
    }

    return Response.json({
      status: payment.status,
      amount: payment.amount,
      ...(payment.code && { code: payment.code }),
      ...(payment.reference && { reference: payment.reference }),
    });
  } catch (error) {
    console.error("[GET /api/payments/[id]/status]", error);
    return Response.json(
      { error: "Failed to fetch payment status." },
      { status: 500 }
    );
  }
}
