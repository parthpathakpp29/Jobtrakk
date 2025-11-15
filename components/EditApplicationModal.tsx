"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Application, type ApplicationFormData, type ApplicationStatus, STATUS_CONFIG } from "@/types"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface EditApplicationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ApplicationFormData) => Promise<void>
  application: Application | null
}

export default function EditApplicationModal({ open, onClose, onSubmit, application }: EditApplicationModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ApplicationFormData>({
    company_name: "",
    job_title: "",
    status: "applied",
    location: "",
    salary_min: undefined,
    salary_max: undefined,
    application_url: "",
    date_applied: "",
    notes: "",
    interview_date: "",
    interview_time: "",
    interviewer_name: "",
    interview_link: "",
    interview_notes: "",

  })

  // Populate form data when application is provided
  useEffect(() => {
    if (application) {
      setFormData({
        company_name: application.company_name,
        job_title: application.job_title,
        status: application.status,
        location: application.location || "",
        salary_min: application.salary_min,
        salary_max: application.salary_max,
        application_url: application.application_url || "",
        date_applied: application.date_applied || "",
        notes: application.notes || "",

        // 🟢 New interview fields
        interview_date: application.interview_date || "",
        interview_time: application.interview_time || "",
        interviewer_name: application.interviewer_name || "",
        interview_link: application.interview_link || "",
        interview_notes: application.interview_notes || "",
      })

    }
  }, [application, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error("Error updating application:", error)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white/95 via-white/90 to-blue-50/90 backdrop-blur-xl border border-blue-200/50 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              Edit Application
            </DialogTitle>
          </DialogHeader>

          <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Company Name */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-semibold text-slate-700">
                Company Name *
              </Label>
              <Input
                id="company_name"
                placeholder="Enter company name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
                className="bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              />
            </motion.div>

            {/* Job Title */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="job_title" className="text-sm font-semibold text-slate-700">
                Job Title *
              </Label>
              <Input
                id="job_title"
                placeholder="Enter job title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                required
                className="bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              />
            </motion.div>

            {/* Status */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-slate-700">
                Status *
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ApplicationStatus })}>
                <SelectTrigger className="bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Location */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold text-slate-700">
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA or Remote"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              />
            </motion.div>

            {/* Salary Range */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary_min" className="text-sm font-semibold text-slate-700">
                  Salary Min
                </Label>
                <Input
                  id="salary_min"
                  type="number"
                  placeholder="e.g., 60000"
                  value={formData.salary_min || ""}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value ? Number(e.target.value) : undefined })}
                  className="bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_max" className="text-sm font-semibold text-slate-700">
                  Salary Max
                </Label>
                <Input
                  id="salary_max"
                  type="number"
                  placeholder="e.g., 90000"
                  value={formData.salary_max || ""}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value ? Number(e.target.value) : undefined })}
                  className="bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
                />
              </div>
            </motion.div>

            {/* Application URL */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="application_url" className="text-sm font-semibold text-slate-700">
                Application URL
              </Label>
              <Input
                id="application_url"
                type="url"
                placeholder="https://example.com/job-posting"
                value={formData.application_url || ""}
                onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                className="bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              />
            </motion.div>

            {/* Date Applied */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="date_applied" className="text-sm font-semibold text-slate-700">
                Date Applied
              </Label>
              <Input
                id="date_applied"
                type="date"
                value={formData.date_applied || ""}
                onChange={(e) => setFormData({ ...formData, date_applied: e.target.value })}
                className="bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm"
              />
            </motion.div>

            {/* 🟦 Interview Details */}
            <motion.div variants={itemVariants} className="pt-2 border-t border-blue-100/60 mt-4">
              <h3 className="font-semibold text-slate-800 text-base mb-2">Interview Details</h3>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interview_date" className="text-sm font-semibold text-slate-700">
                    Interview Date
                  </Label>
                  <Input
                    id="interview_date"
                    type="date"
                    value={formData.interview_date || ""}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                    className="bg-white/80 border-blue-200/50 focus:border-blue-400 backdrop-blur-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview_time" className="text-sm font-semibold text-slate-700">
                    Interview Time
                  </Label>
                  <Input
                    id="interview_time"
                    type="time"
                    value={formData.interview_time || ""}
                    onChange={(e) => setFormData({ ...formData, interview_time: e.target.value })}
                    className="bg-white/80 border-blue-200/50 focus:border-blue-400 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Interviewer Name */}
              <div className="space-y-2 mt-3">
                <Label htmlFor="interviewer_name" className="text-sm font-semibold text-slate-700">
                  Interviewer Name
                </Label>
                <Input
                  id="interviewer_name"
                  value={formData.interviewer_name || ""}
                  onChange={(e) => setFormData({ ...formData, interviewer_name: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="bg-white/80 border-blue-200/50 focus:border-blue-400 backdrop-blur-sm"
                />
              </div>

              {/* Interview Link */}
              <div className="space-y-2 mt-3">
                <Label htmlFor="interview_link" className="text-sm font-semibold text-slate-700">
                  Interview Link
                </Label>
                <Input
                  id="interview_link"
                  type="url"
                  value={formData.interview_link || ""}
                  onChange={(e) => setFormData({ ...formData, interview_link: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="bg-white/80 border-blue-200/50 focus:border-blue-400 backdrop-blur-sm"
                />
              </div>

              {/* Interview Notes */}
              <div className="space-y-2 mt-3">
                <Label htmlFor="interview_notes" className="text-sm font-semibold text-slate-700">
                  Interview Notes
                </Label>
                <Textarea
                  id="interview_notes"
                  rows={3}
                  value={formData.interview_notes || ""}
                  onChange={(e) => setFormData({ ...formData, interview_notes: e.target.value })}
                  placeholder="Round type, interviewer role, checklist, etc..."
                  className="bg-white/80 border-blue-200/50 focus:border-blue-400 backdrop-blur-sm"
                />
              </div>
            </motion.div>


            {/* Notes */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold text-slate-700">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this application..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm min-h-24 resize-none"
              />
            </motion.div>

            <DialogFooter className="mt-6 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-blue-200/50 hover:bg-blue-50/50 text-slate-700 hover:text-slate-900"
                disabled={loading}
              >
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Application"
                  )}
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
