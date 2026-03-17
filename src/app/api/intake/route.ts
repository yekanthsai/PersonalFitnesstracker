import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { physicals, activity, goal } = await req.json();

    if (!goal) {
      return NextResponse.json({ error: "No goal description provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an elite fitness and nutrition expert with expertise in evidence-based exercise science.

The user has provided the following details:
- Height: ${physicals?.height || "Unknown"} (metric)
- Weight: ${physicals?.weight || "Unknown"} (metric, kg)
- Activity Level: ${activity || "Unknown"}
- Their Goal: "${goal}"

Using the METRIC Mifflin-St Jeor equation below, calculate their Basal Metabolic Rate (BMR):
  Men: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
  Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
  (If gender is not stated, assume an average—use the male formula and adjust slightly downward.)
  (If age is not stated, assume 28 years old.)

Then multiply BMR by the appropriate TDEE multiplier based on activity level:
  - Sedentary: × 1.2
  - Lightly Active: × 1.375
  - Moderately Active: × 1.55
  - Very Active: × 1.725

Adjust the final calorie target based on the user's stated goal (cut, bulk, maintain, recomp, etc.).

Return a JSON object with EXACTLY these fields:
- "strategy_name" (string, a short motivating name for the approach, e.g., "Aggressive Cut", "Lean Bulk", "Clean Maintain")
- "daily_calories" (number, the recommended daily caloric target as an integer)
- "daily_protein" (number, the recommended daily protein in grams as an integer)
- "estimated_weeks_to_goal" (number, estimate in weeks; use 0 if indeterminate)

Return ONLY valid JSON without markdown formatting blocks.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let jsonResult;
    try {
      const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      jsonResult = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse intake JSON:", responseText);
      return NextResponse.json({ error: "Parsing failed" }, { status: 500 });
    }

    return NextResponse.json(jsonResult);
  } catch (error) {
    console.error("Intake API Error:", error);
    return NextResponse.json({ error: "Failed to process intake" }, { status: 500 });
  }
}
