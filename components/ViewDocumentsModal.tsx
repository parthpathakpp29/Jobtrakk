"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Copy, Download, CheckCircle2, FileText, Mail, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Application } from "@/types"
import { supabase } from "@/lib/supabaseClient"
import { motion } from "framer-motion"

interface ViewDocumentsModalProps {
  open: boolean
  onClose: () => void
  application: Application
  onRegenerate?: () => void
  onDelete?: () => void
  onSave?: () => void
}

interface SavedDocument {
  id: string
  cover_letter: string
  referral_email: string
  created_at: string
}

export default function ViewDocumentsModal({
  open,
  onClose,
  application,
  onRegenerate,
  onDelete,
  onSave,
}: ViewDocumentsModalProps) {
  const [loading, setLoading] = useState(true)
  const [doc, setDoc] = useState<SavedDocument | null>(null)
  const [copied, setCopied] = useState({ cover: false, email: false })

  useEffect(() => {
    if (open && application.id) fetchDocument()
  }, [open, application.id])

  const fetchDocument = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("generated_documents")
        .select("*")
        .eq("application_id", application.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === "PGRST116") toast.error("No saved documents found")
        else throw error
      } else setDoc(data)
    } catch {
      toast.error("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text: string, key: "cover" | "email") => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied({ ...copied, [key]: true })
      setTimeout(() => setCopied({ cover: false, email: false }), 2000)
      toast.success("Copied!")
    } catch {
      toast.error("Copy failed")
    }
  }

  const downloadFile = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" })
    const link = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = link
    a.download = filename
    a.click()

    URL.revokeObjectURL(link)
    toast.success("Downloaded")
  }

  const handleDelete = async () => {
    if (!doc) return

    if (!confirm("Delete saved documents?")) return

    try {
      const { error } = await supabase.from("generated_documents").delete().eq("id", doc.id)

      if (error) throw error

      toast.success("Deleted")
      onDelete?.()
      onClose()
    } catch {
      toast.error("Delete failed")
    }
  }

  const handleSave = async () => {
    if (!doc) return

    try {
      // Logic to save document to application
      toast.success("Saved to Application")
      onSave?.()
    } catch {
      toast.error("Save failed")
    }
  }

  const format = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const renderDocSection = (title: string, text: string, type: "cover" | "email") => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="bg-white/80 backdrop-blur border-blue-200/50">
        <CardContent className="p-6">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copy(text, type)}
                  className="border-blue-200/50 hover:bg-blue-50/50"
                >
                  {copied[type] ? (
                    <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  Copy
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(text, `${type}-${application.company_name}.txt`)}
                  className="border-blue-200/50 hover:bg-blue-50/50"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50/80 to-blue-50/50 rounded-lg p-6 border border-blue-100/40 max-h-96 overflow-y-auto backdrop-blur-sm">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">{text}</pre>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white/95 to-blue-50/90 backdrop-blur-xl border border-blue-200/50 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 20 }} whileTap={{ scale: 0.9 }}>
                <FileText className="w-5 h-5 text-green-600" />
              </motion.div>
              Saved AI Documents
            </DialogTitle>
            <p className="text-sm text-slate-600">
              Documents for{" "}
              <span className="font-semibold text-slate-900">
                {application.job_title} at {application.company_name}
              </span>
            </p>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Loader2 className="w-8 h-8 text-blue-400" />
              </motion.div>
            </div>
          ) : !doc ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-slate-500 mb-4">No saved documents</p>
              <Button onClick={onClose} variant="outline" className="border-blue-200/50 bg-transparent">
                Close
              </Button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }}>
              <div className="bg-gradient-to-r from-blue-100/40 to-cyan-100/40 backdrop-blur border border-blue-200/30 p-3 rounded-lg mb-4 text-xs font-medium text-slate-700">
                <span className="font-semibold">Generated on:</span> {format(doc.created_at)}
              </div>

              <Tabs defaultValue="cover">
                <TabsList className="grid grid-cols-2 bg-white/50 border border-blue-200/30">
                  <TabsTrigger value="cover" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Cover Letter
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Referral Email
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cover" className="mt-4">
                  {renderDocSection("Cover Letter", doc.cover_letter, "cover")}
                </TabsContent>

                <TabsContent value="email" className="mt-4">
                  {renderDocSection("Referral Request Email", doc.referral_email, "email")}
                </TabsContent>
              </Tabs>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-between mt-6 pt-4 border-t border-blue-200/30"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50/50 border-red-200/50 bg-transparent"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </motion.div>

                <div className="flex gap-3">
                  {onRegenerate && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        onClick={() => {
                          onClose()
                          onRegenerate()
                        }}
                        className="border-blue-200/50 hover:bg-blue-50/50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                      </Button>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={onClose} className="border-blue-200/50 bg-white hover:bg-blue-50/40 text-black">
                      Close
                    </Button>
                  </motion.div>
                  {onSave && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleSave}
                        className="bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all text-white"
                      >
                        Save to Application
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
