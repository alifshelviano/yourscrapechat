"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, BarChart } from "lucide-react"

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
  version: string
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

interface ExportOptionsProps {
  data: AnalysisData
  appId: string
}

export function ExportOptions({ data, appId }: ExportOptionsProps) {
  const [exportFields, setExportFields] = useState({
    userName: true,
    date: true,
    score: true,
    sentiment: true,
    confidence: true,
    method: true,
    text: true,
    thumbsUp: true,
    version: true,
  })
  const [sentimentFilter, setSentimentFilter] = useState("all")
  const [scoreFilter, setScoreFilter] = useState("all")

  const handleFieldChange = (field: string, checked: boolean) => {
    setExportFields((prev) => ({ ...prev, [field]: checked }))
  }

  const getFilteredReviews = () => {
    let filtered = data.reviews

    if (sentimentFilter !== "all") {
      filtered = filtered.filter((review) => review.sentiment === sentimentFilter)
    }

    if (scoreFilter !== "all") {
      const scoreRange = scoreFilter.split("-").map(Number)
      if (scoreRange.length === 2) {
        filtered = filtered.filter((review) => review.score >= scoreRange[0] && review.score <= scoreRange[1])
      } else {
        filtered = filtered.filter((review) => review.score === Number(scoreFilter))
      }
    }

    return filtered
  }

  const handleExportReviews = () => {
    const filteredReviews = getFilteredReviews()
    const headers: string[] = []
    const fieldMap: Record<string, string> = {
      userName: "User Name",
      date: "Date",
      score: "Score",
      sentiment: "Sentiment",
      confidence: "Confidence",
      method: "Analysis Method",
      text: "Review Text",
      thumbsUp: "Thumbs Up",
      version: "Version",
    }

    Object.entries(exportFields).forEach(([field, include]) => {
      if (include) {
        headers.push(fieldMap[field])
      }
    })

    const csvContent = [
      headers.join(","),
      ...filteredReviews.map((review) => {
        const row: string[] = []
        Object.entries(exportFields).forEach(([field, include]) => {
          if (include) {
            let value: string
            switch (field) {
              case "userName":
                value = `"${review.userName}"`
                break
              case "date":
                value = `"${review.date}"`
                break
              case "score":
                value = review.score.toString()
                break
              case "sentiment":
                value = `"${review.sentiment}"`
                break
              case "confidence":
                value = review.sentimentConfidence.toFixed(3)
                break
              case "method":
                value = `"${review.sentimentMethod}"`
                break
              case "text":
                value = `"${review.text.replace(/"/g, '""')}"`
                break
              case "thumbsUp":
                value = review.thumbsUp.toString()
                break
              case "version":
                value = `"${review.version}"`
                break
              default:
                value = ""
            }
            row.push(value)
          }
        })
        return row.join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reviews-${appId}-${sentimentFilter}-${scoreFilter}-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportSummary = () => {
    const filteredReviews = getFilteredReviews()
    const summaryData = [
      ["Metric", "Value"],
      ["Total Reviews", filteredReviews.length.toString()],
      ["Average Score", (filteredReviews.reduce((sum, r) => sum + r.score, 0) / filteredReviews.length).toFixed(2)],
      [
        "Average Confidence",
        (filteredReviews.reduce((sum, r) => sum + r.sentimentConfidence, 0) / filteredReviews.length).toFixed(3),
      ],
      ["", ""],
      ["Score Distribution", ""],
      ...Object.entries(data.scoreDistribution).map(([score, count]) => [`${score} Stars`, count.toString()]),
      ["", ""],
      ["Sentiment Distribution", ""],
      ...Object.entries(data.sentimentDistribution).map(([sentiment, count]) => [sentiment, count.toString()]),
      ["", ""],
      ["Analysis Methods", ""],
      ...Object.entries(data.sentimentInsights.methodDistribution).map(([method, count]) => [
        method.charAt(0).toUpperCase() + method.slice(1),
        count.toString(),
      ]),
      ["", ""],
      ["Top Issues (from low-score reviews)", ""],
      ...data.commonWords.slice(0, 10).map((item) => [item.word, item.count.toString()]),
    ]

    const csvContent = summaryData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `summary-${appId}-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredCount = getFilteredReviews().length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">Filters</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Sentiment Filter</Label>
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiments</SelectItem>
                    <SelectItem value="Positive">Positive Only</SelectItem>
                    <SelectItem value="Negative">Negative Only</SelectItem>
                    <SelectItem value="Neutral">Neutral Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Score Filter</Label>
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="5">5 Stars Only</SelectItem>
                    <SelectItem value="4">4 Stars Only</SelectItem>
                    <SelectItem value="3">3 Stars Only</SelectItem>
                    <SelectItem value="2">2 Stars Only</SelectItem>
                    <SelectItem value="1">1 Star Only</SelectItem>
                    <SelectItem value="4-5">High Scores (4-5)</SelectItem>
                    <SelectItem value="1-2">Low Scores (1-2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Export Fields</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(exportFields).map(([field, checked]) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={checked}
                    onCheckedChange={(checked) => handleFieldChange(field, checked as boolean)}
                  />
                  <Label htmlFor={field} className="text-sm">
                    {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleExportReviews} className="flex-1">
            <FileText className="mr-2 h-4 w-4" />
            Export Reviews ({filteredCount} items)
          </Button>
          <Button onClick={handleExportSummary} variant="outline" className="flex-1 bg-transparent">
            <BarChart className="mr-2 h-4 w-4" />
            Export Summary
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
