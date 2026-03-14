export type FeedbackType = "roast" | "toast";

export interface SpendingContext {
  /** The actual transaction amount */
  amount: number;
  /** The user's typical spend at this vendor */
  avgSpend: number;
  /** Current account balance */
  currentBalance: number;
  /** Weekly spent so far */
  weeklySpent: number;
  /** Weekly budget cap */
  weeklyBudget: number;
}

const FALLBACK: Record<FeedbackType, string> = {
  roast: "Your wallet just filed a missing persons report. 💸",
  toast: "Legendary restraint! Your savings account just clapped. 🙌",
};

function buildPrompt(vendor: string, ctx: SpendingContext, type: FeedbackType): string {
  const { amount, avgSpend, currentBalance, weeklySpent, weeklyBudget } = ctx;
  const overAvg = amount > avgSpend;
  const diffPct = Math.round(Math.abs(amount - avgSpend) / avgSpend * 100);
  const budgetLeft = weeklyBudget - weeklySpent;
  const overBudget = weeklySpent + amount > weeklyBudget;
  const hour = new Date().getHours();
  const timeContext =
    hour < 6 ? "at 3am like a gremlin" :
    hour < 12 ? "first thing in the morning" :
    hour < 17 ? "on a weekday afternoon" :
    hour < 21 ? "in the evening" : "late at night";

  if (type === "roast") {
    return [
      `You are a savage-but-lovable Gen-Z financial roast comedian. Roast this purchase in ONE punchy sentence (max 25 words). Be specific to the details below. No hashtags. No emojis at the start.`,
      `- Vendor: ${vendor}`,
      `- Amount: $${amount.toFixed(2)} (their usual spend here: $${avgSpend.toFixed(2)})`,
      overAvg
        ? `- They spent ${diffPct}% MORE than usual at ${vendor} — classic.`
        : `- They spent ${diffPct}% less than usual, yet somehow still couldn't resist.`,
      `- Current balance after this: $${(currentBalance - amount).toFixed(2)}`,
      overBudget
        ? `- This blows their weekly budget (already spent $${weeklySpent.toFixed(2)} of $${weeklyBudget}).`
        : `- Only $${budgetLeft.toFixed(2)} left in their weekly budget.`,
      `- They made this decision ${timeContext}.`,
    ].join("\n");
  }

  return [
    `You are an enthusiastic financial hype coach. Celebrate this money-saving moment in ONE energetic sentence (max 25 words). Be specific to the details. No hashtags.`,
    `- Vendor: ${vendor}`,
    `- Amount they resisted: $${amount.toFixed(2)} (their usual spend here: $${avgSpend.toFixed(2)})`,
    `- Current balance stays at: $${currentBalance.toFixed(2)}`,
    `- Weekly budget remaining: $${budgetLeft.toFixed(2)} of $${weeklyBudget}`,
    `- They made this smart choice ${timeContext}.`,
  ].join("\n");
}

/**
 * Calls the Gemini API to generate a witty one-liner roast or toast
 * based on a vendor name and transaction amount.
 *
 * Requires VITE_GEMINI_API_KEY to be set in the environment.
 */
export async function generateSpendingFeedback(
  vendor: string,
  ctx: SpendingContext,
  type: FeedbackType
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[Gemini] VITE_GEMINI_API_KEY not set — using fallback.");
      return FALLBACK[type];
    }

    const prompt = buildPrompt(vendor, ctx, type);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 60, temperature: 0.9 },
        }),
      }
    );

    if (!res.ok) {
      console.error(`[Gemini] API error ${res.status}: ${res.statusText}`);
      return FALLBACK[type];
    }

    const data = await res.json();
    const text: string | undefined =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    return text?.trim() || FALLBACK[type];
  } catch (err) {
    console.error("[Gemini] Unexpected error:", err);
    return FALLBACK[type];
  }
}
