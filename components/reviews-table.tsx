"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Star, ThumbsUp, Play } from "lucide-react"

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

interface ReviewsTableProps {
  reviews: Review[]
}

const ITEMS_PER_PAGE = 10

export function ReviewsTable({ reviews }: ReviewsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE)

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentReviews = reviews.slice(startIndex, endIndex)

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Negative":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "text":
        return "💬"
      case "rating":
        return "⭐"
      case "combined":
        return "🧠"
      default:
        return "📊"
    }
  }

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  const getSourceIcon = (source: "googleplay" | "youtube") => {
    return source === "youtube" ? (
      <Play className="h-4 w-4 text-red-500" />
    ) : (
      <Star className="h-4 w-4 text-green-500" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentReviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.userImage || "/placeholder.svg"} alt={review.userName} />
                    <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{review.userName}</p>
                      <div
                        className="flex items-center space-x-1"
                        title={review.source === "youtube" ? "YouTube Comment" : "Google Play Review"}
                      >
                        {getSourceIcon(review.source)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSentimentColor(review.sentiment)}>{review.sentiment}</Badge>
                  {review.source === "googleplay" && review.score > 0 && (
                    <div className="flex items-center space-x-1">{renderStars(review.score)}</div>
                  )}
                </div>
              </div>

              <p className="text-sm leading-relaxed">{review.text}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{review.thumbsUp}</span>
                  </div>
                  {review.version && review.source === "googleplay" && <span>Version: {review.version}</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <span title={`Analysis method: ${review.sentimentMethod}`}>
                    {getMethodIcon(review.sentimentMethod)}
                  </span>
                  <span title={`Confidence: ${(review.sentimentConfidence * 100).toFixed(1)}%`}>
                    {(review.sentimentConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, reviews.length)} of {reviews.length}{" "}
              {reviews[0]?.source === "youtube" ? "comments" : "reviews"}
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
