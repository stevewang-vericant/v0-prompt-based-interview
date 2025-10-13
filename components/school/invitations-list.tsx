"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ExternalLink } from "lucide-react"

interface Invitation {
  id: string
  studentName: string
  studentEmail: string
  status: "pending" | "registered" | "completed" | "expired"
  sentDate: string
  completedDate?: string
}

// Mock data
const mockInvitations: Invitation[] = [
  {
    id: "1",
    studentName: "Alice Johnson",
    studentEmail: "alice.j@email.com",
    status: "completed",
    sentDate: "2025-01-05",
    completedDate: "2025-01-08",
  },
  {
    id: "2",
    studentName: "Bob Smith",
    studentEmail: "bob.smith@email.com",
    status: "registered",
    sentDate: "2025-01-10",
  },
  {
    id: "3",
    studentName: "Carol White",
    studentEmail: "carol.w@email.com",
    status: "pending",
    sentDate: "2025-01-12",
  },
  {
    id: "4",
    studentName: "David Brown",
    studentEmail: "david.b@email.com",
    status: "completed",
    sentDate: "2025-01-03",
    completedDate: "2025-01-06",
  },
]

export function InvitationsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [invitations] = useState<Invitation[]>(mockInvitations)

  const filteredInvitations = invitations.filter(
    (inv) =>
      inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadge = (status: Invitation["status"]) => {
    const variants = {
      pending: "secondary",
      registered: "default",
      completed: "default",
      expired: "destructive",
    } as const

    const labels = {
      pending: "Pending",
      registered: "Registered",
      completed: "Completed",
      expired: "Expired",
    }

    return (
      <Badge
        variant={variants[status]}
        className={status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
      >
        {labels[status]}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Invitations</CardTitle>
        <CardDescription>Track and manage all student interview invitations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No invitations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.studentName}</TableCell>
                    <TableCell>{invitation.studentEmail}</TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell>{new Date(invitation.sentDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {invitation.completedDate ? new Date(invitation.completedDate).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {invitation.status === "completed" && (
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Results
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredInvitations.length} of {invitations.length} invitations
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
