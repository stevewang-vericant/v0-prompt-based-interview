import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Video, Users, Award, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section — Apple-style cinematic */}
      <section className="bg-white">
        <div className="container mx-auto px-4 pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/RGB Logo Verified Video Interviews.png"
                alt="Vericant Logo"
                width={420}
                height={80}
                className="h-auto max-w-full"
                priority
              />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-[1.07]">
              Prompt-Based Interview Platform
            </h1>
            <p className="text-lg sm:text-xl text-[rgba(0,0,0,0.56)] leading-relaxed tracking-tight max-w-2xl mx-auto">
              School customized video interviews plus AI summaries. Trusted by top universities and K-12 programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg">
                <Link href="/school/login">School Portal</Link>
              </Button>
              <Button asChild size="lg" variant="apple_pill">
                <Link href="/school/register">Register Your School</Link>
              </Button>
            </div>
            <p className="text-sm text-[rgba(0,0,0,0.36)] mt-4 tracking-tight">
              Students: Access your interview through the link provided by your school
            </p>
          </div>
        </div>
      </section>

      {/* Features Section — Apple-style alternating background */}
      <section className="bg-[#f5f5f7]">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-[40px] font-semibold text-[#1d1d1f] text-center tracking-tight leading-[1.1] mb-12 sm:mb-16">
            Everything you need.
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Video className="h-8 w-8 text-[#0071e3]" />}
              title="Video Interviews"
              description="Up to 6 minutes of structured video interviews with timed prompts"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-[#0071e3]" />}
              title="Easy Management"
              description="Simple credit-based system to invite and track student interview progress"
            />
            <FeatureCard
              icon={<Award className="h-8 w-8 text-[#0071e3]" />}
              title="AI Transcripts and Summaries"
              description="A full transcript and detailed summary of an applicant's responses, allowing you to quickly focus on the most important information."
            />
            <FeatureCard
              icon={<Clock className="h-8 w-8 text-[#0071e3]" />}
              title="Quick & Affordable"
              description="Tiered, industry-leading pricing with results delivered immediately."
            />
          </div>
        </div>
      </section>

      {/* CTA Section — Apple-style dark section */}
      <section className="bg-[#1d1d1f]">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-[40px] font-semibold text-white tracking-tight leading-[1.1]">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-[rgba(255,255,255,0.64)] leading-relaxed tracking-tight">
              Join leading institutions using our platform for undergraduate admissions
            </p>
            <div className="pt-4">
              <Button asChild size="lg" className="bg-white text-[#1d1d1f] hover:bg-white/90 active:bg-white/80">
                <Link href="/school/register">Register Your School</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_3px_30px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_3px_30px_rgba(0,0,0,0.1)]">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-[rgba(0,0,0,0.56)] leading-relaxed tracking-tight">{description}</p>
    </div>
  )
}
