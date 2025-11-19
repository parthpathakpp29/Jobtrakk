"use client"

import type React from "react"

import { useAuth } from "@/lib/AuthProviderContext"
import LogoutButton from "@/components/LogoutButton"
import ApplicationCard from "@/components/ApplicationCard"
import AddApplicationModal from "@/components/AddApplicationModal"
import EditApplicationModal from "@/components/EditApplicationModal"
import AIDocumentGenerator from "@/components/AIDocumentGenerator"
import ViewDocumentsModal from "@/components/ViewDocumentsModal"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Briefcase, TrendingUp, Calendar, CheckCircle, Plus, Loader2, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { type Application, type ApplicationFormData, type ApplicationStatus, STATUS_CONFIG } from "@/types"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { Bell } from "lucide-react"
import ChatBot from "@/components/ChatBot";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [documentsMap, setDocumentsMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [draggedItem, setDraggedItem] = useState<Application | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; seen: boolean }[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const hasFetchedRef = useRef(false)
  const isFetchingRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && !hasFetchedRef.current && !isFetchingRef.current) {
      hasFetchedRef.current = true
      isFetchingRef.current = true
      fetchApplications()
      fetchDocuments()
    }
  }, [user])

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const showNotificationOrToast = (title: string, body: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [
      ...prev,
      { id, title, message: body, seen: false },
    ]);

    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else {
      toast.info(body);
    }
  };

  // 🔹 Schedule interview notifications
  useEffect(() => {
    if (!applications.length) return;
    const now = new Date();

    applications.forEach((app) => {
      if (app.interview_date && app.interview_time) {
        const interviewDateTime = new Date(`${app.interview_date}T${app.interview_time}`);
        const timeUntilInterview = interviewDateTime.getTime() - now.getTime();

        if (timeUntilInterview <= 0) return;

        const oneHourBefore = timeUntilInterview - 60 * 60 * 1000;
        const oneDayBefore = timeUntilInterview - 24 * 60 * 60 * 1000;

        if (oneDayBefore > 0) {
          setTimeout(() => {
            showNotificationOrToast(
              "Interview Tomorrow 📅",
              `Interview with ${app.interviewer_name || app.company_name} tomorrow at ${app.interview_time}.`
            );
          }, oneDayBefore);
        }

        if (oneHourBefore > 0) {
          setTimeout(() => {
            showNotificationOrToast(
              "Interview Reminder 🕒",
              `Your interview for ${app.job_title} at ${app.company_name} starts in 1 hour.`
            );
          }, oneHourBefore);
        }
      }
    });
  }, [applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setApplications(data || [])
    } catch (error: any) {
      toast.error("Failed to load applications")
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase.from("generated_documents").select("application_id")
      if (error) throw error
      const map: Record<string, boolean> = {}
      data?.forEach((doc) => {
        map[doc.application_id] = true
      })
      setDocumentsMap(map)
    } catch (error) {
      console.error("Error fetching documents:", error)
    }
  }

  const handleAddApplication = async (formData: ApplicationFormData) => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .insert([{ ...formData, user_id: user?.id }])
        .select()
        .single()
      if (error) throw error
      setApplications([data, ...applications])
      toast.success("Application added successfully! 🎉")
    } catch (error: any) {
      toast.error("Failed to add application")
      throw error
    }
  }

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return
    try {
      const { error } = await supabase.from("applications").delete().eq("id", id)
      if (error) throw error
      setApplications(applications.filter((app) => app.id !== id))
      toast.success("Application deleted")
    } catch {
      toast.error("Failed to delete application")
    }
  }

  const handleEditApplication = async (formData: ApplicationFormData) => {
    if (!selectedApp) return
    try {
      const { error } = await supabase
        .from("applications")
        .update(formData)
        .eq("id", selectedApp.id)
      if (error) throw error
      setApplications(
        applications.map((app) =>
          app.id === selectedApp.id ? { ...app, ...formData } : app
        )
      )
      toast.success("Application updated successfully! ✨")
    } catch (error: any) {
      toast.error("Failed to update application")
      throw error
    }
  }

  const handleOpenEdit = (application: Application) => {
    setSelectedApp(application)
    setIsEditModalOpen(true)
  }

  const handleOpenAI = (application: Application) => {
    setSelectedApp(application)
    setIsAIModalOpen(true)
  }

  const handleViewDocuments = (application: Application) => {
    setSelectedApp(application)
    setIsViewModalOpen(true)
  }

  const handleSaveAIDocuments = async (coverLetter: string, referralEmail: string) => {
    if (!selectedApp) return
    try {
      const { data: existingDoc } = await supabase
        .from("generated_documents")
        .select("id")
        .eq("application_id", selectedApp.id)
        .single()

      if (existingDoc) {
        const { error } = await supabase
          .from("generated_documents")
          .update({
            cover_letter: coverLetter,
            referral_email: referralEmail,
          })
          .eq("id", existingDoc.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("generated_documents").insert({
          application_id: selectedApp.id,
          user_id: user?.id,
          cover_letter: coverLetter,
          referral_email: referralEmail,
        })

        if (error) throw error
      }

      toast.success("Documents saved to application!")
      fetchDocuments()
    } catch (error) {
      console.error("Error saving documents:", error)
      toast.error("Failed to save documents")
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, application: Application) => {
    setDraggedItem(application)
    e.dataTransfer.effectAllowed = "move"
    setTimeout(() => {
      const target = e.currentTarget as HTMLElement
      if (target) target.classList.add("dragging-card")
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLElement
    if (target) target.classList.remove("dragging-card")
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (status: ApplicationStatus) => {
    setDragOverColumn(status)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    if (!draggedItem) return
    if (draggedItem.status === newStatus) {
      setDraggedItem(null)
      return
    }
    try {
      const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", draggedItem.id)
      if (error) throw error
      setApplications(applications.map((app) => (app.id === draggedItem.id ? { ...app, status: newStatus } : app)))
      toast.success(`Moved to ${STATUS_CONFIG[newStatus].label}! 🎯`)
    } catch (error: any) {
      toast.error("Failed to move application")
    } finally {
      setDraggedItem(null)
    }
  }

  const getFilteredApplications = (apps: Application[]) => {
    if (!searchQuery.trim()) return apps
    const query = searchQuery.toLowerCase()
    return apps.filter(
      (app) =>
        app.job_title?.toLowerCase().includes(query) ||
        app.company_name?.toLowerCase().includes(query) ||
        app.location?.toLowerCase().includes(query) ||
        app.notes?.toLowerCase().includes(query),
    )
  }

  const getApplicationsByStatus = (status: ApplicationStatus) => {
    const filteredApps = getFilteredApplications(applications)
    return filteredApps.filter((app) => app.status === status)
  }

  const stats = {
    total: applications.length,
    active: applications.filter((a) => ["applied", "referred", "screening", "interview"].includes(a.status)).length,
    interviews: applications.filter((a) => a.status === "interview").length,
    offers: applications.filter((a) => a.status === "offer").length,
  }

  const columns: ApplicationStatus[] = [
    "applied",
    "referred",
    "screening",
    "interview",
    "offer",
    "rejected",
  ]

  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen p-4 sm:p-8"
        style={{
          backgroundImage:
            "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Nov%208%2C%202025%2C%2005_13_59%20PM-vsQdr0iwJRYTDLnsGeNxnTFBLB1dsR.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage:
          "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Nov%208%2C%202025%2C%2005_13_59%20PM-vsQdr0iwJRYTDLnsGeNxnTFBLB1dsR.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-blue-50/10 to-transparent pointer-events-none"></div>

      <header className="relative z-20 sticky top-0 backdrop-blur-md bg-white/80 border-b border-blue-100/40 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl || "/placeholder.svg"}
                    alt="Profile"
                    className="w-9 sm:w-10 h-9 sm:h-10 rounded-full border-2 border-blue-200 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">Welcome, {displayName}</h1>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-9 sm:h-10 shadow-sm hover:shadow-md transition-all text-sm sm:text-base cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Application</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  className="relative p-2 rounded-full hover:bg-blue-50 transition cursor-pointer"
                >
                  <Bell className="w-6 h-6 text-slate-700" />
                  {notifications.some((n) => !n.seen) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white/90 backdrop-blur border border-blue-100 shadow-lg rounded-xl z-50">
                    <div className="p-3 border-b border-blue-100 flex justify-between items-center">
                      <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No new notifications
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {notifications
                          .slice()
                          .reverse()
                          .map((n) => (
                            <div
                              key={n.id}
                              onClick={() =>
                                setNotifications((prev) =>
                                  prev.map((x) =>
                                    x.id === n.id ? { ...x, seen: true } : x
                                  )
                                )
                              }
                              className={`p-3 border-b border-blue-50 last:border-none cursor-pointer hover:bg-blue-50/60 transition ${n.seen ? "opacity-70" : ""}`}
                            >
                              <p className="text-sm font-medium text-slate-800">{n.title}</p>
                              <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-content items-center " >
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Responsive Grid: 2 Cols on Mobile, 4 on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[
            { label: "Total Apps", value: stats.total, icon: Briefcase, color: "bg-blue-400/20 border-blue-200/40" },
            { label: "Active", value: stats.active, icon: TrendingUp, color: "bg-emerald-400/20 border-emerald-200/40" },
            { label: "Interviews", value: stats.interviews, icon: Calendar, color: "bg-purple-400/20 border-purple-200/40" },
            { label: "Offers", value: stats.offers, icon: CheckCircle, color: "bg-orange-400/20 border-orange-200/40" },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div
                key={idx}
                className="glass-strong rounded-2xl p-3 sm:p-6 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-slate-500 font-medium mb-1 truncate">{stat.label}</p>
                    <p className="text-xl sm:text-4xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} backdrop-blur-sm p-2 sm:p-4 rounded-xl border flex-shrink-0`}>
                    <Icon className="w-4 sm:w-6 h-4 sm:h-6 text-slate-700" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 glass-strong rounded-xl border border-blue-200/40 focus:border-blue-300/60 focus:ring-2 focus:ring-blue-400/30 outline-none text-sm sm:text-base transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : applications.length === 0 ? (
          <div className="glass-strong rounded-2xl border border-blue-100/40 p-8 sm:p-12 text-center shadow-lg">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Briefcase className="w-8 sm:w-10 h-8 sm:h-10 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Start Tracking Your Applications</h2>
              <p className="text-sm sm:text-base text-slate-600">Add your first job application to get started</p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Application
              </Button>
            </div>
          </div>
        ) : (
          /* Mobile: Horizontal Snap Scroll. Desktop: Standard Flex */
          <div className="kanban-board-scroll flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none px-4 sm:px-0 -mx-4 sm:mx-0">
            {columns.map((status) => {
              const statusApps = getApplicationsByStatus(status)
              const config = STATUS_CONFIG[status]
              const isDragOver = dragOverColumn === status
              return (
                /* Column Width: 85% of Viewport on Mobile, Fixed on Desktop */
                <div key={status} className="shrink-0 grow-0 w-[85vw] sm:w-[300px] snap-center">
                  <div
                    className={`glass-strong rounded-xl transition-all duration-200 shadow-lg h-[calc(100vh-18rem)] sm:h-[calc(100vh-14rem)] flex flex-col ${isDragOver ? "ring-2 ring-blue-400/50 scale-[1.01]" : "hover:shadow-xl"}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status)}
                  >
                    <div className="p-3 sm:p-4 pb-2 sm:pb-3 border-b border-blue-100/30 bg-white/40 rounded-t-xl shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{config.label}</h3>
                        <span className="text-xs font-medium text-slate-600 bg-blue-50/80 px-2 py-1 rounded-full border border-blue-100/50 shadow-sm flex-shrink-0">
                          {statusApps.length}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 pt-2 sm:pt-3 flex-1 overflow-hidden">
                      <div
                        className="kanban-column-scroll space-y-3 pr-2 h-full overflow-y-auto"
                      >
                        {statusApps.map((app) => (
                          <div
                            key={app.id}
                            className="kanban-card-enter"
                            onDragStart={(e) => handleDragStart(e, app)}
                            onDragEnd={handleDragEnd}
                          >
                            <ApplicationCard
                              application={app}
                              onEdit={handleOpenEdit}
                              onDelete={handleDeleteApplication}
                              onGenerateAI={handleOpenAI}
                              onViewDocuments={handleViewDocuments}
                              hasDocuments={documentsMap[app.id] || false}
                              isDragging={draggedItem?.id === app.id}
                            />
                          </div>
                        ))}
                        {statusApps.length === 0 && (
                          <div className="text-center py-12 text-xs sm:text-sm text-slate-400">
                            {isDragOver ? (
                              <span className="text-blue-500 font-medium">Drop here</span>
                            ) : (
                              "No applications"
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <ChatBot />

      </main>

      <AddApplicationModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddApplication}
      />

      <EditApplicationModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedApp(null)
        }}
        application={selectedApp}
        onSubmit={handleEditApplication}
      />

      {selectedApp && (
        <>
          <AIDocumentGenerator
            open={isAIModalOpen}
            onClose={() => {
              setIsAIModalOpen(false)
              setSelectedApp(null)
            }}
            application={selectedApp}
            onSave={handleSaveAIDocuments}
          />

          <ViewDocumentsModal
            open={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false)
              setSelectedApp(null)
            }}
            application={selectedApp}
            onRegenerate={() => handleOpenAI(selectedApp)}
            onDelete={() => {
              fetchDocuments()
            }}
          />
        </>
      )}
    </div>
  )
}