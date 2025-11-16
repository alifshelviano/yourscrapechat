import { type NextRequest, NextResponse } from "next/server"
import { getEnhancedSentiment } from "@/lib/sentiment-analyzer"

// Stopwords for English and Bahasa Indonesia
const ENGLISH_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "will",
  "with",
  "i",
  "you",
  "we",
  "they",
  "this",
  "but",
  "not",
  "or",
  "have",
  "had",
  "can",
  "could",
  "would",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "do",
  "does",
  "did",
  "get",
  "got",
])

const INDONESIAN_STOPWORDS = new Set([
  "yang",
  "dan",
  "di",
  "ke",
  "dari",
  "untuk",
  "dengan",
  "pada",
  "adalah",
  "ini",
  "itu",
  "tidak",
  "ada",
  "akan",
  "sudah",
  "juga",
  "atau",
  "bisa",
  "dapat",
  "harus",
  "saya",
  "kamu",
  "dia",
  "mereka",
  "kita",
  "kami",
  "nya",
  "lah",
  "kah",
  "pun",
  "tapi",
  "tetapi",
  "karena",
  "sebab",
  "jika",
  "kalau",
  "bila",
  "ketika",
  "saat",
  "waktu",
  "sebelum",
  "sesudah",
  "setelah",
  "sampai",
  "hingga",
  "selama",
  "antara",
  "dalam",
  "luar",
])

function processText(text: string): string[] {
  // Normalize case and remove punctuation/numbers
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // Split into words and remove stopwords
  const words = cleaned
    .split(" ")
    .filter((word) => word.length > 2)
    .filter((word) => !ENGLISH_STOPWORDS.has(word) && !INDONESIAN_STOPWORDS.has(word))

  return words
}

function getWordFrequency(words: string[]): Record<string, number> {
  const frequency: Record<string, number> = {}
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1
  })
  return frequency
}

// Mock review data generator since we can't actually scrape Google Play Store
function generateMockReviews(appId: string, num: number, sort: string, language = "mixed") {
  const englishTexts = [
    "This app is amazing! I love using it every day. Great features and smooth performance.",
    "Terrible app, keeps crashing and very slow. Waste of time and storage space.",
    "Pretty good app overall. Some bugs here and there but generally works fine.",
    "Excellent user interface and very intuitive. Highly recommended for everyone!",
    "App is okay, nothing special. Could use more features and better design.",
    "Worst app ever! Doesn't work at all. Don't download this garbage.",
    "Love this app! Perfect for what I need. Fast, reliable, and easy to use.",
    "Decent app but has some issues. Sometimes freezes and needs restart.",
    "Outstanding app with great customer support. Five stars all the way!",
    "App is fine but could be better. Missing some important features I need.",
    "Fantastic application with beautiful design. Works perfectly on my device.",
    "Horrible experience. The app crashes every time I try to open it.",
    "Good app but needs improvement. Some features are confusing to use.",
    "Brilliant work by the developers! This app exceeded my expectations.",
    "Average app, nothing extraordinary. Could be more user-friendly.",
  ]

  const indonesianTexts = [
    "Bagus banget aplikasinya! Mudah digunakan dan fiturnya lengkap.",
    "Jelek banget, sering error dan lemot. Buang-buang waktu aja.",
    "Lumayan lah, ada beberapa bug tapi masih bisa dipakai.",
    "Keren aplikasinya! Recommended banget buat semua orang.",
    "Biasa aja sih, gak ada yang istimewa. Perlu ditingkatkan lagi.",
    "Parah banget aplikasinya! Gak bisa dipake sama sekali.",
    "Mantap aplikasinya! Cepat, stabil, dan mudah digunakan.",
    "Oke lah, tapi masih ada yang perlu diperbaiki. Kadang hang.",
    "Luar biasa bagus! Customer servicenya juga responsif banget.",
    "Cukup bagus tapi kurang fitur yang penting. Perlu update.",
    "Aplikasi terbaik yang pernah saya pakai! Sangat membantu sekali.",
    "Mengecewakan banget. Aplikasinya sering crash dan tidak stabil.",
    "Lumayan bagus tapi masih ada yang kurang. Interface bisa diperbaiki.",
    "Hebat sekali aplikasinya! Fitur-fiturnya sangat berguna dan mudah.",
    "Standar aja aplikasinya. Tidak ada yang spesial atau menarik.",
  ]

  const englishNames = [
    "John Smith",
    "Sarah Johnson",
    "Mike Chen",
    "Lisa Wang",
    "David Brown",
    "Emma Wilson",
    "Alex Rodriguez",
    "Maria Garcia",
    "James Taylor",
    "Anna Lee",
  ]

  const indonesianNames = [
    "Budi Santoso",
    "Sari Dewi",
    "Ahmad Rahman",
    "Rina Sari",
    "Doni Pratama",
    "Maya Putri",
    "Eko Wijaya",
    "Fitri Handayani",
    "Rudi Setiawan",
    "Indira Sari",
  ]

  let sampleTexts: string[]
  let userNames: string[]

  switch (language) {
    case "en":
      sampleTexts = englishTexts
      userNames = englishNames
      break
    case "id":
      sampleTexts = indonesianTexts
      userNames = indonesianNames
      break
    case "mixed":
    default:
      sampleTexts = [...englishTexts, ...indonesianTexts]
      userNames = [...englishNames, ...indonesianNames]
      break
  }

  const versions = ["1.0.0", "1.1.0", "1.2.0", "2.0.0", "2.1.0"]

  const reviews = []

  for (let i = 0; i < num; i++) {
    const score = Math.floor(Math.random() * 5) + 1
    const textIndex = Math.floor(Math.random() * sampleTexts.length)
    const text = sampleTexts[textIndex]
    const userName = userNames[Math.floor(Math.random() * userNames.length)]
    const version = versions[Math.floor(Math.random() * versions.length)]

    // Generate date within last 30 days
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))

    reviews.push({
      id: `review_${i}_${Date.now()}`,
      userName,
      userImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
      date: date.toISOString(),
      score,
      text,
      thumbsUp: Math.floor(Math.random() * 50),
      version,
    })
  }

  // Sort reviews based on sort option
  if (sort === "NEWEST") {
    reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } else {
    reviews.sort((a, b) => b.thumbsUp - a.thumbsUp)
  }

  return reviews
}

