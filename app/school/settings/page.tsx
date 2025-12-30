"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  getSchoolPrompts, 
  getSelectedPromptIds, 
  updateSelectedPrompts, 
  createPrompt,
  deletePrompt,
  type PromptRecord 
} from "@/app/actions/prompts"
import { 
  getGlobalTimingSettings,
  updateGlobalTimingSettings
} from "@/app/actions/system-settings"
import { Plus, Save, AlertCircle, CheckCircle2, Trash2, Clock, Settings, FileText } from "lucide-react"

export default function SettingsPage() {
  const [prompts, setPrompts] = useState<PromptRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [promptsLoading, setPromptsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Add prompt form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPrompt, setNewPrompt] = useState({
    category: "",
    prompt_text: "",
    preparation_time: 20,
    response_time: 90,
    difficulty_level: "medium"
  })
  const [creating, setCreating] = useState(false)
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null)
  
  // Global timing settings (super admin only)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [globalTimingSettings, setGlobalTimingSettings] = useState({
    preparationTime: 20,
    responseTime: 90
  })
  const [savingTiming, setSavingTiming] = useState(false)
  const [timingSuccess, setTimingSuccess] = useState(false)
  const [timingLoading, setTimingLoading] = useState(true)

  useEffect(() => {
    loadPrompts()
    loadGlobalTimingSettings()
  }, [])

  const loadPrompts = async () => {
    try {
      setPromptsLoading(true)
      setError(null)
      
      // Get current user's school ID (we'll need to get this from auth)
      const { getCurrentUser } = await import("@/app/actions/auth")
      const userResult = await getCurrentUser()
      
      if (!userResult.success || !userResult.user) {
        setError("Not authenticated")
        return
      }

      const schoolId = userResult.user.school.id
      setIsSuperAdmin(userResult.user.school.is_super_admin)
      
      // Load prompts
      const promptsResult = await getSchoolPrompts(schoolId)
      if (!promptsResult.success) {
        setError(promptsResult.error || "Failed to load prompts")
        return
      }
      setPrompts(promptsResult.prompts || [])

      // Load selected IDs
      const selectedResult = await getSelectedPromptIds()
      if (selectedResult.success && selectedResult.promptIds) {
        setSelectedIds(new Set(selectedResult.promptIds))
      }
    } catch (err) {
      console.error("[Settings] Error loading prompts:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setPromptsLoading(false)
    }
  }

  const loadGlobalTimingSettings = async () => {
    try {
      setTimingLoading(true)
      const result = await getGlobalTimingSettings()
      if (result.success) {
        setGlobalTimingSettings({
          preparationTime: result.preparationTime || 20,
          responseTime: result.responseTime || 90
        })
      }
    } catch (err) {
      console.error("[Settings] Error loading global timing settings:", err)
    } finally {
      setTimingLoading(false)
    }
  }

  const handleSaveTimingSettings = async () => {
    try {
      setSavingTiming(true)
      setError(null)
      setTimingSuccess(false)

      const result = await updateGlobalTimingSettings(
        globalTimingSettings.preparationTime,
        globalTimingSettings.responseTime
      )
      
      if (!result.success) {
        setError(result.error || "Failed to save timing settings")
        return
      }

      setTimingSuccess(true)
      setTimeout(() => setTimingSuccess(false), 3000)
    } catch (err) {
      console.error("[Settings] Error saving timing settings:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSavingTiming(false)
    }
  }

  const handleTogglePrompt = (promptId: string) => {
    const newSelected = new Set(selectedIds)
    
    if (newSelected.has(promptId)) {
      newSelected.delete(promptId)
    } else {
      if (newSelected.size >= 4) {
        setError("You can only select exactly 4 prompts")
        setTimeout(() => setError(null), 3000)
        return
      }
      newSelected.add(promptId)
    }
    
    setSelectedIds(newSelected)
    setError(null)
  }

  const handleSave = async () => {
    if (selectedIds.size !== 4) {
      setError("You must select exactly 4 prompts")
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const result = await updateSelectedPrompts(Array.from(selectedIds))
      
      if (!result.success) {
        setError(result.error || "Failed to save prompts")
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("[Settings] Error saving prompts:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePrompt = async () => {
    if (!newPrompt.category || !newPrompt.prompt_text.trim()) {
      setError("Please fill in category and prompt text")
      return
    }

    try {
      setCreating(true)
      setError(null)

      // Only pass necessary fields, use defaults for prep/response time
      const result = await createPrompt({
        category: newPrompt.category,
        prompt_text: newPrompt.prompt_text,
        difficulty_level: newPrompt.difficulty_level || 'medium'
        // preparation_time and response_time will use defaults (20s, 90s)
      })
      
      if (!result.success) {
        setError(result.error || "Failed to create prompt")
        return
      }

      // Reload prompts
      await loadPrompts()
      
      // Reset form
      setNewPrompt({
        category: "",
        prompt_text: "",
        preparation_time: 20,
        response_time: 90,
        difficulty_level: "medium"
      })
      setShowAddForm(false)
    } catch (err) {
      console.error("[Settings] Error creating prompt:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this custom prompt? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingPromptId(promptId)
      setError(null)

      const result = await deletePrompt(promptId)
      
      if (!result.success) {
        setError(result.error || "Failed to delete prompt")
        return
      }

      // Reload prompts
      await loadPrompts()
      
      // Remove from selected if it was selected
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(promptId)
        return newSet
      })
    } catch (err) {
      console.error("[Settings] Error deleting prompt:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setDeletingPromptId(null)
    }
  }

  const defaultPrompts = prompts.filter(p => !p.school_id)
  const customPrompts = prompts.filter(p => p.school_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-600 mt-1">
          Manage global settings and interview prompts
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="prompts" className="w-full">
        <TabsList>
          {isSuperAdmin && (
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
          <TabsTrigger value="prompts" className="gap-2">
            <FileText className="h-4 w-4" />
            Prompts
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab - Global Settings (Super Admin Only) */}
        {isSuperAdmin && (
          <TabsContent value="settings" className="space-y-6 mt-6">
            {/* Global Timing Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-600" />
                  <div>
                    <CardTitle>Global Timing Settings</CardTitle>
                    <CardDescription>
                      Set default preparation and response times for all interview prompts. These settings apply to all schools and interviews.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {timingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="preparation-time">Preparation Time (seconds)</Label>
                        <Input
                          id="preparation-time"
                          type="number"
                          min="1"
                          max="300"
                          value={globalTimingSettings.preparationTime}
                          onChange={(e) => setGlobalTimingSettings({
                            ...globalTimingSettings,
                            preparationTime: parseInt(e.target.value, 10) || 20
                          })}
                        />
                        <p className="text-xs text-slate-500">
                          Time students have to prepare before recording (1-300 seconds)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="response-time">Response Time (seconds)</Label>
                        <Input
                          id="response-time"
                          type="number"
                          min="1"
                          max="600"
                          value={globalTimingSettings.responseTime}
                          onChange={(e) => setGlobalTimingSettings({
                            ...globalTimingSettings,
                            responseTime: parseInt(e.target.value, 10) || 90
                          })}
                        />
                        <p className="text-xs text-slate-500">
                          Time students have to record their response (1-600 seconds)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-slate-600">
                        Current settings: <strong>{globalTimingSettings.preparationTime}s</strong> preparation, <strong>{globalTimingSettings.responseTime}s</strong> response
                      </p>
                      <Button
                        onClick={handleSaveTimingSettings}
                        disabled={savingTiming}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {savingTiming ? "Saving..." : "Save Timing Settings"}
                      </Button>
                    </div>
                    {timingSuccess && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Global timing settings saved successfully! These settings will apply to all new interviews.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6 mt-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Interview Prompts</h3>
              <p className="text-sm text-slate-600 mt-1">
                Select exactly 4 prompts for student interviews. You can choose from default prompts or create your own.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={selectedIds.size !== 4 || saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Selection"}
            </Button>
          </div>

          {/* Status messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Prompts saved successfully!
              </AlertDescription>
            </Alert>
          )}

          {promptsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                <p className="mt-2 text-sm text-slate-600">Loading prompts...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Selection status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Selected: <strong className="text-slate-900">{selectedIds.size} / 4</strong>
                    </span>
                    {selectedIds.size !== 4 && (
                      <span className="text-xs text-amber-600">
                        {selectedIds.size < 4 
                          ? `Select ${4 - selectedIds.size} more prompt${4 - selectedIds.size > 1 ? 's' : ''}`
                          : "You must select exactly 4 prompts"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Default Prompts */}
              <Card>
                <CardHeader>
                  <CardTitle>Default Prompts</CardTitle>
                  <CardDescription>
                    Pre-configured prompts available to all schools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {defaultPrompts.length === 0 ? (
                      <p className="text-sm text-slate-500">No default prompts available</p>
                    ) : (
                      defaultPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50"
                        >
                          <Checkbox
                            checked={selectedIds.has(prompt.id)}
                            onCheckedChange={() => handleTogglePrompt(prompt.id)}
                            disabled={selectedIds.size >= 4 && !selectedIds.has(prompt.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                {prompt.category}
                              </span>
                              {prompt.difficulty_level && (
                                <span className="text-xs text-slate-500">
                                  {prompt.difficulty_level}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-900">{prompt.prompt_text}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Prep: {prompt.preparation_time}s | Response: {prompt.response_time}s
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Prompts */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Custom Prompts</CardTitle>
                      <CardDescription>
                        Prompts created specifically for your school
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Prompt
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Add Prompt Form */}
                  {showAddForm && (
                    <div className="mb-6 p-4 border rounded-lg bg-slate-50 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Input
                            id="category"
                            value={newPrompt.category}
                            onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                            placeholder="e.g., Critical Thinking"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="difficulty">Difficulty</Label>
                          <Select
                            value={newPrompt.difficulty_level}
                            onValueChange={(value) => setNewPrompt({ ...newPrompt, difficulty_level: value })}
                          >
                            <SelectTrigger id="difficulty">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prompt_text">Prompt Text *</Label>
                        <textarea
                          id="prompt_text"
                          value={newPrompt.prompt_text}
                          onChange={(e) => setNewPrompt({ ...newPrompt, prompt_text: e.target.value })}
                          placeholder="Enter the interview question..."
                          className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm"
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreatePrompt}
                          disabled={creating}
                          size="sm"
                        >
                          {creating ? "Creating..." : "Create Prompt"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddForm(false)
                            setNewPrompt({
                              category: "",
                              prompt_text: "",
                              preparation_time: 20,
                              response_time: 90,
                              difficulty_level: "medium"
                            })
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Custom Prompts List */}
                  <div className="space-y-3">
                    {customPrompts.length === 0 ? (
                      <p className="text-sm text-slate-500">No custom prompts yet. Create one above!</p>
                    ) : (
                      customPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50"
                        >
                          <Checkbox
                            checked={selectedIds.has(prompt.id)}
                            onCheckedChange={() => handleTogglePrompt(prompt.id)}
                            disabled={selectedIds.size >= 4 && !selectedIds.has(prompt.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                {prompt.category}
                              </span>
                              {prompt.difficulty_level && (
                                <span className="text-xs text-slate-500">
                                  {prompt.difficulty_level}
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                                Custom
                              </span>
                            </div>
                            <p className="text-sm text-slate-900">{prompt.prompt_text}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Prep: {prompt.preparation_time}s | Response: {prompt.response_time}s
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrompt(prompt.id)}
                            disabled={deletingPromptId === prompt.id || selectedIds.has(prompt.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={selectedIds.has(prompt.id) ? "Cannot delete selected prompt. Deselect it first." : "Delete this custom prompt"}
                          >
                            {deletingPromptId === prompt.id ? (
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
