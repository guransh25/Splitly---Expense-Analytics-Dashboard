/**
 * Two AI server functions powered by Gemini:
 *   1. categorizeExpense  — guesses a category from the title + amount
 *   2. generateInsights   — short spending summary + savings tip
 *
 * Both are public-safe: they take user-supplied data, run a single LLM call,
 * and return a small JSON object. No DB access.
 */
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Travel", "Groceries", "Health", "Other"] as const;

export const categorizeExpense = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ title: z.string().min(1).max(120), amount: z.number().positive() }).parse(d))
  .handler(async ({ data }) => {
    const { createGateway } = await import("./ai-gateway.server");
    try {
      const { experimental_output: out } = await generateText({
        model: createGateway()("google/gemini-2.5-flash"),
        experimental_output: Output.object({
          schema: z.object({ category: z.enum(CATEGORIES) }),
        }),
        prompt: `Classify this expense into ONE category from: ${CATEGORIES.join(", ")}.\nTitle: ${data.title}\nAmount: ${data.amount}\nReturn JSON only.`,
      });
      return { category: out.category };
    } catch (e) {
      console.error("categorizeExpense failed", e);
      return { category: "Other" as const };
    }
  });

export const generateInsights = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      expenses: z.array(z.object({
        title: z.string(),
        amount: z.number(),
        category: z.string(),
        date: z.string(),
      })).max(200),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.expenses.length === 0) {
      return { topCategory: "—", summary: "No expenses yet. Add one to see insights!", tip: "Start by creating a group with friends." };
    }
    const { createGateway } = await import("./ai-gateway.server");
    try {
      const { experimental_output: out } = await generateText({
        model: createGateway()("google/gemini-2.5-flash"),
        experimental_output: Output.object({
          schema: z.object({
            topCategory: z.string(),
            summary: z.string(),
            tip: z.string(),
          }),
        }),
        prompt: `You are a friendly financial coach. Analyze these expenses and respond in JSON with three short fields:
- topCategory: the category with highest total spend
- summary: 1–2 sentences about this month's spending pattern
- tip: 1 sentence savings suggestion (concrete, kind, not preachy)

Expenses:
${JSON.stringify(data.expenses)}`,
      });
      return out;
    } catch (e) {
      console.error("generateInsights failed", e);
      return { topCategory: "—", summary: "AI insights unavailable right now.", tip: "Try again in a moment." };
    }
  });
