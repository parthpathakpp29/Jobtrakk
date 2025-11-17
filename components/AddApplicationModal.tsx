"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type ApplicationFormData, type ApplicationStatus, STATUS_CONFIG } from "@/types"
import { Loader2, Sparkles, Link as LinkIcon, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface AddApplicationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ApplicationFormData) => Promise<void>
}

export default function AddApplicationModal({ open, onClose, onSubmit }: AddApplicationModalProps) {
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [jobUrl, setJobUrl] = useState("")
  const [jobText, setJobText] = useState("")
  const [parseError, setParseError] = useState("")
  const [parseMode, setParseMode] = useState<"url" | "text">("url") // Toggle between URL and text
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

  const handleAutoFill = async () => {
    if (parseMode === "url") {
      await handleUrlParse();
    } else {
      await handleTextParse();
    }
  };

  const handleUrlParse = async () => {
    if (!jobUrl.trim()) {
      toast.error("Please enter a job URL");
      return;
    }

    try {
      new URL(jobUrl);
    } catch {
      toast.error("Please enter a valid URL (must start with http:// or https://)");
      return;
    }

    setParsing(true);
    setParseError("");

    try {
      console.log("Fetching job data from URL:", jobUrl);

      const response = await fetch("/api/parse-job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to parse job URL");
      }

      if (!data.company_name && !data.job_title) {
        throw new Error("Could not extract job details from this URL. Try pasting the job text instead.");
      }

      setFormData({
        ...formData,
        company_name: data.company_name || "",
        job_title: data.job_title || "",
        location: data.location || "",
        application_url: data.application_url || jobUrl,
        salary_min: data.salary_min || undefined,
        salary_max: data.salary_max || undefined,
        notes: data.notes || "",
      });

      toast.success("Job details auto-filled! ✨");
      setJobUrl("");
      setParseError("");
    } catch (error: any) {
      console.error("URL Parse error:", error);
      const errorMessage = error.message || "Failed to parse job URL.";
      setParseError(errorMessage + " Try switching to 'Paste Text' mode.");
      toast.error(errorMessage);
    } finally {
      setParsing(false);
    }
  };

  const handleTextParse = async () => {
    if (!jobText.trim()) {
      toast.error("Please paste job description text");
      return;
    }

    if (jobText.trim().length < 50) {
      toast.error("Please paste more text (at least 50 characters)");
      return;
    }

    setParsing(true);
    setParseError("");

    try {
      console.log("Parsing pasted text, length:", jobText.length);

      const response = await fetch("/api/parse-job-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: jobText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to parse job text");
      }

      if (!data.company_name && !data.job_title) {
        throw new Error("Could not extract job details from the pasted text. Please check the content.");
      }

      setFormData({
        ...formData,
        company_name: data.company_name || "",
        job_title: data.job_title || "",
        location: data.location || "",
        application_url: data.application_url || formData.application_url,
        salary_min: data.salary_min || undefined,
        salary_max: data.salary_max || undefined,
        notes: data.notes || "",
      });

      toast.success("Job details auto-filled! ✨");
      setJobText("");
      setParseError("");
    } catch (error: any) {
      console.error("Text Parse error:", error);
      const errorMessage = error.message || "Failed to parse job text.";
      setParseError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        ...formData,
        date_applied: formData.date_applied || null,
        interview_date: formData.interview_date || null,
        interview_time: formData.interview_time || null,
      });

      // Reset form
      setFormData({
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
      });

      setJobUrl("");
      setParseError("");
      onClose();
    } catch (error) {
      console.error("Error submitting application:", error);
    } finally {
      setLoading(false);
    }
  };


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
              Add New Application
            </DialogTitle>
          </DialogHeader>

          <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* AI Auto-Fill Section */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-800">AI Auto-Fill</h3>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setParseMode("text");
                    setParseError("");
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${parseMode === "text"
                      ? "bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                      : "bg-white/60 text-slate-600 hover:bg-white"
                    }`}
                >
                  Paste Text
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setParseMode("url");
                    setParseError("");
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${parseMode === "url"
                      ? "bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                      : "bg-white/60 text-slate-600 hover:bg-white"
                    }`}
                >
                  From URL
                </button>
              </div>


              {parseMode === "url" ? (
                <>
                  <p className="text-sm text-slate-600 mb-3">
                    Paste a job posting URL and let AI extract all the details
                  </p>

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="url"
                        value={jobUrl}
                        onChange={(e) => {
                          setJobUrl(e.target.value);
                          setParseError("");
                        }}
                        placeholder="https://linkedin.com/jobs/view/..."
                        disabled={parsing}
                        className="pl-10 bg-white/80 border-purple-200/50 focus:border-purple-400"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAutoFill}
                      disabled={parsing || !jobUrl.trim()}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      {parsing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Parse
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600 mb-3">
                    Copy the entire job posting and paste it below - works with ANY site!
                  </p>

                  <Textarea
                    value={jobText}
                    onChange={(e) => {
                      setJobText(e.target.value);
                      setParseError("");
                    }}
                    placeholder="Paste the entire job posting here (company, title, description, requirements, etc.)..."
                    disabled={parsing}
                    rows={6}
                    className="mb-2 bg-white/80 border-purple-200/50 focus:border-purple-400"
                  />

                  <Button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={parsing || !jobText.trim() || jobText.trim().length < 50}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    {parsing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Parse Text
                      </>
                    )}
                  </Button>
                </>
              )}

              <AnimatePresence>
                {parseError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{parseError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <div className="flex-1 border-t border-slate-300"></div>
                <span>or enter manually below</span>
                <div className="flex-1 border-t border-slate-300"></div>
              </div>
            </motion.div>

            {/* Company Name */}
            <motion.div variants={itemVariants}>
              <Label htmlFor="company_name" className="text-slate-700 font-semibold">
                Company Name *
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g., Google, Microsoft"
                required
                className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
              />
            </motion.div>

            {/* Job Title */}
            <motion.div variants={itemVariants}>
              <Label htmlFor="job_title" className="text-slate-700 font-semibold">
                Job Title *
              </Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
                required
                className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
              />
            </motion.div>

            {/* Row: Status & Location */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status" className="text-slate-700 font-semibold">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ApplicationStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location" className="text-slate-700 font-semibold">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                  className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
                />
              </div>
            </motion.div>

            {/* Row: Salary Range */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary_min" className="text-slate-700 font-semibold">
                  Salary Min ($)
                </Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={formData.salary_min || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary_min: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="100000"
                  className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
                />
              </div>

              <div>
                <Label htmlFor="salary_max" className="text-slate-700 font-semibold">
                  Salary Max ($)
                </Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={formData.salary_max || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary_max: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="150000"
                  className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
                />
              </div>
            </motion.div>

            {/* Application URL */}
            <motion.div variants={itemVariants}>
              <Label htmlFor="application_url" className="text-slate-700 font-semibold">
                Application URL
              </Label>
              <Input
                id="application_url"
                type="url"
                value={formData.application_url}
                onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                placeholder="https://company.com/careers/job-id"
                className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
              />
            </motion.div>

            {/* Date Applied */}
            <motion.div variants={itemVariants}>
              <Label htmlFor="date_applied" className="text-slate-700 font-semibold">
                Date Applied
              </Label>
              <Input
                id="date_applied"
                type="date"
                value={formData.date_applied}
                onChange={(e) => setFormData({ ...formData, date_applied: e.target.value })}
                className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
              />
            </motion.div>

            {/* Interview Details */}
            <motion.div variants={itemVariants} className="pt-2 border-t border-blue-100/60 mt-4">
              <h3 className="text-base font-semibold text-slate-800 mb-2">Interview Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interview_date" className="text-slate-700 font-semibold">
                    Interview Date
                  </Label>
                  <Input
                    id="interview_date"
                    type="date"
                    value={formData.interview_date}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                    className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
                  />
                </div>

                <div>
                  <Label htmlFor="interview_time" className="text-slate-700 font-semibold">
                    Interview Time
                  </Label>
                  <Input
                    id="interview_time"
                    type="time"
                    value={formData.interview_time}
                    onChange={(e) => setFormData({ ...formData, interview_time: e.target.value })}
                    className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label htmlFor="interviewer_name" className="text-slate-700 font-semibold">
                  Interviewer Name
                </Label>
                <Input
                  id="interviewer_name"
                  placeholder="e.g., John Doe"
                  value={formData.interviewer_name}
                  onChange={(e) => setFormData({ ...formData, interviewer_name: e.target.value })}
                  className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
                />
              </div>

              <div className="mt-3">
                <Label htmlFor="interview_link" className="text-slate-700 font-semibold">
                  Interview Link
                </Label>
                <Input
                  id="interview_link"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={formData.interview_link}
                  onChange={(e) => setFormData({ ...formData, interview_link: e.target.value })}
                  className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
                />
              </div>

              <div className="mt-3">
                <Label htmlFor="interview_notes" className="text-slate-700 font-semibold">
                  Interview Notes
                </Label>
                <Textarea
                  id="interview_notes"
                  rows={3}
                  placeholder="Add notes like interviewer role, round type, topics, etc."
                  value={formData.interview_notes}
                  onChange={(e) => setFormData({ ...formData, interview_notes: e.target.value })}
                  className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
                />
              </div>
            </motion.div>

            {/* Notes */}
            <motion.div variants={itemVariants}>
              <Label htmlFor="notes" className="text-slate-700 font-semibold">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes, interview details, or follow-up reminders..."
                rows={4}
                className="mt-1.5 bg-white/60 backdrop-blur border-blue-200/50 focus:border-blue-400 focus:bg-white/80 transition-all"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <DialogFooter>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="border-blue-200/50 bg-transparent hover:bg-blue-50/40"
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Application"
                    )}
                  </Button>
                </motion.div>
              </DialogFooter>
            </motion.div>
          </motion.form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}