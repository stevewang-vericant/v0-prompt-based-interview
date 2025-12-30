"use client"

import { useEffect, useState, useCallback, type FormEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { getCurrentUser } from "@/app/actions/auth"
import { listSchools, createSchool, deleteSchool, type ManagedSchool } from "@/app/actions/schools"
import { AlertCircle, PlusCircle, Trash2 } from "lucide-react"
import { format } from "date-fns"

export default function SchoolsPage() {
  const [schoolInfo, setSchoolInfo] = useState<{
    code: string | null
    name: string
    is_super_admin: boolean
  } | null>(null)
  const [managedSchools, setManagedSchools] = useState<ManagedSchool[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)
  const [schoolActionError, setSchoolActionError] = useState<string | null>(null)
  const [newSchoolName, setNewSchoolName] = useState("")
  const [newSchoolCode, setNewSchoolCode] = useState("")
  const [isCreatingSchool, setIsCreatingSchool] = useState(false)
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserAndSchool = async () => {
    try {
      const result = await getCurrentUser()
      if (result.success && result.user) {
        setSchoolInfo(result.user.school)
        return result.user.school
      } else {
        window.location.href = "/school/login"
        return null
      }
    } catch (err) {
      console.error("[Schools] Error loading user:", err)
      return null
    }
  }

  const fetchManagedSchools = useCallback(async () => {
    if (!schoolInfo?.is_super_admin) return
    setSchoolsLoading(true)
    setSchoolActionError(null)
    const result = await listSchools()
    if (result.success && result.schools) {
      setManagedSchools(result.schools)
    } else {
      setSchoolActionError(result.error || "Failed to load schools")
    }
    setSchoolsLoading(false)
  }, [schoolInfo?.is_super_admin])

  useEffect(() => {
    const init = async () => {
      const school = await loadUserAndSchool()
      if (school?.is_super_admin) {
        await fetchManagedSchools()
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (schoolInfo?.is_super_admin) {
      fetchManagedSchools()
    }
  }, [schoolInfo?.is_super_admin, fetchManagedSchools])

  const handleCreateSchool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newSchoolName.trim() || !newSchoolCode.trim()) {
      setSchoolActionError("School name and code are required")
      return
    }

    setIsCreatingSchool(true)
    setSchoolActionError(null)

    const result = await createSchool({
      name: newSchoolName,
      code: newSchoolCode,
    })

    if (result.success) {
      setNewSchoolName("")
      setNewSchoolCode("")
      await fetchManagedSchools()
    } else {
      setSchoolActionError(result.error || "Failed to create school")
    }

    setIsCreatingSchool(false)
  }

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    if (deletingSchoolId) return

    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(
            `Delete "${schoolName}"?\nThis action requires removing all associated interviews first and cannot be undone.`
          )
        : false

    if (!confirmed) return

    setDeletingSchoolId(schoolId)
    setSchoolActionError(null)

    const result = await deleteSchool(schoolId)

    if (result.success) {
      setManagedSchools((prev) => prev.filter((school) => school.id !== schoolId))
    } else {
      setSchoolActionError(result.error || "Failed to delete school")
    }

    setDeletingSchoolId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!schoolInfo?.is_super_admin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only super administrators can access this page.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">School Management</h2>
        <p className="text-sm text-slate-600 mt-1">
          Manage all schools in the system. Add new schools or remove existing ones.
        </p>
      </div>

      {/* Add School Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-purple-600" />
            Add New School
          </CardTitle>
          <CardDescription>Create a new school account in the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schoolActionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{schoolActionError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateSchool} className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="School Name (e.g. MIT)"
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              required
            />
            <Input
              placeholder="School Code (e.g. mit)"
              value={newSchoolCode}
              onChange={(e) => setNewSchoolCode(e.target.value)}
              required
            />
            <Button type="submit" disabled={isCreatingSchool}>
              {isCreatingSchool ? "Adding..." : "Add School"}
            </Button>
          </form>
          <p className="text-xs text-slate-500">
            School codes must be lowercase letters, numbers, or hyphen. Example: harvard, mit, the-governors-academy.
          </p>
        </CardContent>
      </Card>

      {/* Schools List */}
      <Card>
        <CardHeader>
          <CardTitle>All Schools</CardTitle>
          <CardDescription>
            {schoolsLoading 
              ? "Loading schools..." 
              : `${managedSchools.length} school${managedSchools.length !== 1 ? 's' : ''} in the system`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schoolsLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 py-8">
              <div className="h-4 w-4 border-b-2 border-purple-600 rounded-full animate-spin" />
              Loading schools...
            </div>
          ) : managedSchools.length === 0 ? (
            <p className="text-sm text-slate-600 py-8 text-center">No schools yet. Add one above to get started.</p>
          ) : (
            <div className="space-y-3">
              {managedSchools.map((school) => (
                <div
                  key={school.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border rounded-lg hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {school.name}{" "}
                      <span className="text-sm font-normal text-slate-500">({school.code})</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Added {school.created_at ? format(new Date(school.created_at), "MMM dd, yyyy") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!school.active && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Inactive</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSchool(school.id, school.name)}
                      disabled={deletingSchoolId === school.id}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deletingSchoolId === school.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

