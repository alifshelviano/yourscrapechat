import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  let analysisData: any
  let language = "en"

  try {
    const requestData = await request.json()
    analysisData = requestData.analysisData
    const originalRequest = requestData.originalRequest
    const source = requestData.source
    language = requestData.language || "en"

    if (!analysisData) {
      return NextResponse.json({ error: "Analysis data is required" }, { status: 400 })
    }

    const totalReviews = analysisData.totalReviews
    const sentimentBreakdown = analysisData.sentimentDistribution
    const topWords = analysisData.commonWords
      .slice(0, 5)
      .map((w: any) => w.word)
      .join(", ")
    const avgConfidence = Math.round(analysisData.sentimentInsights.averageConfidence * 100)

    const positivePercent = Math.round((sentimentBreakdown.Positive / totalReviews) * 100)
    const negativePercent = Math.round((sentimentBreakdown.Negative / totalReviews) * 100)
    const neutralPercent = Math.round((sentimentBreakdown.Neutral / totalReviews) * 100)

    let scoreInfo = ""
    if (source === "googleplay" && analysisData.scoreDistribution) {
      const scores = analysisData.scoreDistribution
      const avgScore = (
        (scores[1] * 1 + scores[2] * 2 + scores[3] * 3 + scores[4] * 4 + scores[5] * 5) /
        totalReviews
      ).toFixed(1)
      scoreInfo =
        language === "en" ? `Average rating: ${avgScore}/5 stars. ` : `Rating rata-rata: ${avgScore}/5 bintang. `
    }

    const prompts = {
      en: `Generate a brief, insightful summary of this sentiment analysis:

Original request: "${originalRequest}"
Data source: ${source === "googleplay" ? "Google Play Store reviews" : "YouTube comments"}
Total items analyzed: ${totalReviews}
${scoreInfo}
Sentiment breakdown: ${positivePercent}% positive, ${negativePercent}% negative, ${neutralPercent}% neutral
Analysis confidence: ${avgConfidence}%
Common words in feedback: ${topWords}

Create a 2-3 sentence summary that highlights:
1. Overall sentiment trend
2. Key insights or patterns
3. One actionable takeaway

Keep it concise, professional, and focused on the most important findings.`,

      id: `Buatkan ringkasan singkat dan mendalam dari analisis sentimen ini:

Permintaan asli: "${originalRequest}"
Sumber data: ${source === "googleplay" ? "ulasan Google Play Store" : "komentar YouTube"}
Total item yang dianalisis: ${totalReviews}
${scoreInfo}
Breakdown sentimen: ${positivePercent}% positif, ${negativePercent}% negatif, ${neutralPercent}% netral
Tingkat kepercayaan analisis: ${avgConfidence}%
Kata-kata umum dalam feedback: ${topWords}

Buatlah ringkasan 2-3 kalimat yang menyoroti:
1. Tren sentimen secara keseluruhan
2. Wawasan atau pola utama
3. Satu tindakan yang dapat diambil

Buatlah ringkas, profesional, dan fokus pada temuan yang paling penting. Jawab dalam Bahasa Indonesia.`,
    }

    const { text } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      prompt: prompts[language as keyof typeof prompts] || prompts.en,
    })

    return NextResponse.json({ summary: text.trim() })
  } catch (error) {
    console.error("Error generating summary:", error)

    if (!analysisData) {
      const basicFallback = {
        en: "Analysis completed successfully. Please try again for detailed insights.",
        id: "Analisis berhasil diselesaikan. Silakan coba lagi untuk wawasan yang lebih detail.",
      }
      return NextResponse.json({ summary: basicFallback[language as keyof typeof basicFallback] || basicFallback.en })
    }

    const fallbackSummaries = {
      en: `Analysis completed for ${analysisData.totalReviews} items. The sentiment distribution shows ${Math.round((analysisData.sentimentDistribution.Positive / analysisData.totalReviews) * 100)}% positive feedback. Key areas for attention include the most frequently mentioned topics in user feedback.`,
      id: `Analisis selesai untuk ${analysisData.totalReviews} item. Distribusi sentimen menunjukkan ${Math.round((analysisData.sentimentDistribution.Positive / analysisData.totalReviews) * 100)}% feedback positif. Area utama yang perlu diperhatikan termasuk topik yang paling sering disebutkan dalam feedback pengguna.`,
    }

    const fallbackSummary = fallbackSummaries[language as keyof typeof fallbackSummaries] || fallbackSummaries.en

    return NextResponse.json({ summary: fallbackSummary })
  }
}
