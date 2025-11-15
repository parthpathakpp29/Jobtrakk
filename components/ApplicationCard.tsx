"use client"

import { type Application, STATUS_CONFIG } from "@/types"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  DollarSign,
  Calendar,
  ExternalLink,
  Trash2,
  Edit,
  GripVertical,
  Sparkles,
  FileCheck,
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface ApplicationCardProps {
  application: Application
  onEdit?: (application: Application) => void
  onDelete?: (id: string) => void
  onGenerateAI?: (application: Application) => void
  onViewDocuments?: (application: Application) => void
  hasDocuments?: boolean
  isDragging?: boolean
}

export default function ApplicationCard({
  application,
  onEdit,
  onDelete,
  onGenerateAI,
  onViewDocuments,
  hasDocuments,
  isDragging,
}: ApplicationCardProps) {
  const statusConfig = STATUS_CONFIG[application.status]

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `$${min.toLocaleString()}+`
    if (max) return `Up to $${max.toLocaleString()}`
  }

  return (
    <motion.div
      className={`
        bg-white/90 backdrop-blur-md rounded-xl border border-blue-200/60 p-4 
        hover:shadow-2xl hover:border-blue-300/80 transition-all duration-300 group relative
        ${isDragging ? "opacity-50 shadow-xl scale-95" : ""}
      `}
      draggable={true}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.01 }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        <motion.div whileHover={{ x: 2 }}>
          <GripVertical className="w-4 h-4 text-blue-300 mt-1 shrink-0" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">{application.job_title}</h3>
          <p className="text-slate-600 font-medium text-xs truncate">{application.company_name}</p>
        </div>
      </div>

      {/* Action Icons */}
      <motion.div
        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mb-3 flex-wrap"
        initial={{ y: -5 }}
        animate={{ y: 0 }}
      >
          {hasDocuments && onViewDocuments && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDocuments(application)
                }}
                className="h-7 w-7 p-0 hover:bg-green-100/80 backdrop-blur"
                title="View Saved Documents"
              >
                <FileCheck className="w-3 h-3 text-green-600" />
              </Button>
            </motion.div>
          )}
          {onGenerateAI && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onGenerateAI(application)
                }}
                className="h-7 w-7 p-0 hover:bg-purple-100/80 backdrop-blur"
                title="Generate AI Documents"
              >
                <Sparkles className="w-3 h-3 text-purple-600" />
              </Button>
            </motion.div>
          )}
          {onEdit && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(application)}
                className="h-7 w-7 p-0 hover:bg-blue-100/80 backdrop-blur"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
          {onDelete && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(application.id)}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100/80 backdrop-blur"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </motion.div>

      {/* Details */}
      <div className="space-y-1.5 mb-3">
        {application.location && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 text-xs text-slate-600"
          >
            <MapPin className="w-3 h-3 shrink-0 text-blue-500" />
            <span className="truncate">{application.location}</span>
          </motion.div>
        )}

        {formatSalary(application.salary_min, application.salary_max) && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 text-xs text-slate-600"
          >
            <DollarSign className="w-3 h-3 shrink-0 text-green-500" />
            <span>{formatSalary(application.salary_min, application.salary_max)}</span>
          </motion.div>
        )}

        {application.date_applied && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 text-xs text-slate-600"
          >
            <Calendar className="w-3 h-3 shrink-0 text-amber-500" />
            <span>Applied {format(new Date(application.date_applied), "MMM d")}</span>
          </motion.div>
        )}
      </div>

      {/* AI Documents Badge */}
      {hasDocuments && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-3"
        >
          <Badge className="bg-linear-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 text-xs shadow-sm hover:shadow-md transition-shadow">
            <FileCheck className="w-3 h-3 mr-1" />
            AI Docs Ready
          </Badge>
        </motion.div>
      )}

      {/* Notes Preview */}
      {application.notes && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-slate-600 mb-3 line-clamp-2 bg-linear-to-r from-blue-50/60 to-cyan-50/60 backdrop-blur-sm p-2.5 rounded-lg border border-blue-100/50 hover:border-blue-200/80 transition-colors"
        >
          {application.notes}
        </motion.p>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center justify-between pt-3 border-t border-blue-100/40"
      >
        <Badge
          className={`${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor} text-xs font-medium shadow-sm`}
        >
          {statusConfig.label}
        </Badge>

        {application.application_url && (
          <motion.a
            whileHover={{ x: 2 }}
            href={application.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </motion.a>
        )}
      </motion.div>
    </motion.div>
  )
}
