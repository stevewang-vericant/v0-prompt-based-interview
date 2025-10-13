"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditBalance } from "@/components/school/credit-balance"
import { PurchaseCredits } from "@/components/school/purchase-credits"
import { InviteStudents } from "@/components/school/invite-students"
import { InvitationsList } from "@/components/school/invitations-list"
import { CreditCard as CreditCircle, Users, Send, BarChart3 } from "lucide-react"

export default function SchoolDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">School Dashboard</h1>
              <p className="text-sm text-slate-600">Manage your interview credits and student invitations</p>
            </div>
            <Button variant="outline" onClick={() => (window.location.href = "/school/login")}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2">
              <CreditCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Credits</span>
            </TabsTrigger>
            <TabsTrigger value="invite" className="gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Invite</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                  <CreditCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">247</div>
                  <p className="text-xs text-muted-foreground">$49 per credit</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invitations Sent</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground">+12 this week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Interviews</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">67</div>
                  <p className="text-xs text-muted-foreground">75% completion rate</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks to manage your interview program</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button onClick={() => setActiveTab("credits")}>Purchase Credits</Button>
                <Button variant="outline" onClick={() => setActiveTab("invite")}>
                  Invite Students
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("students")}>
                  View All Students
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="space-y-6">
            <CreditBalance balance={247} />
            <PurchaseCredits />
          </TabsContent>

          <TabsContent value="invite" className="space-y-6">
            <InviteStudents />
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <InvitationsList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
