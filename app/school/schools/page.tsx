"use client"

import { useEffect, useState, useCallback, type FormEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCurrentUser } from "@/app/actions/auth"
import {
  listSchools,
  createSchool,
  deleteSchool,
  updateSchoolLevel,
  setSchoolCredits,
  type ManagedSchool,
} from "@/app/actions/schools"
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
  const [newSchoolLevel, setNewSchoolLevel] = useState("k12")
  const [isCreatingSchool, setIsCreatingSchool] = useState(false)
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null)
  const [updatingLevelId, setUpdatingLevelId] = useState<string | null>(null)
  const [updatingCreditsId, setUpdatingCreditsId] = useState<string | null>(null)
  const [creditTargets, setCreditTargets] = useState<Record<string, string>>({})
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
      level: newSchoolLevel,
    })

    if (result.success) {
      setNewSchoolName("")
      setNewSchoolCode("")
      setNewSchoolLevel("k12")
      await fetchManagedSchools()
    } else {
      setSchoolActionError(result.error || "Failed to create school")
    }

    setIsCreatingSchool(false)
  }

  const handleChangeLevel = async (schoolId: string, level: string) => {
    setUpdatingLevelId(schoolId)
    setSchoolActionError(null)
    try {
      const result = await updateSchoolLevel(schoolId, level)
      if (result.success) {
        await fetchManagedSchools()
      } else {
        setSchoolActionError(result.error || "Failed to update school level")
      }
    } catch (error) {
      console.error("[Schools] Error updating school level:", error)
      setSchoolActionError(error instanceof Error ? error.message : "Failed to update school level")
    } finally {
      setUpdatingLevelId(null)
    }
  }

  const handleSetCredits = async (schoolId: string) => {
    const rawTarget = creditTargets[schoolId]
    const creditsBalance = Number(rawTarget)

    if (!Number.isInteger(creditsBalance) || creditsBalance < 0) {
      setSchoolActionError("Enter a non-negative whole number of credits")
      return
    }

    setUpdatingCreditsId(schoolId)
    setSchoolActionError(null)
    try {
      const result = await setSchoolCredits(schoolId, creditsBalance)
      if (result.success) {
        setCreditTargets((prev) => ({ ...prev, [schoolId]: "" }))
        await fetchManagedSchools()
      } else {
        setSchoolActionError(result.error || "Failed to save credits")
      }
    } catch (error) {
      console.error("[Schools] Error saving credits:", error)
      setSchoolActionError(error instanceof Error ? error.message : "Failed to save credits")
    } finally {
      setUpdatingCreditsId(null)
    }
  }

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    if (deletingSchoolId) return

    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(
            `Delete "${schoolName}"?\n\n⚠️ WARNING: This will permanently delete:\n- The school account\n- All associated interviews and responses\n- All custom prompts\n\nThis action cannot be undone.`
          )
        : false

    if (!confirmed) return

    setDeletingSchoolId(schoolId)
    setSchoolActionError(null)

    try {
      const result = await deleteSchool(schoolId)

      if (result.success) {
        // 重新获取列表以确保数据同步
        await fetchManagedSchools()
      } else {
        setSchoolActionError(result.error || "Failed to delete school")
      }
    } catch (error) {
      console.error("[Schools] Error deleting school:", error)
      setSchoolActionError(error instanceof Error ? error.message : "Failed to delete school")
    } finally {
      setDeletingSchoolId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-[rgba(0,0,0,0.56)]">Loading...</p>
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
        <h2 className="text-2xl font-bold text-[#1d1d1f]">School Management</h2>
        <p className="text-sm text-[rgba(0,0,0,0.56)] mt-1">
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

          <form onSubmit={handleCreateSchool} className="grid gap-3 md:grid-cols-4">
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
            <Select value={newSchoolLevel} onValueChange={setNewSchoolLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="k12">K-12</SelectItem>
                <SelectItem value="undergraduate">Undergraduate</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isCreatingSchool}>
              {isCreatingSchool ? "Adding..." : "Add School"}
            </Button>
          </form>
          <p className="text-xs text-[rgba(0,0,0,0.48)]">
            School codes must be lowercase letters, numbers, or hyphen. Example: harvard, mit, the-governors-academy.
          </p>
          <p className="text-xs text-[rgba(0,0,0,0.48)]">
            Level controls rating: <strong>Undergraduate</strong> interviews are AI-scored and rated; <strong>K-12</strong> interviews are not scored.
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
            <div className="flex items-center gap-2 text-sm text-[rgba(0,0,0,0.56)] py-8">
              <div className="h-4 w-4 border-b-2 border-purple-600 rounded-full animate-spin" />
              Loading schools...
            </div>
          ) : managedSchools.length === 0 ? (
            <p className="text-sm text-[rgba(0,0,0,0.56)] py-8 text-center">No schools yet. Add one above to get started.</p>
          ) : (
            <div className="space-y-3">
              {managedSchools.map((school) => (
                <div
                  key={school.id}
                  className="space-y-4 p-4 border rounded-lg hover:bg-black/[0.04]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#1d1d1f]">
                        {school.name}{" "}
                        <span className="text-sm font-normal text-[rgba(0,0,0,0.48)]">({school.code})</span>
                      </p>
                      <p className="text-xs text-[rgba(0,0,0,0.48)]">
                        Added {school.created_at ? format(new Date(school.created_at), "MMM dd, yyyy") : "—"}
                      </p>
                    </div>
                    {!school.active && (
                      <span className="self-start px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(190px,0.9fr)_minmax(150px,0.7fr)]">
                    <div className="rounded-md border bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[rgba(0,0,0,0.48)]">Credits</p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="min-w-[90px]">
                          <p className="text-2xl font-semibold text-[#1d1d1f]">{school.credits_balance}</p>
                          <p className="text-xs text-[rgba(0,0,0,0.48)]">available</p>
                        </div>
                        <div className="flex flex-1 items-center gap-2">
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="New total"
                            value={creditTargets[school.id] ?? ""}
                            onChange={(e) =>
                              setCreditTargets((prev) => ({
                                ...prev,
                                [school.id]: e.target.value,
                              }))
                            }
                            className="h-9 min-w-0"
                            disabled={updatingCreditsId === school.id}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetCredits(school.id)}
                            disabled={updatingCreditsId === school.id}
                          >
                            {updatingCreditsId === school.id ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-[rgba(0,0,0,0.48)]">
                        Set the total available credits for this school.
                      </p>
                    </div>

                    <div className="rounded-md border bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[rgba(0,0,0,0.48)]">Level</p>
                      <Select
                        value={school.level}
                        onValueChange={(value) => handleChangeLevel(school.id, value)}
                        disabled={updatingLevelId === school.id}
                      >
                        <SelectTrigger className="mt-2 h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="k12">K-12</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-md border border-red-100 bg-red-50/40 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-red-700">Danger zone</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSchool(school.id, school.name)}
                        disabled={deletingSchoolId === school.id}
                        className="mt-2 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingSchoolId === school.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
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

