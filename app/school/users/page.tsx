"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser } from "@/app/actions/auth"
import { 
  listUsers, 
  activateUser, 
  deactivateUser, 
  deleteUser, 
  resetUserPassword,
  type ManagedUser 
} from "@/app/actions/users"
import { AlertCircle, CheckCircle2, Trash2, UserCheck, UserX, KeyRound, Loader2 } from "lucide-react"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function UsersPage() {
  const [schoolInfo, setSchoolInfo] = useState<{
    code: string | null
    name: string
    is_super_admin: boolean
  } | null>(null)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [resettingPassword, setResettingPassword] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadUserAndUsers = async () => {
    try {
      const result = await getCurrentUser()
      if (result.success && result.user) {
        setSchoolInfo(result.user.school)
        if (result.user.school.is_super_admin) {
          await fetchUsers()
        } else {
          setError("Access denied")
        }
      } else {
        window.location.href = "/school/login"
        return
      }
    } catch (err) {
      console.error("[Users] Error loading user:", err)
      setError("Failed to load user information")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setError(null)
      const result = await listUsers()
      if (result.success && result.users) {
        setUsers(result.users)
      } else {
        setError(result.error || "Failed to load users")
      }
    } catch (err) {
      console.error("[Users] Error loading users:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  useEffect(() => {
    loadUserAndUsers()
  }, [])

  const handleActivate = async (userId: string) => {
    setActionLoading(userId)
    setError(null)
    setSuccess(null)
    
    try {
      const result = await activateUser(userId)
      if (result.success) {
        setSuccess("User activated successfully")
        await fetchUsers()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || "Failed to activate user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivate = async (userId: string) => {
    setActionLoading(userId)
    setError(null)
    setSuccess(null)
    
    try {
      const result = await deactivateUser(userId)
      if (result.success) {
        setSuccess("User deactivated successfully")
        await fetchUsers()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || "Failed to deactivate user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteClick = (user: ManagedUser) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return
    
    setActionLoading(selectedUser.id)
    setError(null)
    setSuccess(null)
    setDeleteDialogOpen(false)
    
    try {
      const result = await deleteUser(selectedUser.id)
      if (result.success) {
        setSuccess("User deleted successfully")
        await fetchUsers()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || "Failed to delete user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setActionLoading(null)
      setSelectedUser(null)
    }
  }

  const handleResetPasswordClick = (user: ManagedUser) => {
    setSelectedUser(user)
    setNewPassword("")
    setResetPasswordDialogOpen(true)
  }

  const handleResetPasswordConfirm = async () => {
    if (!selectedUser || !newPassword.trim()) {
      setError("Please enter a new password")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setResettingPassword(true)
    setError(null)
    
    try {
      const result = await resetUserPassword(selectedUser.id, newPassword)
      if (result.success) {
        setSuccess("Password reset successfully")
        setResetPasswordDialogOpen(false)
        setSelectedUser(null)
        setNewPassword("")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || "Failed to reset password")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setResettingPassword(false)
    }
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

  const inactiveUsers = users.filter(u => !u.active)
  const activeUsers = users.filter(u => u.active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <p className="text-sm text-slate-600 mt-1">
          Manage all school user accounts. Activate new registrations and manage existing users.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Pending Approvals */}
      {inactiveUsers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Pending Approvals ({inactiveUsers.length})
            </CardTitle>
            <CardDescription>
              New user registrations waiting for activation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border border-amber-200 rounded-lg bg-white"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {user.name}
                      {user.code && (
                        <span className="text-sm font-normal text-slate-500 ml-2">({user.code})</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    {user.contact_person && (
                      <p className="text-xs text-slate-500">Contact: {user.contact_person}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Registered {user.created_at ? format(new Date(user.created_at), "MMM dd, yyyy HH:mm") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleActivate(user.id)}
                      disabled={actionLoading === user.id}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4 mr-2" />
                      )}
                      Activate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {loading 
              ? "Loading users..." 
              : `${users.length} user${users.length !== 1 ? 's' : ''} total (${activeUsers.length} active, ${inactiveUsers.length} inactive)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 py-8">
              <div className="h-4 w-4 border-b-2 border-purple-600 rounded-full animate-spin" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-600 py-8 text-center">No users found.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {user.name}
                        {user.code && (
                          <span className="text-sm font-normal text-slate-500 ml-2">({user.code})</span>
                        )}
                      </p>
                      {user.is_super_admin && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">Super Admin</span>
                      )}
                      {!user.active && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    {user.contact_person && (
                      <p className="text-xs text-slate-500">Contact: {user.contact_person}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Created {user.created_at ? format(new Date(user.created_at), "MMM dd, yyyy") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!user.is_super_admin && (
                      <>
                        {user.active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivate(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <UserX className="h-4 w-4 mr-2" />
                            )}
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleActivate(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4 mr-2" />
                            )}
                            Activate
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPasswordClick(user)}
                          disabled={actionLoading === user.id}
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Reset Password
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedUser?.name}" ({selectedUser?.email})?
              <br />
              <br />
              This action will permanently delete the user account and all associated data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Reset password for "{selectedUser?.name}" ({selectedUser?.email})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                disabled={resettingPassword}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resettingPassword}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPasswordConfirm}
              disabled={resettingPassword || !newPassword.trim()}
            >
              {resettingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

