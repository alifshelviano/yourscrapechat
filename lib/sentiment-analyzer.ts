// Simple sentiment analysis using keyword-based approach
// This provides more nuanced sentiment analysis beyond just star ratings

interface SentimentKeywords {
  positive: string[]
  negative: string[]
  neutral: string[]
}

const ENGLISH_SENTIMENT_KEYWORDS: SentimentKeywords = {
  positive: [
    "good",
    "great",
    "excellent",
    "amazing",
    "awesome",
    "fantastic",
    "wonderful",
    "perfect",
    "love",
    "best",
    "brilliant",
    "outstanding",
    "superb",
    "impressive",
    "helpful",
    "useful",
    "easy",
    "fast",
    "smooth",
    "reliable",
    "stable",
    "clean",
    "beautiful",
    "nice",
    "cool",
    "recommend",
    "satisfied",
    "happy",
    "pleased",
  ],
  negative: [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "worst",
    "hate",
    "sucks",
    "useless",
    "broken",
    "bug",
    "crash",
    "slow",
    "laggy",
    "freezing",
    "error",
    "problem",
    "issue",
    "annoying",
    "frustrating",
    "disappointed",
    "waste",
    "money",
    "time",
    "difficult",
    "hard",
    "confusing",
    "complicated",
    "boring",
    "stupid",
    "dumb",
  ],
  neutral: ["okay", "ok", "fine", "normal", "average", "standard", "usual", "regular"],
}

const INDONESIAN_SENTIMENT_KEYWORDS: SentimentKeywords = {
  positive: [
    "bagus",
    "baik",
    "hebat",
    "luar",
    "biasa",
    "keren",
    "mantap",
    "oke",
    "ok",
    "suka",
    "senang",
    "puas",
    "mudah",
    "cepat",
    "lancar",
    "stabil",
    "bersih",
    "indah",
    "cantik",
    "recommended",
    "memuaskan",
    "terbaik",
    "sempurna",
    "berguna",
    "membantu",
    "responsif",
  ],
  negative: [
    "buruk",
    "jelek",
    "parah",
    "rusak",
    "lemot",
    "lambat",
    "error",
    "masalah",
    "susah",
    "sulit",
    "ribet",
    "bingung",
    "boring",
    "membosankan",
    "kecewa",
    "mengecewakan",
    "buang",
    "waktu",
    "uang",
    "sia",
    "payah",
    "gak",
    "tidak",
    "nggak",
    "enggak",
    "gabisa",
    "crash",
    "hang",
    "freeze",
    "lag",
  ],
  neutral: ["biasa", "standar", "lumayan", "cukup", "sedang", "wajar", "oke"],
}

const COMBINED_SENTIMENT_KEYWORDS: SentimentKeywords = {
  positive: [...ENGLISH_SENTIMENT_KEYWORDS.positive, ...INDONESIAN_SENTIMENT_KEYWORDS.positive],
  negative: [...ENGLISH_SENTIMENT_KEYWORDS.negative, ...INDONESIAN_SENTIMENT_KEYWORDS.negative],
  neutral: [...ENGLISH_SENTIMENT_KEYWORDS.neutral, ...INDONESIAN_SENTIMENT_KEYWORDS.neutral],
}

function detectLanguage(text: string): "en" | "id" | "mixed" {
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)

  let englishScore = 0
  let indonesianScore = 0

  words.forEach((word) => {
    if (
      ENGLISH_SENTIMENT_KEYWORDS.positive.includes(word) ||
      ENGLISH_SENTIMENT_KEYWORDS.negative.includes(word) ||
      ENGLISH_SENTIMENT_KEYWORDS.neutral.includes(word)
    ) {
      englishScore++
    }
    if (
      INDONESIAN_SENTIMENT_KEYWORDS.positive.includes(word) ||
      INDONESIAN_SENTIMENT_KEYWORDS.negative.includes(word) ||
      INDONESIAN_SENTIMENT_KEYWORDS.neutral.includes(word)
    ) {
      indonesianScore++
    }
  })

  if (englishScore > indonesianScore * 1.5) return "en"
  if (indonesianScore > englishScore * 1.5) return "id"
  return "mixed"
}

