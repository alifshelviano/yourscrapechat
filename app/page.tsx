"use client"

import type React from "react"
import { useAuth } from "@/components/auth-context"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, BarChart3, Send, MessageCircle, Globe } from "lucide-react"
import { ReviewsTable } from "@/components/reviews-table"
import { ScoreChart } from "@/components/score-chart"
import { WordFrequencyChart } from "@/components/word-frequency-chart"
import { SentimentInsights } from "@/components/sentiment-insights"
import { ExportOptions } from "@/components/export-options"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Review {
  id: string
  userName: string
  userImage: string
  date: string
  score: number
  text: string
  sentiment: string
  sentimentConfidence: number
  sentimentMethod: string
  thumbsUp: number
  version?: string
  source: "googleplay" | "youtube"
}

interface AnalysisData {
  reviews: Review[]
  scoreDistribution: Record<number, number>
  sentimentDistribution: Record<string, number>
  commonWords: { word: string; count: number }[]
  totalReviews: number
  sentimentInsights: {
    averageConfidence: number
    methodDistribution: {
      rating: number
      text: number
      combined: number
    }
  }
}

interface ChatMessage {
  id: string
  type: "user" | "assistant" | "analysis"
  content: string
  timestamp: Date
  analysisData?: AnalysisData
  summary?: string
}

type Language = "en" | "id"
type SourceType = "googleplay" | "youtube"

const translations = {
  en: {
    title: "Sentiment Analyzer",
    subtitle: "Chat with AI to analyze sentiment from Google Play Store reviews or YouTube comments",
    chat: "Chat",
    chatDescription: "Ask me to analyze sentiment data from supported sources",
    placeholder: "Ask me to analyze sentiment data...",
    exampleRequests: "Example Requests",
    exampleRequestsDescription: "Try these sample requests",
    analysisResults: "Analysis Results",
    items: "items",
    welcomeMessage:
      'Hi! I can help you analyze sentiment from Google Play Store reviews or YouTube comments. Try asking me something like:\n\n• "Get me data from Google Play from app Instagram"\n• "Analyze YouTube comments from this video: [URL]"\n• "Show me reviews for WhatsApp from Google Play"',
    analyzing: "Analyzing...",
    unsupportedSource: "I can only access Google Play Store reviews and YouTube comments right now.",
    errorMessage: "Sorry, I encountered an error while processing your request. Please try again.",
    examples: [
      "Get me data from Google Play from app Instagram",
      "Analyze YouTube comments from https://youtube.com/watch?v=example",
      "Show me reviews for WhatsApp",
      "Get sentiment analysis for Spotify app",
      "Analyze TikTok comments (unsupported example)",
    ],
    manualParameters: "Manual Parameters",
    adjustSettings: "Adjust the settings below and run analysis without a new prompt.",
    source: "Source",
    appId: "App ID (e.g., com.instagram.android)",
    youtubeUrl: "YouTube URL",
    numberOfItems: "Number of items",
    sort: "Sort",
    newest: "Newest",
    byRating: "By Rating",
    top: "Top",
    runAnalysis: "Run Analysis",
  },
  id: {
    title: "Analisis Sentimen",
    subtitle: "Chat dengan AI untuk menganalisis sentimen dari ulasan Google Play Store atau komentar YouTube",
    chat: "Chat",
    chatDescription: "Tanyakan kepada saya untuk menganalisis data sentimen dari sumber yang didukung",
    placeholder: "Tanyakan kepada saya untuk menganalisis data sentimen...",
    exampleRequests: "Contoh Permintaan",
    exampleRequestsDescription: "Coba contoh permintaan ini",
    analysisResults: "Hasil Analisis",
    items: "item",
    welcomeMessage:
      'Halo! Saya dapat membantu Anda menganalisis sentimen dari ulasan Google Play Store atau komentar YouTube. Coba tanyakan sesuatu seperti:\n\n• "Ambilkan data dari Google Play untuk aplikasi Instagram"\n• "Analisis komentar YouTube dari video ini: [URL]"\n• "Tampilkan ulasan untuk WhatsApp dari Google Play"',
    analyzing: "Menganalisis...",
    unsupportedSource: "Saya hanya dapat mengakses ulasan Google Play Store dan komentar YouTube saat ini.",
    errorMessage: "Maaf, saya mengalami kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
    examples: [
      "Ambilkan data dari Google Play untuk aplikasi Instagram",
      "Analisis komentar YouTube dari https://youtube.com/watch?v=example",
      "Tampilkan ulasan untuk WhatsApp",
      "Dapatkan analisis sentimen untuk aplikasi Spotify",
      "Analisis komentar TikTok (contoh tidak didukung)",
    ],
    manualParameters: "Parameter Manual",
    adjustSettings: "Sesuaikan pengaturan di bawah lalu jalankan analisis tanpa prompt baru.",
    source: "Sumber",
    appId: "ID Aplikasi (mis. com.instagram.android)",
    youtubeUrl: "URL YouTube",
    numberOfItems: "Jumlah item",
    sort: "Urutkan",
    newest: "Terbaru",
    byRating: "Berdasar Rating",
    top: "Teratas",
    runAnalysis: "Jalankan Analisis",
  },
}

