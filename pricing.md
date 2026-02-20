# 🏢 B2B Pricing & Credits System (Organization Model) - Revised 

This document outlines the **Action-Based Credit System** designed specifically for law firms and legal departments. Individual token counts are hidden from the user; instead, credits are deducted as fixed amounts per action.

The system is optimized for **Anthropic Claude 3.5 Haiku (claude-haiku-4-5-20251001)** costs:
* **Input Tokens:** $1.00 per 1M ($0.001 per 1K)
* **Output Tokens:** $5.00 per 1M ($0.005 per 1K)

---

## 1. ⚙️ How the B2B Credit System Works

1. **Organization Pool:** The firm (Organization) buys a general pool of credits (e.g., 500,000 Credits / month).
2. **Individual Balances:** Each lawyer linked to the Organization shares this pool.
3. **Daily Limits:** To prevent abuse or accidental overspending, the Organization sets a **Daily Limit** per user (e.g., maximum 5,000 Credits per lawyer per day).
4. **Action-Based Deductions:** Credits are charged strictly based on the **type of action** performed, making expenses predictable.

---

## 2. ⚡ Real World Costs & Fixed Credit Pricing

Based on actual production usage logs, the token consumption is significantly higher due to heavy RAG context (up to 150k input tokens for a single chat query) and detailed outputs (up to 10k output tokens for contract validation). 

To abstract this, we establish a new base value:
> **1 Credit = $0.001** (1/10th of a cent or ~1.25 UZS)
> **100 Credits = $0.10** (~1,250 UZS)

| Action (Generation) | Real Avg. Tokens (In/Out) | Real Avg. Cost (USD) | Fixed Charge (Credits) | User Pays (Abstract) | Margin |
|---------------------|---------------------------|----------------------|------------------------|----------------------|--------|
| **AI Translation (Bg)** | 100 / 50 | ~$0.0005 | **Internal** | $0.00 | - |
| **AI Lawyer Chat** | 90k / 3.5k | ~$0.11 | **250 Credits** | $0.25 (~3,100 UZS) | ~55% |
| **Contract Gen (Std)** | 30k / 4k | ~$0.05 | **150 Credits** | $0.15 (~1,850 UZS) | ~66% |
| **Contract Gen (Ultra)**| 120k / 8k | ~$0.16 | **350 Credits** | $0.35 (~4,350 UZS) | ~54% |
| **Contract Validator** | 110k / 10k | ~$0.16 | **400 Credits** | $0.40 (~5,000 UZS) | ~60% |
| **Fix Contract with AI**| 120k / 5k | ~$0.15 | **350 Credits** | $0.35 (~4,350 UZS) | ~57% |

*(Note: "Real Avg. Cost" is derived from user logs. For instance, `chat_rag_quick-answer` maxed at 149k/4.2k = $0.17. The 250 Credit charge ($0.25) covers even the heaviest outliers safely).*

---

## 3. 📈 Financial Model for an Average Firm (5 Lawyers)

Let's calculate the real numbers for an average law firm employing **5 lawyers**, working 22 days a month.

### 📊 Scenario A: "Average Daily Usage"
A typical day for **one** lawyer using the platform:
- 10x AI Lawyer Consultations = 2,500 Credits
- 2x Standard Generators = 300 Credits
- 1x Ultra Generator = 350 Credits
- 2x Contract Validators = 800 Credits
- **Total per Lawyer / Day:** 3,950 Credits.
- **Total for Firm (5 Lawyers) / Day:** 19,750 Credits.
- **Total for Firm / Month (22 days):** **434,500 Credits**.

#### 💰 Revenue vs Cost (Average Firm)
* **What you charge the firm:** The firm buys a "500,000 Credits" package for **$499.00 / month** (~6,300,000 UZS).
* **Your LLM Cost:** ~434,500 Credits used @ ~58% margin = **~$182.00**.
* **Your Net Revenue (Profit):** **$317.00 / month per firm** (Margin ~63%).

---

### 🔥 Scenario B: "Maximum Usage" (Hitting the Limits)
The firm sets a Daily Limit of **5,000 Credits per lawyer**. All 5 lawyers max out their limits every single day of the month.

- **Total for Firm (5 Lawyers) / Day:** 25,000 Credits.
- **Total for Firm / Month (22 days):** **550,000 Credits**.
*(They will need to buy a 100,000 credit top-up mid-month).*

#### 💰 Revenue vs Cost (Maximum Usage)
* **What you charge the firm:** $499.00 (Base) + $110.00 (Top-up) = **$609.00 / month** (~7,600,000 UZS).
* **Your LLM Cost:** 550,000 Credits @ ~58% margin = **~$231.00**.
* **Your Net Revenue (Profit):** **$378.00 / month per firm** (Margin 62%).

---

## 4. 🗂️ Proposed Subscription Plans (B2B SaaS)

Because RAG usage is highly token-intensive, the pricing reflects a premium enterprise tool. 

### � "Офис" (Small Firm)
- **Price:** $199.00 / month (~2,500,000 UZS)
- **Credits Shared Pool:** 200,000 Credits
- **Daily Limit per User:** Configurable
- **Best for:** 1-3 users.
- *LLM Cost to you: ~$84. Profit: $115.*

### � "Корпорация" (Standard Firm) 👈 *The Sweet Spot*
- **Price:** $499.00 / month (~6,300,000 UZS)
- **Credits Shared Pool:** 500,000 Credits
- **Daily Limit per User:** Configurable
- **Best for:** 4-10 users (Perfect for the 5-lawyer average).
- *LLM Cost to you: ~$210. Profit: $289.*

### 🏆 "Холдинг" (Large Enterprise)
- **Price:** $999.00 / month (~12,600,000 UZS)
- **Credits Shared Pool:** 1,200,000 Credits (20% Bonus included)
- **Daily Limit per User:** Configurable
- **Best for:** 15+ users, heavy API / generation usage.
- *LLM Cost to you: ~$504. Profit: $495.*

### 🔋 Top-Ups (Pay-As-You-Go)
- **$55.00** = 50,000 Credits
- **$110.00** = 100,000 Credits
