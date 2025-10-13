"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InterviewSetup } from "@/components/interview/interview-setup"
import { InterviewPrompt } from "@/components/interview/interview-prompt"
import { InterviewComplete } from "@/components/interview/interview-complete"

interface Prompt {
  id: string
  category: string
  text: string
  preparationTime: number
  responseTime: number
}

// Mock prompts data
const mockPrompts: Prompt[] = [
  {
    id: "1",
    category: "Conversational Fluency",
    text: "Tell me about your favorite hobby and why you enjoy it.",
    preparationTime: 30,
    responseTime: 90,
  },
  {
    id: "2",
    category: "Critical Thinking",
    text: "Describe a time when you had to solve a complex problem. What approach did you take and what was the outcome?",
    preparationTime: 30,
    responseTime: 90,
  },
  {
    id: "3",
    category: "General Knowledge",
    text: "What do you think is the most important global challenge facing our generation?",
    preparationTime: 30,
    responseTime: 90,
  },
]

type InterviewStage = "setup" | "interview" | "complete"

export default function InterviewPage() {
  const [stage, setStage] = useState<InterviewStage>("setup")
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, Blob>>({})

  const handleSetupComplete = () => {
    setStage("interview")
  }

  const handlePromptComplete = (promptId: string, videoBlob: Blob) => {
    setResponses((prev) => ({ ...prev, [promptId]: videoBlob }))

    if (currentPromptIndex < mockPrompts.length - 1) {
      setCurrentPromptIndex((prev) => prev + 1)
    } else {
      setStage("complete")
    }
  }

  const handleSubmitInterview = async () => {
    console.log("[v0] Submitting interview with", Object.keys(responses).length, "responses")
    // TODO: Upload videos and submit interview
    setTimeout(() => {
      alert("Interview submitted successfully!")
      window.location.href = "/student/dashboard"
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Video Interview Assessment</h1>
              <p className="text-sm text-slate-600">
                {stage === "setup" && "System check and preparation"}
                {stage === "interview" && `Question ${currentPromptIndex + 1} of ${mockPrompts.length}`}
                {stage === "complete" && "Interview completed"}
              </p>
            </div>
            {stage === "setup" && (
              <Button variant="outline" onClick={() => (window.location.href = "/student/dashboard")}>
                Exit
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stage === "setup" && <InterviewSetup onComplete={handleSetupComplete} />}

        {stage === "interview" && (
          <InterviewPrompt
            prompt={mockPrompts[currentPromptIndex]}
            promptNumber={currentPromptIndex + 1}
            totalPrompts={mockPrompts.length}
            onComplete={handlePromptComplete}
          />
        )}

        {stage === "complete" && (
          <InterviewComplete responsesCount={Object.keys(responses).length} onSubmit={handleSubmitInterview} />
        )}
      </main>
    </div>
  )
}
