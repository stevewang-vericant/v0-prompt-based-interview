import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Users, Award, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 text-balance">
            Prompt-Based Interview Platform
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 text-pretty">
            Streamlined video interview assessments for undergraduate admissions. Evaluate critical thinking, fluency,
            and communication skills efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-lg">
              <Link href="/school/login">School Portal</Link>
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Students: Access your interview through the link provided by your school
          </p>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Video className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Video Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                3-5 minute structured video interviews with timed prompts for consistent evaluation
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Easy Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Simple credit-based system to invite and track student interview progress
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Award className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>AI + Human Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive assessment of fluency, coherence, vocabulary, grammar, and pronunciation
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Quick & Affordable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Under $49 per interview with results delivered within 48 hours</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Join leading institutions using our platform for undergraduate admissions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg">
              <Link href="/school/register">Register Your School</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