export async function POST(request: NextRequest) {
  try {
    const { appId, num = 100, sort = "NEWEST", language = "mixed" } = await request.json()

    if (!appId) {
      return NextResponse.json({ error: "App ID is required" }, { status: 400 })
    }

    console.log("[v0] Starting review analysis for app:", appId, "with language:", language)

    const mockReviews = generateMockReviews(appId, Math.min(num, 500), sort, language)

    console.log("[v0] Generated", mockReviews.length, "mock reviews")

    // Process reviews
    const processedReviews = mockReviews.map((review: any) => {
      const enhancedSentiment = getEnhancedSentiment(review.score, review.text)
      const processedText = processText(review.text)

      return {
        id: review.id,
        userName: review.userName,
        userImage: review.userImage,
        date: review.date,
        score: review.score,
        text: review.text,
        sentiment: enhancedSentiment.sentiment,
        sentimentConfidence: enhancedSentiment.confidence,
        sentimentMethod: enhancedSentiment.method,
        processedWords: processedText,
        thumbsUp: review.thumbsUp,
        version: review.version,
        source: "googleplay" as const,
      }
    })

    console.log("[v0] Processed reviews with sentiment analysis")

    // Calculate score distribution
    const scoreDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }

    const sentimentDistribution = {
      Positive: 0,
      Negative: 0,
      Neutral: 0,
    }

    processedReviews.forEach((review) => {
      scoreDistribution[review.score as keyof typeof scoreDistribution]++
      sentimentDistribution[review.sentiment as keyof typeof sentimentDistribution]++
    })

    // Get word frequency for low-score reviews (1-2 stars)
    const lowScoreWords: string[] = []
    processedReviews
      .filter((review) => review.score <= 2)
      .forEach((review) => {
        lowScoreWords.push(...review.processedWords)
      })

    const wordFrequency = getWordFrequency(lowScoreWords)
    const commonWords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }))

    const sentimentInsights = {
      averageConfidence:
        processedReviews.reduce((sum, review) => sum + review.sentimentConfidence, 0) / processedReviews.length,
      methodDistribution: {
        rating: processedReviews.filter((r) => r.sentimentMethod === "rating").length,
        text: processedReviews.filter((r) => r.sentimentMethod === "text").length,
        combined: processedReviews.filter((r) => r.sentimentMethod === "combined").length,
      },
    }

    console.log("[v0] Analysis complete, returning results")

    return NextResponse.json({
      reviews: processedReviews,
      scoreDistribution,
      sentimentDistribution,
      commonWords,
      totalReviews: processedReviews.length,
      sentimentInsights,
    })
  } catch (error) {
    console.error("[v0] Error in API route:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
