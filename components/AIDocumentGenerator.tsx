"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Copy, Download, CheckCircle2, FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import { Application } from "@/types";

interface AIDocumentGeneratorProps {
  open: boolean;
  onClose: () => void;
  application: Application;
  onSave?: (coverLetter: string, referralEmail: string) => void;
}

export default function AIDocumentGenerator({
  open,
  onClose,
  application,
  onSave,
}: AIDocumentGeneratorProps) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState(application.notes || "");
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [copiedCover, setCopiedCover] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleGenerate = async () => {
    if (!resumeText.trim()) {
      toast.error("Please paste your resume");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Please paste the job description");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          companyName: application.company_name,
          jobTitle: application.job_title,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate documents");
      }

      const data = await response.json();
      setCoverLetter(data.coverLetter);
      setReferralEmail(data.referralEmail);
      toast.success("Documents generated successfully! ✨");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate documents");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "cover" | "email") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "cover") {
        setCopiedCover(true);
        setTimeout(() => setCopiedCover(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const downloadAsText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const handleSave = () => {
    if (onSave && coverLetter && referralEmail) {
      onSave(coverLetter, referralEmail);
      toast.success("Documents saved!");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Document Generator
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Generate tailored cover letter and referral email for{" "}
            <span className="font-semibold text-slate-700">
              {application.job_title} at {application.company_name}
            </span>
          </p>
        </DialogHeader>

        {!coverLetter ? (
          // Input Form
          <div className="space-y-6 mt-4">
            {/* Resume Input */}
            <div>
              <Label htmlFor="resume" className="text-base font-semibold mb-2 block">
                📄 Your Resume
              </Label>
              <Textarea
                id="resume"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Tip: Copy from your PDF/Word resume and paste here
              </p>
            </div>

            {/* Job Description Input */}
            <div>
              <Label htmlFor="jd" className="text-base font-semibold mb-2 block">
                📋 Job Description
              </Label>
              <Textarea
                id="jd"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Copy from the job posting and paste here
              </p>
            </div>

            {/* Generate Button */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Documents
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Results Display
          <Tabs defaultValue="cover" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cover" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Cover Letter
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Referral Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cover" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Cover Letter
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(coverLetter, "cover")}
                      >
                        {copiedCover ? (
                          <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadAsText(
                            coverLetter,
                            `cover-letter-${application.company_name}.txt`
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                      {coverLetter}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Referral Request Email
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(referralEmail, "email")}
                      >
                        {copiedEmail ? (
                          <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadAsText(
                            referralEmail,
                            `referral-email-${application.company_name}.txt`
                          )
                        }
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                      {referralEmail}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t cursor-pointer">
              <Button
                variant="outline"
                onClick={() => {
                  setCoverLetter("");
                  setReferralEmail("");
                }}
              >
                Regenerate
              </Button>
              <Button variant="outline"
  className="border-blue-300 text-slate-700 hover:bg-blue-50/40 rounded-xl backdrop-blur-sm cursor-pointer"onClick={onClose}>
                Close
              </Button>
              {onSave && (
                <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer">
                  Save to Application
                </Button>
              )}
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}