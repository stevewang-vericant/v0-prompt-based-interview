"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null)

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 border-t border-slate-200 w-full">
      <div className="lg:pl-64">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8 max-w-4xl mx-auto">
            {/* Need help section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Need help or have questions?
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="https://calendly.com/brandon_woods_vericant/meet_brandon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center"
                  >
                    → Book time with Brandon (Calendly)
                  </Link>
                </li>
                <li>
                  <Link
                    href="mailto:info@vericant.com"
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center"
                  >
                    → Contact Support at info@vericant.com
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick links section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Quick links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="https://www.vericant.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Website
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.vericant.com/knowledge-base/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright - positioned relative to full page width */}
      <div className="pt-6 pb-4 border-t border-slate-200 w-full">
        <p className="text-sm text-slate-500 text-center" suppressHydrationWarning>
          © {currentYear || new Date().getFullYear()} Vericant. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

