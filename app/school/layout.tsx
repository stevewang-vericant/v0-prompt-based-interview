"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getCurrentUser, signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Building2, Video, Settings, LogOut, Menu, X } from "lucide-react"
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

  // 如果是登录或注册页面，不需要检查认证
  const isAuthPage = pathname === "/school/login" || pathname === "/school/register"

  useEffect(() => {
    // 如果是登录或注册页面，直接返回，不检查认证
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

  const navigation = [
    {
      name: "Interviews",
      href: "/school/dashboard",
      icon: Video,
    },
    {
      name: "Settings",
      href: "/school/settings",
      icon: Settings,
    },
  ]

  // 如果是登录或注册页面，直接渲染 children，不需要 sidebar
  if (isAuthPage) {
    return <>{children}</>
  }

  // 如果还没有加载用户信息，显示加载状态
  if (!schoolInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-600" />
          <span className="font-semibold text-slate-900">{schoolInfo.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          pt-16 lg:pt-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/School Name */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-slate-600" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{schoolInfo.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-slate-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-slate-900"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {loggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {pathname === "/school/dashboard" ? "Interviews" : "Settings"}
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  )
}

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-2 text-sm text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SchoolLayoutContent>{children}</SchoolLayoutContent>
    </Suspense>
  )
}

