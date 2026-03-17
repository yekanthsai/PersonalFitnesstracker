import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;
    const description = formData.get("description") as string | null;
    const userGoal = formData.get("goal") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const descriptionClause = description
      ? `The user's description of this meal: "${description}".`
      : "No additional description was provided.";

    const goalClause = userGoal
      ? `The user's fitness goal is: "${userGoal}". Take it into account for portion estimation if helpful.`
      : "";

    const prompt = `Analyze this image and the user's description: '${description || ""}'. ${goalClause}

${descriptionClause}

Carefully estimate the nutritional content of all food visible in the image. Use the user's description to help identify the specific food if the image is ambiguous.

Return a JSON object with EXACTLY these fields:
- "food_item" (string, a descriptive name of the meal or food, e.g. "Grilled Chicken Breast with Rice")
- "calories" (number, estimated total calories as an integer)
- "protein_grams" (number, estimated total protein in grams as an integer)

Return ONLY raw JSON without markdown code blocks or any other text.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type,
        },
      },
    ]);

    const responseText = result.response.text();
    let jsonResult;

    try {
      const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      jsonResult = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse Gemini vision JSON:", responseText, e);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(jsonResult);

  } catch (error) {
    console.error("Vision API Error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
