"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface WordFrequencyChartProps {
  data: { word: string; count: number }[]
}

export function WordFrequencyChart({ data }: WordFrequencyChartProps) {
  const chartData = {
    labels: data.slice(0, 10).map((item) => item.word),
    datasets: [
      {
        label: "Frequency",
        data: data.slice(0, 10).map((item) => item.count),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
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
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Common Issues in Low-Score Reviews</CardTitle>
        <div className="text-sm text-muted-foreground">
          Most frequent words in 1-2 star reviews (after removing stopwords)
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data.length > 0 ? (
            <Bar data={chartData} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No low-score reviews found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
