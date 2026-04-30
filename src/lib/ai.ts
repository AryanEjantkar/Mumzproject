import type { VerdictData } from '../components/VerdictCard';

export async function generateVerdict(reviews: string, language: string): Promise<VerdictData> {
  // Split reviews by newline and filter out empty strings
  const reviewArray = reviews
    .split('\n')
    .map(r => r.trim())
    .filter(r => r.length > 0);

  if (reviewArray.length === 0) {
    throw new Error("No valid reviews provided.");
  }

  const apiEndpoint = `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8001"}/analyze`;

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reviews: reviewArray
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("API Error:", errorData);
      throw new Error(errorData?.detail || "Failed to generate verdict from backend");
    }

    const data = await response.json();

    // Map backend response back to the frontend's expected VerdictData structure
    const mappedVerdict: VerdictData = {
      pros: data.pros || [],
      cons: data.cons || [],
      sentimentScore: Math.round((data.sentiment_score || 0) * 100),
      verdict: language === 'ar' ? data.language.ar : data.language.en,
      confidenceScore: Math.round((data.confidence || 0) * 100)
    };

    return mappedVerdict;
  } catch (error: any) {
    console.error("Error generating verdict:", error);
    throw new Error(error.message || "Failed to generate verdict");
  }
}