export default function SentimentAnalyzer() {
    const { user, ready, signOut } = useAuth()
  const router = useRouter()
  const [language, setLanguage] = useState<Language>("en")
  const t = translations[language]
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content: t.welcomeMessage,
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [manualSource, setManualSource] = useState<SourceType>("googleplay")
  const [manualParams, setManualParams] = useState<{
    appId?: string
    youtubeUrl?: string
    num: number
    sort: string
    language: string
  }>({
    appId: "",
    youtubeUrl: "",
    num: 50,
    sort: "NEWEST",
    language: "mixed",
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login")
    }
  }, [ready, user, router])

  useEffect(() => {
    setMessages((prev) => prev.map((msg) => (msg.id === "welcome" ? { ...msg, content: t.welcomeMessage } : msg)))
  }, [language, t.welcomeMessage])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function runAnalysis({
    source,
    params,
    originalRequest,
  }: {
    source: SourceType
    params: any
    originalRequest?: string
  }) {
    const endpoint = source === "googleplay" ? "/api/reviews" : "/api/youtube-comments"
    const analysisResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    if (!analysisResponse.ok) {
      throw new Error("Failed to analyze data")
    }

    const analysisData = await analysisResponse.json()

    const summaryResponse = await fetch("/api/generate-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysisData,
        originalRequest: originalRequest || "",
        source,
        language,
      }),
    })

    let summary = language === "en" ? "Analysis completed successfully." : "Analisis berhasil diselesaikan."
    if (summaryResponse.ok) {
      const summaryResult = await summaryResponse.json()
      summary = summaryResult.summary
    }

    const analysisMessage: ChatMessage = {
      id: (Date.now() + 2).toString(),
      type: "analysis",
      content: `${language === "en" ? "Here's your sentiment analysis for" : "Berikut analisis sentimen untuk"} ${
        source === "googleplay"
          ? language === "en"
            ? "Google Play reviews"
            : "ulasan Google Play"
          : language === "en"
            ? "YouTube comments"
            : "komentar YouTube"
      }:`,
      timestamp: new Date(),
      analysisData,
      summary,
    }

    setMessages((prev) => [...prev, analysisMessage])

    setManualSource(source)
    setManualParams((prev: any) => ({
      appId: params.appId ?? prev.appId ?? "",
      youtubeUrl: params.youtubeUrl ?? prev.youtubeUrl ?? "",
      num: typeof params.num === "number" ? params.num : (prev.num ?? 50),
      sort: params.sort ?? prev.sort ?? "NEWEST",
      language: params.language ?? prev.language ?? "mixed",
    }))
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setLoading(true)

    try {
      const parseResponse = await fetch("/api/parse-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      })

      if (!parseResponse.ok) {
        throw new Error("Failed to parse request")
      }

      const parseResult = await parseResponse.json()

      if (!parseResult.supported) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `${t.unsupportedSource} ${
            parseResult.message ||
            (language === "en"
              ? "Please try asking for data from these supported sources."
              : "Silakan minta data dari sumber yang didukung ini.")
          }`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        return
      }

      setManualSource(parseResult.source)
      setManualParams((prev: any) => ({
        appId: parseResult.params?.appId ?? prev.appId ?? "",
        youtubeUrl: parseResult.params?.youtubeUrl ?? prev.youtubeUrl ?? "",
        num: typeof parseResult.params?.num === "number" ? parseResult.params.num : (prev.num ?? 50),
        sort: parseResult.params?.sort ?? prev.sort ?? "NEWEST",
        language: parseResult.params?.language ?? prev.language ?? "mixed",
      }))

      await runAnalysis({
        source: parseResult.source,
        params: parseResult.params,
        originalRequest: userMessage.content,
      })
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: t.errorMessage,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!user) {
    // Prevent flashing content before redirect
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              {t.title}
            </h1>
            <p className="text-muted-foreground text-lg">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline-block" title={user.email}>
              {user.email}
            </span>
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="bg-blue-500 hover:bg-blue-300 text-white"
              size="sm"
              onClick={() => {
                signOut()
                router.replace("/login")
              }}
            >
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t.chat}
                </CardTitle>
                <CardDescription>{t.chatDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] break-words rounded-lg px-4 py-2 ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.type === "analysis"
                              ? "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        {message.summary && (
                          <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded text-xs">
                            <strong>{language === "en" ? "Summary:" : "Ringkasan:"}</strong> {message.summary}
                          </div>
                        )}
                        <div className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{t.analyzing}</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder={t.placeholder}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={loading || !inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t.exampleRequests}</CardTitle>
                <CardDescription>{t.exampleRequestsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {t.examples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-3 whitespace-normal bg-transparent"
                    onClick={() => setInputMessage(example)}
                    disabled={loading}
                  >
                    {example}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t.manualParameters}</CardTitle>
                <CardDescription>{t.adjustSettings}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-sm text-muted-foreground">{t.source}</label>
                  <Select value={manualSource} onValueChange={(v: SourceType) => setManualSource(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="googleplay">Google Play</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {manualSource === "googleplay" ? (
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-sm text-muted-foreground">{t.appId}</label>
                    <Input
                      value={manualParams.appId || ""}
                      onChange={(e) => setManualParams((p) => ({ ...p, appId: e.target.value }))}
                      placeholder="com.example.app"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-sm text-muted-foreground">{t.youtubeUrl}</label>
                    <Input
                      value={manualParams.youtubeUrl || ""}
                      onChange={(e) => setManualParams((p) => ({ ...p, youtubeUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  <label className="text-sm text-muted-foreground">{t.numberOfItems}</label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={manualParams.num}
                    onChange={(e) => setManualParams((p) => ({ ...p, num: Number(e.target.value || 0) }))}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <label className="text-sm text-muted-foreground">{t.sort}</label>
                  <Select value={manualParams.sort} onValueChange={(v) => setManualParams((p) => ({ ...p, sort: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEWEST">{t.newest}</SelectItem>
                      <SelectItem value="RATING">{t.byRating}</SelectItem>
                      <SelectItem value="TOP">{t.top}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <label className="text-sm text-muted-foreground">Language</label>
                  <Select
                    value={manualParams.language}
                    onValueChange={(v) => setManualParams((p) => ({ ...p, language: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                      <SelectItem value="mixed">{language === "en" ? "Mixed" : "Campuran"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={async () => {
                      if (loading) return
                      if (manualSource === "googleplay" && !manualParams.appId) return
                      if (manualSource === "youtube" && !manualParams.youtubeUrl) return

                      setLoading(true)
                      try {
                        await runAnalysis({
                          source: manualSource,
                          params:
                            manualSource === "googleplay"
                              ? {
                                  appId: manualParams.appId,
                                  num: manualParams.num,
                                  sort: manualParams.sort,
                                  language: manualParams.language,
                                }
                              : {
                                  youtubeUrl: manualParams.youtubeUrl,
                                  num: manualParams.num,
                                  sort: manualParams.sort,
                                  language: manualParams.language,
                                },
                        })
                      } catch (e) {
                        const errorMessage: ChatMessage = {
                          id: (Date.now() + 1).toString(),
                          type: "assistant",
                          content: t.errorMessage,
                          timestamp: new Date(),
                        }
                        setMessages((prev) => [...prev, errorMessage])
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={
                      loading || (manualSource === "googleplay" ? !manualParams.appId : !manualParams.youtubeUrl)
                    }
                  >
                    {t.runAnalysis}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {(() => {
          const latestAnalysis = messages.filter((m) => m.analysisData).slice(-1)[0]
          return latestAnalysis ? (
            <div className="mt-8 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6">
                  {t.analysisResults} ({latestAnalysis.analysisData!.totalReviews} {t.items})
                </h2>

                <SentimentInsights
                  sentimentDistribution={latestAnalysis.analysisData!.sentimentDistribution}
                  sentimentInsights={latestAnalysis.analysisData!.sentimentInsights}
                  totalReviews={latestAnalysis.analysisData!.totalReviews}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <ScoreChart data={latestAnalysis.analysisData!.scoreDistribution} />
                  <WordFrequencyChart data={latestAnalysis.analysisData!.commonWords} />
                </div>

                <div className="mt-6">
                  <ExportOptions data={latestAnalysis.analysisData!} appId="chat-analysis" />
                </div>

                <div className="mt-6">
                  <ReviewsTable reviews={latestAnalysis.analysisData!.reviews} />
                </div>
              </div>
            </div>
          ) : null
        })()}
      </div>
    </div>
  )
}
