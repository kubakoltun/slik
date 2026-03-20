import { getSolPrice } from "@/lib/price";

export const dynamic = "force-dynamic";

export async function GET() {
  const prices = await getSolPrice();
  return Response.json({ prices });
}
