"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Save, AlertCircle, CheckCircle2, Trash2, Users } from "lucide-react"
import {
  getSchoolParentPrompts,
  getSelectedParentPromptIds,
  updateSelectedParentPrompts,
  createParentPrompt,
  deleteParentPrompt,
  type ParentPromptRecord,
} from "@/app/actions/parent-prompts"

const MIN_PARENT_PROMPTS = 1
const MAX_PARENT_PROMPTS = 8

export function ParentQuestionsSettings() {
  const [prompts, setPrompts] = useState<ParentPromptRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newPrompt, setNewPrompt] = useState({ category: "", prompt_text: "" })
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const { getCurrentUser } = await import("@/app/actions/auth")
      const userResult = await getCurrentUser()
      if (!userResult.success || !userResult.user) {
        setError("Not authenticated")
        return
      }

      const promptsResult = await getSchoolParentPrompts(userResult.user.school.id)
      if (!promptsResult.success) {
        setError(promptsResult.error || "Failed to load parent questions")
        return
      }
      setPrompts(promptsResult.prompts || [])

      const selectedResult = await getSelectedParentPromptIds()
      if (selectedResult.success && selectedResult.promptIds) {
        setSelectedIds(new Set(selectedResult.promptIds))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (promptId: string) => {
    const next = new Set(selectedIds)
    if (next.has(promptId)) {
      next.delete(promptId)
    } else {
      if (next.size >= MAX_PARENT_PROMPTS) {
        setError(`You can select at most ${MAX_PARENT_PROMPTS} parent questions`)
        setTimeout(() => setError(null), 3000)
        return
      }
      next.add(promptId)
    }
    setSelectedIds(next)
    setError(null)
  }

  const handleSave = async () => {
    if (selectedIds.size < MIN_PARENT_PROMPTS) {
      setError("Please select at least one parent question")
      return
    }
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      const result = await updateSelectedParentPrompts(Array.from(selectedIds))
      if (!result.success) {
        setError(result.error || "Failed to save parent questions")
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!newPrompt.category.trim() || !newPrompt.prompt_text.trim()) {
      setError("Please fill in category and question text")
      return
    }
    try {
      setCreating(true)
      setError(null)
      const result = await createParentPrompt({
        category: newPrompt.category.trim(),
        prompt_text: newPrompt.prompt_text.trim(),
      })
      if (!result.success) {
        setError(result.error || "Failed to create question")
        return
      }
      await load()
      setNewPrompt({ category: "", prompt_text: "" })
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (promptId: string) => {
    if (!confirm("Delete this parent question? This action cannot be undone.")) return
    try {
      setDeletingId(promptId)
      setError(null)
      const result = await deleteParentPrompt(promptId)
      if (!result.success) {
        setError(result.error || "Failed to delete question")
        return
      }
      await load()
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(promptId)
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setDeletingId(null)
    }
  }

  const defaultPrompts = prompts.filter((p) => !p.school_id)
  const customPrompts = prompts.filter((p) => p.school_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
            <Users className="h-5 w-5 text-[rgba(0,0,0,0.56)]" />
            Parent Interview Questions
          </h3>
          <p className="text-sm text-[rgba(0,0,0,0.56)] mt-1">
            Configure the questions parents answer by video. These are separate from student
            interview prompts and never affect student interviews. Select 1–{MAX_PARENT_PROMPTS} questions.
          </p>
        </div>
        <Button onClick={handleSave} disabled={selectedIds.size < MIN_PARENT_PROMPTS || saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Selection"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Parent questions saved successfully!</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent"></div>
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <span className="text-sm text-[rgba(0,0,0,0.56)]">
                Selected: <strong className="text-[#1d1d1f]">{selectedIds.size}</strong> question
                {selectedIds.size !== 1 ? "s" : ""}
              </span>
            </CardContent>
          </Card>

          {defaultPrompts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Default Parent Questions</CardTitle>
                <CardDescription>Pre-configured questions available to all schools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {defaultPrompts.map((prompt) => (
                    <div key={prompt.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-black/[0.04]">
                      <Checkbox
                        checked={selectedIds.has(prompt.id)}
                        onCheckedChange={() => handleToggle(prompt.id)}
                        disabled={selectedIds.size >= MAX_PARENT_PROMPTS && !selectedIds.has(prompt.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{prompt.category}</span>
                        <p className="text-sm text-[#1d1d1f] mt-1">{prompt.prompt_text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Parent Questions</CardTitle>
                  <CardDescription>Questions created specifically for your school's parents</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddForm && (
                <div className="mb-6 p-4 border rounded-lg bg-[#f5f5f7] space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent-category">Category *</Label>
                    <Input
                      id="parent-category"
                      value={newPrompt.category}
                      onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                      placeholder="e.g., Family Background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent-text">Question Text *</Label>
                    <textarea
                      id="parent-text"
                      value={newPrompt.prompt_text}
                      onChange={(e) => setNewPrompt({ ...newPrompt, prompt_text: e.target.value })}
                      placeholder="Enter the question parents will answer..."
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreate} disabled={creating} size="sm">
                      {creating ? "Creating..." : "Create Question"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false)
                        setNewPrompt({ category: "", prompt_text: "" })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {customPrompts.length === 0 ? (
                  <p className="text-sm text-[rgba(0,0,0,0.48)]">No custom parent questions yet. Create one above!</p>
                ) : (
                  customPrompts.map((prompt) => (
                    <div key={prompt.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-black/[0.04]">
                      <Checkbox
                        checked={selectedIds.has(prompt.id)}
                        onCheckedChange={() => handleToggle(prompt.id)}
                        disabled={selectedIds.size >= MAX_PARENT_PROMPTS && !selectedIds.has(prompt.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">{prompt.category}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Custom</span>
                        </div>
                        <p className="text-sm text-[#1d1d1f]">{prompt.prompt_text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prompt.id)}
                        disabled={deletingId === prompt.id || selectedIds.has(prompt.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title={selectedIds.has(prompt.id) ? "Cannot delete selected question. Deselect it first." : "Delete this question"}
                      >
                        {deletingId === prompt.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
