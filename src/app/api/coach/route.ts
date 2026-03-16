import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
    }

    const { weekSummary, targetCalories, targetProtein, strategy } = await req.json();

    if (!weekSummary) {
      return NextResponse.json({ insight: "Log meals for a few days to unlock AI coaching insights." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an elite fitness and nutrition coach. Analyze this user's 7-day performance data and provide a focused, motivating 2-sentence insight.

User's Strategy: "${strategy || "General Fitness"}"
Daily Calorie Target: ${targetCalories} kcal
Daily Protein Target: ${targetProtein}g

Last 7 Days of Data (format: date | cals logged | protein logged):
${weekSummary}

Instructions:
- Be specific and reference actual numbers from the data
- Be encouraging but honest — if they're underperforming, gently note it
- Suggest ONE concrete action for the next 24 hours
- Keep it to exactly 2 sentences, conversational and energetic
- Do NOT use markdown, headers, or bullet points
- Return ONLY a plain text string with the 2-sentence insight`;

    const result = await model.generateContent(prompt);
    const insight = result.response.text().trim();

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Coach API error:", error);
    return NextResponse.json({ insight: "Keep logging your meals consistently — patterns take a few days to emerge." });
  }
}
