"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const updatePasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function UpdatePasswordPage() {
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = updatePasswordSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      toast.success("Password updated successfully! Please login again. 🎉");
      await supabase.auth.signOut(); 
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

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
              <Lock className="w-6 h-6 text-slate-700" />
            </div>
          </div>

          <h1 className="text-center text-2xl font-semibold text-slate-900 mb-2">Set New Password</h1>
          <p className="text-center text-sm text-slate-500 mb-8">Please enter your new password below</p>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                name="password"
                type={showPassword ? "text" : "password"} 
                placeholder="New Password" 
                value={formData.password} 
                onChange={handleChange} 
                disabled={loading} 
                className="h-11 pl-11 pr-11 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white" 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                name="confirmPassword"
                type="password" 
                placeholder="Confirm New Password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                disabled={loading} 
                className="h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white" 
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}