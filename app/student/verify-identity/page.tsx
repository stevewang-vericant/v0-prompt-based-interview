"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, CheckCircle2, AlertCircle } from "lucide-react"

export default function VerifyIdentityPage() {
  const [step, setStep] = useState<"upload" | "selfie" | "review">("upload")
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [selfieImage, setSelfieImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdDocument(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIdPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      console.error("[v0] Camera access error:", err)
      alert("Unable to access camera. Please check your permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      setIsCameraActive(false)
    }
  }

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const imageData = canvasRef.current.toDataURL("image/jpeg")
        setSelfieImage(imageData)
        stopCamera()
      }
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    console.log("[v0] Submitting identity verification:", { idDocument: idDocument?.name, hasSelfie: !!selfieImage })

    // TODO: Implement actual file upload and verification submission
    setTimeout(() => {
      setIsSubmitting(false)
      alert("Identity verification submitted successfully!")
      window.location.href = "/student/dashboard"
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Identity Verification</h1>
              <p className="text-sm text-slate-600">Verify your identity to proceed with the interview</p>
            </div>
            <Button variant="outline" onClick={() => (window.location.href = "/student/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "upload" ? "bg-blue-600 text-white" : idPreview ? "bg-green-600 text-white" : "bg-slate-200"
                }`}
              >
                {idPreview ? <CheckCircle2 className="h-5 w-5" /> : "1"}
              </div>
              <span className="text-sm font-medium">Upload ID</span>
            </div>
            <div className="w-16 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "selfie"
                    ? "bg-blue-600 text-white"
                    : selfieImage
                      ? "bg-green-600 text-white"
                      : "bg-slate-200"
                }`}
              >
                {selfieImage ? <CheckCircle2 className="h-5 w-5" /> : "2"}
              </div>
              <span className="text-sm font-medium">Take Selfie</span>
            </div>
            <div className="w-16 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "review" ? "bg-blue-600 text-white" : "bg-slate-200"
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Review & Submit</span>
            </div>
          </div>
        </div>

        {/* Step 1: Upload ID Document */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload ID Document</CardTitle>
              <CardDescription>
                Please upload a clear photo of your government-issued ID (passport, driver's license, or national ID
                card)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ensure your document is clearly visible, well-lit, and all text is readable. Accepted formats: JPG,
                  PNG, PDF
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!idPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-sm font-medium text-slate-700 mb-1">Click to upload your ID document</p>
                    <p className="text-xs text-slate-500">or drag and drop</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border border-slate-200">
                      <img src={idPreview || "/placeholder.svg"} alt="ID Document Preview" className="w-full h-auto" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                        Change Document
                      </Button>
                      <Button onClick={() => setStep("selfie")} className="flex-1">
                        Continue to Selfie
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Take Selfie */}
        {step === "selfie" && (
          <Card>
            <CardHeader>
              <CardTitle>Take a Selfie</CardTitle>
              <CardDescription>
                Take a clear photo of yourself to verify your identity matches the ID document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Look directly at the camera and ensure your face is clearly visible and well-lit. Remove any
                  sunglasses or hats.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {!selfieImage ? (
                  <>
                    {!isCameraActive ? (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
                        <Camera className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                        <p className="text-sm font-medium text-slate-700 mb-4">Ready to take your selfie?</p>
                        <Button onClick={startCamera}>
                          <Camera className="h-4 w-4 mr-2" />
                          Start Camera
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={stopCamera} className="flex-1 bg-transparent">
                            Cancel
                          </Button>
                          <Button onClick={captureSelfie} className="flex-1">
                            <Camera className="h-4 w-4 mr-2" />
                            Capture Photo
                          </Button>
                        </div>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border border-slate-200">
                      <img src={selfieImage || "/placeholder.svg"} alt="Selfie Preview" className="w-full h-auto" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelfieImage(null)
                          startCamera()
                        }}
                        className="flex-1"
                      >
                        Retake Photo
                      </Button>
                      <Button onClick={() => setStep("review")} className="flex-1">
                        Continue to Review
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Submit */}
        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Submission</CardTitle>
              <CardDescription>Please review your documents before submitting for verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>ID Document</Label>
                  <div className="relative rounded-lg overflow-hidden border border-slate-200">
                    {idPreview && (
                      <img src={idPreview || "/placeholder.svg"} alt="ID Document" className="w-full h-auto" />
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStep("upload")} className="w-full">
                    Change Document
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Selfie Photo</Label>
                  <div className="relative rounded-lg overflow-hidden border border-slate-200">
                    {selfieImage && (
                      <img src={selfieImage || "/placeholder.svg"} alt="Selfie" className="w-full h-auto" />
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStep("selfie")} className="w-full">
                    Retake Photo
                  </Button>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  Your documents will be reviewed by our verification team within 24-48 hours. You'll receive an email
                  notification once verified.
                </AlertDescription>
              </Alert>

              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
