"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface ScoreChartProps {
  data: Record<number, number>
}

export function ScoreChart({ data }: ScoreChartProps) {
  const chartData = {
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [
      {
        label: "Number of Reviews",
        data: [data[1], data[2], data[3], data[4], data[5]],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)", // Red for 1 star
          "rgba(245, 101, 101, 0.8)", // Light red for 2 stars
          "rgba(251, 191, 36, 0.8)", // Yellow for 3 stars
          "rgba(34, 197, 94, 0.8)", // Green for 4 stars
          "rgba(22, 163, 74, 0.8)", // Dark green for 5 stars
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(245, 101, 101, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(22, 163, 74, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const totalReviews = Object.values(data).reduce((sum, count) => sum + count, 0)
  const averageScore =
    totalReviews > 0
      ? Object.entries(data).reduce((sum, [score, count]) => sum + Number(score) * count, 0) / totalReviews
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rating Distribution</CardTitle>
        <div className="text-sm text-muted-foreground">
          Average: {averageScore.toFixed(1)} stars ({totalReviews} total reviews)
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
