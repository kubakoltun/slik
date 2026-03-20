import { type NextRequest } from "next/server";
import { resolveCode, getPayment } from "@/lib/codes";

/**
 * GET /api/codes/[code]/resolve
 *
 * Used by the user's frontend to poll whether their code has been linked
 * to a payment by a merchant.
 *
 * Returns:
 *   - { status: "waiting" }                         if code exists but no payment linked yet
 *   - { status: "linked", paymentId, amount }       if a merchant linked a payment
 *   - { status: "paid" }                            if payment has been confirmed on-chain
 *   - 404                                           if code expired or not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || !/^\d{6}$/.test(code)) {
      return Response.json(
        { error: "Invalid code format. Must be 6 digits." },
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

    // Code exists but hasn't been linked to a payment yet
    if (!codeData.paymentId) {
      return Response.json({ status: "waiting" });
    }

    // Code is linked to a payment - fetch payment details
    const payment = await getPayment(codeData.paymentId);

    if (!payment) {
      return Response.json({ status: "waiting" });
    }

    if (payment.status === "paid") {
      return Response.json({
        status: "paid",
        paymentId: codeData.paymentId,
        amount: payment.amount,
      });
    }

    // Payment exists and is linked
    return Response.json({
      status: "linked",
      paymentId: codeData.paymentId,
      amount: payment.amount,
      reference: payment.reference,
    });
  } catch (error) {
    console.error("[GET /api/codes/[code]/resolve]", error);
    return Response.json(
      { error: "Failed to resolve code." },
      { status: 500 }
    );
  }
}
