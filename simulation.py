import random
import time

# --- INITIAL TREASURY STATE ---
treasury_cash_usd = 5000.0  # Stablecoins
treasury_sol = 25.0  # Staked SOL reserve
token_supply = 1_000_000_000  # 1 Billion total supply
sol_price = 109.10  # Baseline SOL price from live data feed


def run_weekly_simulation():
  global treasury_cash_usd, treasury_sol, token_supply, sol_price

  print("=" * 60)
  print("🚀 SOLARIS 7-DAY BUYER & TREASURY BOT SIMULATION")
  print("=" * 60)
  print(
      f"Starting Baseline -> Cash: ${treasury_cash_usd:,.2f} | SOL:"
      f" {treasury_sol} | SOL Price: ${sol_price}"
  )
  print("-" * 60)

  # Simulate 7 days (represented by 7 major check-in checkpoints)
  for day in range(1, 8):
    print(f"\n📅 --- DAY {day} OF 7 ---")

    # 1. Simulate Buyer Inflows based on weekly momentum
    if day == 1:
      buyers_count = 45  # Launch day hype
      capital_injected = 3200.0
    elif day in [2, 3, 4]:
      buyers_count = 12  # Mid-week consolidation
      capital_injected = 800.0
    else:
      buyers_count = 65  # Weekend viral push
      capital_injected = 5100.0

    print(
        f"🛒 Market Activity: {buyers_count} new buyers added"
        f" ${capital_injected:,.2f} to liquidity."
    )

    # 2. Simulate Treasury Tax Fee Collection (1% of volume goes to treasury cash)
    tax_collected = capital_injected * 0.01
    treasury_cash_usd += tax_collected
    print(
        "💰 Treasury Tax Inflow (1%):"
        f" +${tax_collected:,.2f} added to stablecoins."
    )

    # 3. Simulate Price Movement & Bot Action
    price_change_pct = random.uniform(-2.5, 3.0)
    sol_price *= 1 + (price_change_pct / 100)
    print(
        f"📈 Market Shift: SOL price moved to ${sol_price:.2f}"
        f" ({price_change_pct:+.2f}%)"
    )

    # Bot Trading Logic with Real Fees ($0.002 gas + 0.25% DEX fee)
    if price_change_pct <= -1.0 and treasury_cash_usd >= sol_price:
      dex_fee = sol_price * 0.0025
      gas_fee = 0.002
      total_cost = sol_price + dex_fee + gas_fee
      treasury_cash_usd -= total_cost
      treasury_sol += 1.0
      print(
          "🤖 BOT ACTION [BUY THE DIP]: Acquired 1 SOL. Paid DEX fee"
          f" ${dex_fee:.2f} + Gas."
      )

    elif price_change_pct >= 1.5 and treasury_sol >= 1.0:
      dex_revenue = sol_price * (1 - 0.0025)
      gas_fee = 0.002
      treasury_cash_usd += dex_revenue - gas_fee
      treasury_sol -= 1.0
      print(
          "🤖 BOT ACTION [SELL THE RIP]: Offloaded 1 SOL for cash. Net revenue:"
          f" ${dex_revenue:.2f}."
      )
    else:
      print("⏳ BOT ACTION [HOLD]: Market spread too narrow. Holding position.")

    # 4. Milestone Buyback & Burn Event
    if day in [4, 7] and treasury_cash_usd > 1000:
      burn_budget = 300.0
      tokens_burned = burn_budget * 50_000
      token_supply -= tokens_burned
      treasury_cash_usd -= burn_budget
      print(
          f"🔥 BUYBACK & BURN EVENT: Spent ${burn_budget} to burn"
          f" {tokens_burned:,.0f} tokens!"
      )

    total_portfolio = treasury_cash_usd + (treasury_sol * sol_price)
    print(
        f"📊 End of Day {day} Net Worth: ${total_portfolio:,.2f} | Circulating"
        f" Supply: {token_supply:,.0f}"
    )
    print("-" * 60)

  print("\n✨ Simulation Completed Successfully!")


if __name__ == "__main__":
  run_weekly_simulation()
