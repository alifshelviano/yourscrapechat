import { type NextRequest, NextResponse } from "next/server"
import { analyzeSentiment } from "@/lib/sentiment-analyzer"

async function fetchYouTubeComments(videoId: string, maxResults = 100) {
  const API_KEY = process.env.YOUTUBE_API_KEY

  if (!API_KEY) {
    console.log("[v0] YouTube API key not found, using mock data")
    return generateMockYoutubeComments(maxResults, "mixed")
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${Math.min(maxResults, 100)}&key=${API_KEY}&textFormat=plainText`

    console.log("[v0] Fetching YouTube comments from API")
    const response = await fetch(url)

    if (!response.ok) {
      console.error("[v0] YouTube API error:", response.status, response.statusText)
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] YouTube API response received, comments:", data.items?.length || 0)

    const comments =
      data.items?.map((item: any, index: number) => {
        const comment = item.snippet.topLevelComment.snippet
        return {
          id: `comment_${index + 1}`,
          userName: comment.authorDisplayName,
          userImage:
            comment.authorProfileImageUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorDisplayName)}&background=random`,
          date: new Date(comment.publishedAt).toISOString().split("T")[0],
          score: 0, // YouTube comments don't have ratings
          text: comment.textDisplay,
          thumbsUp: comment.likeCount || 0,
          version: "N/A",
          source: "youtube" as const,
        }
      }) || []

    return comments
  } catch (error) {
    console.error("[v0] Error fetching YouTube comments:", error)
    console.log("[v0] Falling back to mock data")
    return generateMockYoutubeComments(maxResults, "mixed")
  }
}

// Mock YouTube comments data generator (fallback)
function generateMockYoutubeComments(count: number, language = "mixed") {
  const englishComments = [
    "This video is amazing! Really helpful content.",
    "Great explanation, thank you for sharing this.",
    "I love this channel, always quality content.",
    "This helped me so much, thank you!",
    "Excellent video, very informative.",
    "Not what I expected, could be better.",
    "This is terrible, waste of time.",
    "Boring content, didn't learn anything.",
    "Okay video, nothing special.",
    "Pretty good, but could use more examples.",
    "Fantastic tutorial, learned a lot!",
    "Could you make more videos like this?",
    "This is exactly what I was looking for.",
    "Thanks for the clear explanation.",
    "Very well done, keep up the good work!",
  ]

  const indonesianComments = [
    "Video yang sangat bagus! Terima kasih sudah berbagi.",
    "Penjelasannya mudah dipahami, sangat membantu.",
    "Konten yang berkualitas, saya suka channel ini.",
    "Sangat bermanfaat, terima kasih banyak!",
    "Video yang luar biasa, sangat informatif.",
    "Kurang menarik, bisa diperbaiki lagi.",
    "Video ini membosankan, buang-buang waktu.",
    "Tidak sesuai harapan, kurang bagus.",
    "Biasa saja, tidak ada yang istimewa.",
    "Lumayan bagus, tapi perlu lebih banyak contoh.",
    "Tutorial yang fantastis, banyak belajar!",
    "Bisa buat video seperti ini lagi?",
    "Ini persis yang saya cari.",
    "Terima kasih atas penjelasan yang jelas.",
    "Sangat bagus, terus berkarya!",
  ]

  const authors = [
    "Ahmad Rahman",
    "Sarah Johnson",
    "Budi Santoso",
    "Emily Chen",
    "Rizki Pratama",
    "Jessica Wong",
    "Andi Wijaya",
    "Michael Brown",
    "Siti Nurhaliza",
    "David Kim",
    "Lisa Anderson",
    "Fajar Nugroho",
    "Maria Garcia",
    "Kevin Lee",
    "Dewi Sartika",
  ]

  const comments = []
  const sourceComments =
    language === "en"
      ? englishComments
      : language === "id"
        ? indonesianComments
        : [...englishComments, ...indonesianComments]

  for (let i = 0; i < count; i++) {
    const comment = sourceComments[Math.floor(Math.random() * sourceComments.length)]
    const author = authors[Math.floor(Math.random() * authors.length)]
    const likes = Math.floor(Math.random() * 100)
    const publishedDays = Math.floor(Math.random() * 365)
    const publishedDate = new Date()
    publishedDate.setDate(publishedDate.getDate() - publishedDays)

    comments.push({
      id: `comment_${i + 1}`,
      userName: author,
      userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=random`,
      date: publishedDate.toISOString().split("T")[0],
      score: 0,
      text: comment,
      thumbsUp: likes,
      version: "N/A",
      source: "youtube" as const,
    })
  }

  return comments
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { youtubeUrl, num = 100, language = "mixed" } = body

    console.log("[v0] YouTube API request:", { youtubeUrl, num, language })

    // Extract video ID from YouTube URL
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
    }

    console.log("[v0] Extracted video ID:", videoId)

    const comments = await fetchYouTubeComments(videoId, num)
    console.log("[v0] Retrieved comments:", comments.length)

    // Analyze sentiment for each comment
    const analyzedComments = comments.map((comment) => {
      const sentiment = analyzeSentiment(comment.text, language)
      return {
        ...comment,
        sentiment: sentiment.sentiment,
        sentimentConfidence: sentiment.confidence,
        sentimentMethod: sentiment.method,
      }
    })

    console.log("[v0] Analyzed comments sentiment")

    // Calculate distributions
    const sentimentDistribution = analyzedComments.reduce(
      (acc, comment) => {
        acc[comment.sentiment] = (acc[comment.sentiment] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Generate word frequency (simplified)
    const allWords = analyzedComments
      .flatMap((comment) => comment.text.toLowerCase().split(/\s+/))
      .filter((word) => word.length > 3)

    const wordFreq = allWords.reduce(
      (acc, word) => {
        acc[word] = (acc[word] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const commonWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }))

    // Calculate sentiment insights
    const totalConfidence = analyzedComments.reduce((sum, comment) => sum + comment.sentimentConfidence, 0)
    const averageConfidence = totalConfidence / analyzedComments.length

    const methodCounts = analyzedComments.reduce(
      (acc, comment) => {
        if (comment.sentimentMethod.includes("text")) acc.text++
        else if (comment.sentimentMethod.includes("rating")) acc.rating++
        else acc.combined++
        return acc
      },
      { rating: 0, text: 0, combined: 0 },
    )

    const result = {
      reviews: analyzedComments,
      scoreDistribution: {}, // YouTube comments don't have scores
      sentimentDistribution,
      commonWords,
      totalReviews: analyzedComments.length,
      sentimentInsights: {
        averageConfidence,
        methodDistribution: methodCounts,
      },
    }

    console.log("[v0] Returning analysis result")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] YouTube API error:", error)
    return NextResponse.json({ error: "Failed to fetch YouTube comments" }, { status: 500 })
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}
