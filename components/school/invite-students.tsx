"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"

interface StudentInvite {
  email: string
  name: string
}

export function InviteStudents() {
  const [students, setStudents] = useState<StudentInvite[]>([{ email: "", name: "" }])
  const [isSending, setIsSending] = useState(false)

  const addStudent = () => {
    setStudents([...students, { email: "", name: "" }])
  }

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index))
  }

  const updateStudent = (index: number, field: keyof StudentInvite, value: string) => {
    const updated = [...students]
    updated[index][field] = value
    setStudents(updated)
  }

  const handleSendInvitations = async () => {
    setIsSending(true)
    console.log("[v0] Sending invitations to:", students)

    // TODO: Implement actual invitation sending
    setTimeout(() => {
      setIsSending(false)
      alert(`Successfully sent ${students.length} invitation(s)!`)
      setStudents([{ email: "", name: "" }])
    }, 2000)
  }

  const validStudents = students.filter((s) => s.email && s.name)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Students</CardTitle>
        <CardDescription>
          Send interview invitations to prospective students. Each invitation uses one credit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {students.map((student, index) => (
            <div key={index} className="flex gap-4 items-start p-4 border border-slate-200 rounded-lg">
              <div className="flex-1 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>Student Name</Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="John Doe"
                      value={student.name}
                      onChange={(e) => updateStudent(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`email-${index}`}>Email Address</Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      placeholder="student@email.com"
                      value={student.email}
                      onChange={(e) => updateStudent(index, "email", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {students.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeStudent(index)} className="mt-8">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addStudent} className="w-full bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          Add Another Student
        </Button>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-900">
            <strong>Credits Required:</strong> {validStudents.length} credit(s) will be used to send these invitations.
          </p>
        </div>

        <Button
          onClick={handleSendInvitations}
          disabled={isSending || validStudents.length === 0}
          className="w-full"
          size="lg"
        >
          {isSending ? "Sending..." : `Send ${validStudents.length} Invitation(s)`}
        </Button>
      </CardContent>
    </Card>
  )
}
