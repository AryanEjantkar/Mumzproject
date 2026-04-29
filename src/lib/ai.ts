import type { VerdictData } from '../components/VerdictCard';

export async function generateVerdict(reviews: string, language: string): Promise<VerdictData> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  const systemPrompt = `You are an expert product reviewer assistant. Analyze the following product reviews and provide a summary.
The response MUST be in ${language === 'ar' ? 'Arabic' : 'English'}.
Provide the output as a JSON object with the exact following structure, no markdown formatting:
{
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2"],
  "sentimentScore": 85,
  "verdict": "Overall verdict text here...",
  "confidenceScore": 92
}`;

  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: { text: systemPrompt }
        },
        contents: [
          {
            role: "user",
            parts: [{ text: reviews }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("API Error:", errorData);
      throw new Error(errorData?.error?.message || "Failed to generate verdict from Gemini API");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Invalid response structure from Gemini API");
    }

    return JSON.parse(content) as VerdictData;
  } catch (error: any) {
    console.error("Error generating verdict:", error);
    throw new Error(error.message || "Failed to generate verdict");
  }
}
