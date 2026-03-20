const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,pln,eur";

export type FiatCurrency = "USD" | "PLN" | "EUR";

interface PriceCache {
  prices: Record<FiatCurrency, number>;
  fetchedAt: number;
}

let cache: PriceCache | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function getSolPrice(): Promise<Record<FiatCurrency, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.prices;
  }

  try {
    const res = await fetch(COINGECKO_URL, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

    const data = await res.json();
    const prices: Record<FiatCurrency, number> = {
      USD: data.solana.usd,
      PLN: data.solana.pln,
      EUR: data.solana.eur,
    };

    cache = { prices, fetchedAt: Date.now() };
    return prices;
  } catch (err) {
    console.error("[price] Failed to fetch SOL price:", err);
    // Fallback prices if API fails
    if (cache) return cache.prices;
    return { USD: 140, PLN: 560, EUR: 130 };
  }
}

export function fiatToSol(
  fiatAmount: number,
  currency: FiatCurrency,
  prices: Record<FiatCurrency, number>
): number {
  const solPrice = prices[currency];
  if (!solPrice || solPrice <= 0) return 0;
  return fiatAmount / solPrice;
}
