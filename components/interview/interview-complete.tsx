"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Award } from "lucide-react"

interface InterviewCompleteProps {
  responsesCount: number
  onSubmit: () => void
}

export function InterviewComplete({ responsesCount, onSubmit }: InterviewCompleteProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await onSubmit()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900">Interview Complete!</h2>
              <p className="text-green-700">You've successfully recorded all {responsesCount} responses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
          <CardDescription>Your interview will be reviewed and scored</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Verification Process</p>
              <p className="text-sm text-muted-foreground">
                Your identity and responses will be verified by our operations team to ensure authenticity
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">AI + Human Scoring</p>
              <p className="text-sm text-muted-foreground">
                Your responses will be evaluated for fluency, coherence, vocabulary, grammar, and pronunciation
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Results Delivery</p>
              <p className="text-sm text-muted-foreground">
                Your scores will be delivered to your school within 48 hours. You'll receive an email notification when
                complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? "Submitting Interview..." : "Submit Interview"}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            By submitting, you confirm that all responses are your own work and were completed without assistance
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
