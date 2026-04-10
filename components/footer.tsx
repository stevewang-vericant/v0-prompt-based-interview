"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null)

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="bg-[#f5f5f7] border-t border-black/[0.06] w-full">
      <div className="lg:pl-64">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8 max-w-4xl mx-auto">
            {/* Need help section */}
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4 tracking-tight">
                Need help or have questions?
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="https://calendly.com/brandon_woods_vericant/meet_brandon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#0066cc] hover:text-[#0066cc]/80 transition-colors inline-flex items-center tracking-tight"
                  >
                    Book time with Brandon (Calendly) &rsaquo;
                  </Link>
                </li>
                <li>
                  <Link
                    href="mailto:info@vericant.com"
                    className="text-sm text-[#0066cc] hover:text-[#0066cc]/80 transition-colors inline-flex items-center tracking-tight"
                  >
                    Contact Support at info@vericant.com &rsaquo;
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick links section */}
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4 tracking-tight">
                Quick links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="https://www.vericant.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#0066cc] hover:text-[#0066cc]/80 transition-colors tracking-tight"
                  >
                    Website &rsaquo;
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.vericant.com/knowledge-base/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#0066cc] hover:text-[#0066cc]/80 transition-colors tracking-tight"
                  >
                    FAQ &rsaquo;
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="pt-5 pb-4 border-t border-black/[0.06] w-full">
        <p className="text-xs text-[rgba(0,0,0,0.36)] text-center tracking-tight" suppressHydrationWarning>
          Copyright &copy; {currentYear || new Date().getFullYear()} Vericant. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
