"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { getCurrentUser, signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Building2, Video, Settings, LogOut, Menu, X, Users } from "lucide-react"
import Link from "next/link"

function SchoolLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [schoolInfo, setSchoolInfo] = useState<{
    code: string | null
    name: string
    is_super_admin: boolean
  } | null>(null)
  const [currentUser, setCurrentUser] = useState<{
    email: string
  } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const isAuthPage = pathname === "/school/login" || 
                     pathname === "/school/register" || 
                     pathname === "/school/forgot-password" || 
                     pathname === "/school/reset-password"

  useEffect(() => {
    if (isAuthPage) {
      return
    }

    const loadUser = async () => {
      const result = await getCurrentUser()
      if (result.success && result.user) {
        setCurrentUser({ email: result.user.email })
        setSchoolInfo(result.user.school)
      } else {
        router.push("/school/login")
      }
    }
    loadUser()
  }, [router, isAuthPage])

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
    router.push("/school/login")
  }

  const navigation = schoolInfo
    ? [
        {
          name: "Interviews",
          href: "/school/dashboard",
          icon: Video,
        },
        ...(schoolInfo.is_super_admin
          ? [
              {
                name: "Schools",
                href: "/school/schools",
                icon: Building2,
              },
              {
                name: "Users",
                href: "/school/users",
                icon: Users,
              },
            ]
          : []),
        {
          name: "Settings",
          href: "/school/settings",
          icon: Settings,
        },
      ]
    : []

  if (isAuthPage) {
    return <>{children}</>
  }

  if (!schoolInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-[rgba(0,0,0,0.48)] tracking-tight">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f5f5f7]">
      {/* Mobile top bar — frosted glass */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl backdrop-saturate-[180%] border-b border-black/[0.08] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/RGB Logo Verified Video Interviews.png"
            alt="Vericant Logo"
            width={105}
            height={20}
            className="h-5 w-auto"
            priority
          />
          <span className="font-semibold text-[#1d1d1f] ml-2 tracking-tight">{schoolInfo.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-xl backdrop-saturate-[180%] border-r border-black/[0.06] transform transition-transform duration-300 ease-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          pt-16 lg:pt-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo / School Name */}
          <div className="px-6 py-5 border-b border-black/[0.06]">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <Image
                  src="/RGB Logo Verified Video Interviews.png"
                  alt="Vericant Logo"
                  width={210}
                  height={40}
                  className="h-auto max-w-full"
                  priority
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#f5f5f7]">
                  <Building2 className="h-4 w-4 text-[rgba(0,0,0,0.56)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1d1d1f] truncate text-sm tracking-tight">{schoolInfo.name}</p>
                  <p className="text-xs text-[rgba(0,0,0,0.48)] truncate tracking-tight">{currentUser?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all tracking-tight
                    ${
                      isActive
                        ? "bg-[#0071e3]/10 text-[#0071e3]"
                        : "text-[rgba(0,0,0,0.64)] hover:bg-black/[0.04] hover:text-[#1d1d1f]"
                    }
                  `}
                >
                  <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-[#0071e3]' : ''}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-black/[0.06]">
            <Button
              variant="ghost"
              className="w-full justify-start text-[rgba(0,0,0,0.56)] hover:text-[#1d1d1f] rounded-xl"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="h-[18px] w-[18px] mr-3" />
              {loggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar — frosted glass header */}
        {pathname !== "/school/watch" && (
          <header className="bg-white/80 backdrop-blur-xl backdrop-saturate-[180%] border-b border-black/[0.06] sticky top-0 z-20">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
                    {pathname === "/school/dashboard"
                      ? "Vericant Prompt Interviews"
                      : pathname === "/school/settings"
                        ? "Settings"
                        : pathname === "/school/users"
                          ? "Users"
                          : pathname === "/school/schools"
                            ? "Schools"
                            : ""}
                  </h1>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className={pathname === "/school/watch" ? "" : "px-4 sm:px-6 lg:px-8 py-8"}>{children}</main>
      </div>
    </div>
  )
}

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
            <p className="mt-3 text-sm text-[rgba(0,0,0,0.48)] tracking-tight">Loading...</p>
          </div>
        </div>
      }
    >
      <SchoolLayoutContent>{children}</SchoolLayoutContent>
    </Suspense>
  )
}
