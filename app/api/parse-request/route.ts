import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const googleModel = google("gemini-3.8-flash", {
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })

    const { text } = await generateText({
      model: googleModel,
      prompt: `Parse this user request for sentiment analysis and return a JSON response:

User request: "${message}"

You need to determine:
1. If this is a supported data source (Google Play Store or YouTube)
2. Extract the app name/ID or YouTube URL
3. Set appropriate parameters

Supported data sources:
- Google Play Store (apps like Instagram, WhatsApp, Spotify, etc.)
- YouTube (video URLs)

NOT supported data sources comments:
- TikTok, Twitter, Facebook, or any other platforms

Return JSON in this exact format:
{
  "supported": boolean,
  "source": "googleplay" | "youtube" | null,
  "params": {
    "appId": string (for Google Play - convert app names to package IDs),
    "youtubeUrl": string (for YouTube),
    "num": number (default 100),
    "sort": "NEWEST" | "HELPFULNESS" (default "NEWEST"),
    "language": "mixed" | "en" | "id" (default "mixed")
  },
  "message": string (explanation if not supported)
}

App name to package ID mappings:
- Instagram -> com.instagram.android
- WhatsApp -> com.whatsapp
- Spotify -> com.spotify.music
- Netflix -> com.netflix.mediaclient
- YouTube -> com.google.android.youtube
- Gojek -> com.gojek.app
- Tokopedia -> com.tokopedia.tkpd
- MyTelkomsel -> com.telkomsel.telkomselcm

For unsupported requests, set supported: false and provide a helpful message.`,
    })

    let parsedResponse
    try {
      let jsonText = text.trim()

      // Check if the response is wrapped in markdown code blocks
      if (jsonText.startsWith("```json") && jsonText.endsWith("```")) {
        // Remove the markdown code block wrapper
        jsonText = jsonText.slice(7, -3).trim() // Remove \`\`\`json from start and \`\`\` from end
      } else if (jsonText.startsWith("```") && jsonText.endsWith("```")) {
        // Handle generic code blocks
        jsonText = jsonText.slice(3, -3).trim()
      }

      parsedResponse = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      return NextResponse.json({
        supported: false,
        source: null,
        params: {},
        message: "I couldn't understand your request. Please try asking for Google Play reviews or YouTube comments.",
      })
    }

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("Error parsing request:", error)
    return NextResponse.json(
      {
        supported: false,
        source: null,
        params: {},
        message: "I encountered an error processing your request. Please try again.",
      },
      { status: 500 },
    )
  }
}
