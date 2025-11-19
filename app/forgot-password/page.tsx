"use client";
import { useState, useEffect } from "react"; // Added useEffect
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim(),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  // Get origin on mount to avoid hydration mismatch
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentOrigin = window.location.origin || 'http://localhost:3000';
    
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      // Construct the redirect URL explicitly
      // This creates: http://localhost:3000/auth/callback?next=/update-password
      const redirectTo = `${currentOrigin}/auth/callback?next=/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) throw error;
      
      toast.success("Check your email for the reset link! 📧");
      setEmail(""); 
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your JSX remains exactly the same ...
  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Nov%208%2C%202025%2C%2005_13_59%20PM-vsQdr0iwJRYTDLnsGeNxnTFBLB1dsR.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-blue-100/40">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-slate-700" />
            </div>
          </div>

          <h1 className="text-center text-2xl font-semibold text-slate-900 mb-2">Reset Password</h1>
          <p className="text-center text-sm text-slate-500 mb-8">Enter your email to receive a reset link</p>

          <form onSubmit={handleReset} className="space-y-4 mb-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="email" 
                placeholder="Email address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={loading} 
                className="h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white" 
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>

          <div className="text-center">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}