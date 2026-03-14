export type FeedbackType = "roast" | "toast";

const FALLBACK: Record<FeedbackType, string> = {
  roast: "Your wallet just filed a missing persons report. 💸",
  toast: "Legendary restraint! Your savings account just clapped. 🙌",
};

/**
 * Calls the Gemini API to generate a witty one-liner roast or toast
 * based on a vendor name and transaction amount.
 *
 * Requires VITE_GEMINI_API_KEY to be set in the environment.
 */
export async function generateSpendingFeedback(
  vendor: string,
  amount: number,
  type: FeedbackType
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[Gemini] VITE_GEMINI_API_KEY not set — using fallback.");
      return FALLBACK[type];
    }

    const prompt =
      type === "roast"
        ? `You are a witty Gen-Z financial roast comedian. The user just spent $${amount.toFixed(2)} at ${vendor}. Write one savage-but-fun roast about this purchase. Max 20 words. No hashtags.`
        : `You are an enthusiastic financial hype coach. The user resisted spending $${amount.toFixed(2)} at ${vendor} and saved the money. Write one energetic congratulatory line. Max 20 words. No hashtags.`;

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