export function analyzeSentimentFromText(text: string): {
  sentiment: "Positive" | "Negative" | "Neutral"
  confidence: number
  keywords: { positive: string[]; negative: string[]; neutral: string[] }
  detectedLanguage: "en" | "id" | "mixed"
} {
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)
  const detectedLanguage = detectLanguage(text)

  const keywordSet =
    detectedLanguage === "en"
      ? ENGLISH_SENTIMENT_KEYWORDS
      : detectedLanguage === "id"
        ? INDONESIAN_SENTIMENT_KEYWORDS
        : COMBINED_SENTIMENT_KEYWORDS

  const foundKeywords = {
    positive: [] as string[],
    negative: [] as string[],
    neutral: [] as string[],
  }

  // Count sentiment keywords
  words.forEach((word) => {
    if (keywordSet.positive.includes(word)) {
      foundKeywords.positive.push(word)
    } else if (keywordSet.negative.includes(word)) {
      foundKeywords.negative.push(word)
    } else if (keywordSet.neutral.includes(word)) {
      foundKeywords.neutral.push(word)
    }
  })

  const positiveScore = foundKeywords.positive.length
  const negativeScore = foundKeywords.negative.length
  const neutralScore = foundKeywords.neutral.length

  const totalScore = positiveScore + negativeScore + neutralScore

  // Determine sentiment based on keyword counts
  let sentiment: "Positive" | "Negative" | "Neutral"
  let confidence: number

  if (totalScore === 0) {
    sentiment = "Neutral"
    confidence = 0.5
  } else if (positiveScore > negativeScore && positiveScore > neutralScore) {
    sentiment = "Positive"
    confidence = Math.min(0.9, 0.5 + (positiveScore / totalScore) * 0.4)
  } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
    sentiment = "Negative"
    confidence = Math.min(0.9, 0.5 + (negativeScore / totalScore) * 0.4)
  } else {
    sentiment = "Neutral"
    confidence = Math.min(0.8, 0.5 + (neutralScore / totalScore) * 0.3)
  }

  return {
    sentiment,
    confidence,
    keywords: foundKeywords,
    detectedLanguage,
  }
}

export function getEnhancedSentiment(
  score: number,
  text: string,
): {
  sentiment: string
  confidence: number
  method: "rating" | "text" | "combined"
} {
  // Get sentiment from star rating
  const ratingSentiment = score >= 4 ? "Positive" : score === 3 ? "Neutral" : "Negative"

  // Get sentiment from text analysis
  const textAnalysis = analyzeSentimentFromText(text)

  // Combine both methods for more accurate sentiment
  if (ratingSentiment === textAnalysis.sentiment) {
    return {
      sentiment: ratingSentiment,
      confidence: Math.min(0.95, 0.7 + textAnalysis.confidence * 0.25),
      method: "combined",
    }
  }

  // If they disagree, use the one with higher confidence
  // Rating-based sentiment gets higher base confidence for extreme ratings
  const ratingConfidence = score === 5 || score === 1 ? 0.9 : score === 4 || score === 2 ? 0.7 : 0.5

  if (ratingConfidence > textAnalysis.confidence) {
    return {
      sentiment: ratingSentiment,
      confidence: ratingConfidence,
      method: "rating",
    }
  } else {
    return {
      sentiment: textAnalysis.sentiment,
      confidence: textAnalysis.confidence,
      method: "text",
    }
  }
}

export function analyzeSentiment(
  text: string,
  language = "mixed",
  score?: number,
): {
  sentiment: string
  confidence: number
  method: string
} {
  // If we have a score (from Google Play reviews), use enhanced sentiment analysis
  if (score !== undefined && score > 0) {
    return getEnhancedSentiment(score, text)
  }

  // For YouTube comments or when no score is available, use text-only analysis
  const textAnalysis = analyzeSentimentFromText(text)
  return {
    sentiment: textAnalysis.sentiment,
    confidence: textAnalysis.confidence,
    method: "text",
  }
}
