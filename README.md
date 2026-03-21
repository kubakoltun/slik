# SolanaBLIK

Payment gateway inspired by [BLIK](https://en.wikipedia.org/wiki/Blik) (Polish instant payment system) built on Solana with a custom Anchor program. Merchant enters amount, customer generates a 6-digit code, merchant types the code, customer approves in wallet, SOL is transferred atomically with an on-chain receipt.

**Live:** https://solana-blik.vercel.app
**Program:** [`AqdVcH7aYHXtWCQbkEweCDoXGR8qMn4pdKhWScbMcyNv`](https://explorer.solana.com/address/AqdVcH7aYHXtWCQbkEweCDoXGR8qMn4pdKhWScbMcyNv?cluster=devnet) (devnet)

## How it works

```
Merchant                                Customer
────────                                ────────
1. Connect wallet
2. Enter amount (PLN/USD/EUR)
   → auto-converts to SOL
3. Wait for code...
                                        4. Connect wallet (Phantom)
                                        5. Generate 6-digit code (120s TTL)
                                        6. Tell code to merchant
7. Enter 6-digit code
   → code linked to payment
                                        8. See payment request + amount
                                        9. Approve in wallet
                                           → Anchor program executes:
                                             SOL transfer + receipt PDA + event
10. Payment confirmed (instant via WebSocket)
```

Two screens:
- `/` - customer (payer) interface
- `/merchant` - merchant (receiver) terminal

## Architecture

Hybrid design — server handles what it does best (codes, matching, prices), Anchor program handles what blockchain does best (atomic payments, on-chain proof).

```
Off-chain (Next.js + Redis)              On-chain (Anchor program)
───────────────────────────              ─────────────────────────
• 6-digit code generation                • Atomic SOL transfer
• Code ↔ payment matching               • Receipt PDA (permanent proof)
• Fiat price feed (CoinGecko)            • PaymentCompleted event
• Rate limiting, validation              • Double-payment prevention
```

### Payment confirmation

Uses WebSocket subscription on the receipt PDA (`connection.onAccountChange`). When the Anchor program creates the receipt account on-chain, both merchant and customer get instant notification (~400ms). HTTP polling at 3s serves as fallback if WebSocket drops.

## Anchor Program

Single instruction `pay(amount, payment_id)`:

1. Transfers SOL from customer to merchant via `system_program::transfer`
2. Creates a receipt PDA (seeds: `["receipt", payment_id]`) — permanent on-chain proof
3. Emits `PaymentCompleted` event for WebSocket listeners

Receipt PDA stores: customer, merchant, amount, payment_id, timestamp, bump.

```
programs/solanablik/src/lib.rs    # Program source
target/idl/solanablik.json        # Generated IDL
src/lib/idl/                      # IDL + types (copied for frontend)
```

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Smart contract | Anchor 0.32, Rust |
| Blockchain | Solana devnet (`@solana/web3.js` v1) |
| Wallet | `@solana/wallet-adapter-react` (Phantom, Solflare auto-detected) |
| State / codes | Upstash Redis (serverless, 120s TTL on codes, 300s on payments) |
| Price feed | CoinGecko API (SOL/PLN, SOL/USD, SOL/EUR, 60s cache) |
| Deploy | Vercel (frontend), Solana devnet (program) |

## API endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/create` | POST | Merchant creates payment (amount + wallet) |
| `/api/codes/generate` | POST | Customer generates 6-digit code |
| `/api/payments/link` | POST | Merchant links code to payment, derives receipt PDA |
| `/api/payments/[id]/status` | GET | Payment status (with lazy on-chain check) |
| `/api/codes/[code]/resolve` | GET | Customer polls if code was linked |
| `/api/pay` | GET/POST | Builds Anchor `pay` TX, returns serialized + receiptPda |
| `/api/price` | GET | Current SOL prices in PLN/USD/EUR |

## Local development

```bash
npm install
npm run dev
```

Works without Redis (falls back to in-memory store with TTL). For production, set:

```
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_PROGRAM_ID=AqdVcH7aYHXtWCQbkEweCDoXGR8qMn4pdKhWScbMcyNv
```

### Building the Anchor program

```bash
anchor build
cargo-build-sbf --manifest-path programs/solanablik/Cargo.toml --sbf-out-dir target/deploy
solana program deploy target/deploy/solanablik.so --program-id target/deploy/solanablik-keypair.json --url devnet
```

Currently on **devnet** — switch Phantom to devnet in Settings > Developer Settings. Get devnet SOL from https://faucet.solana.com

## Project structure

```
├── programs/solanablik/
│   └── src/lib.rs                    # Anchor program (pay instruction)
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Customer (payer) UI
│   │   ├── merchant/page.tsx         # Merchant terminal UI
│   │   └── api/
│   │       ├── codes/generate/       # Generate 6-digit code
│   │       ├── codes/[code]/resolve/ # Poll code status
│   │       ├── payments/create/      # Create payment
│   │       ├── payments/link/        # Link code → payment + derive receipt PDA
│   │       ├── payments/[id]/status/ # Payment status + lazy on-chain check
│   │       ├── pay/                  # Anchor TX builder
│   │       └── price/               # SOL price feed
│   ├── lib/
│   │   ├── program.ts               # Anchor client (PDA derivation, IX builder)
│   │   ├── payment.ts               # Re-exports from program.ts
│   │   ├── codes.ts                 # Code/payment storage (Redis or in-memory)
│   │   ├── price.ts                 # CoinGecko price fetcher
│   │   ├── solana.ts                # Connection config
│   │   └── idl/                     # Generated Anchor IDL + types
│   └── components/
│       ├── AmountInput.tsx           # Numpad with fiat currency selector
│       ├── CodeDisplay.tsx           # 6-digit code with timer + copy
│       ├── CodeInput.tsx             # OTP-style code input
│       ├── WalletButton.tsx          # Wallet connect button
│       └── WalletProvider.tsx        # Solana wallet adapter providers
├── Anchor.toml                       # Anchor workspace config
└── target/deploy/                    # Compiled .so + keypair
```
