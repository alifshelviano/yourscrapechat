"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, Star, MessageSquare } from "lucide-react"

interface SentimentInsightsProps {
  sentimentDistribution: Record<string, number>
  sentimentInsights: {
    averageConfidence: number
    methodDistribution: {
      rating: number
      text: number
      combined: number
    }
  }
  totalReviews: number
}

export function SentimentInsights({ sentimentDistribution, sentimentInsights, totalReviews }: SentimentInsightsProps) {
  const getPercentage = (count: number) => ((count / totalReviews) * 100).toFixed(1)

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "text-green-600 dark:text-green-400"
      case "Negative":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-yellow-600 dark:text-yellow-400"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sentiment Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(sentimentDistribution).map(([sentiment, count]) => (
            <div key={sentiment} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`font-medium ${getSentimentColor(sentiment)}`}>{sentiment}</span>
                <Badge variant="outline">
                  {count} ({getPercentage(count)}%)
                </Badge>
              </div>
              <Progress value={(count / totalReviews) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analysis Quality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Confidence</span>
              <Badge variant="outline">{(sentimentInsights.averageConfidence * 100).toFixed(1)}%</Badge>
            </div>
            <Progress value={sentimentInsights.averageConfidence * 100} className="h-2" />
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-medium text-muted-foreground">Analysis Methods</h4>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Rating-based</span>
              </div>
              <span className="text-sm text-muted-foreground">{sentimentInsights.methodDistribution.rating}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Text-based</span>
              </div>
              <span className="text-sm text-muted-foreground">{sentimentInsights.methodDistribution.text}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Combined</span>
              </div>
              <span className="text-sm text-muted-foreground">{sentimentInsights.methodDistribution.combined}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
