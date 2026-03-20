import { type NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createPayment } from "@/lib/codes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, merchantWallet } = body;

    if (typeof amount !== "number" || amount <= 0) {
      return Response.json(
        { error: "Invalid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    if (amount > 10_000) {
      return Response.json(
        { error: "Amount exceeds maximum allowed (10,000 SOL)." },
        { status: 400 }
      );
    }

    if (!merchantWallet || typeof merchantWallet !== "string") {
      return Response.json(
        { error: "Missing merchantWallet." },
        { status: 400 }
      );
    }

    try {
      new PublicKey(merchantWallet);
    } catch {
      return Response.json(
        { error: "Invalid merchant wallet address." },
        { status: 400 }
      );
    }

    const paymentId = await createPayment(amount, merchantWallet);

    return Response.json({
      paymentId,
      status: "awaiting_code",
    });
  } catch (error) {
    console.error("[POST /api/payments/create]", error);
    return Response.json(
      { error: "Failed to create payment." },
      { status: 500 }
    );
  }
}
