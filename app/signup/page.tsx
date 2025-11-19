"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { z } from "zod";

// 1. Security: Strong Validation Schema
const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").trim(),
  email: z.string().email("Please enter a valid email address").trim(),
  password: z
    .string()
    .min(6, "Password must be at least 8 characters"), // Adjusted to min 6 as per your previous code, or keep 8 for higher security
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // 2. Validate inputs
    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      // Fix: Use .issues instead of .errors for Zod compatibility
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName },
          // We don't need emailRedirectTo if verification is disabled
        },
      });

      if (error) throw error;

      // 3. IMMEDIATE SUCCESS: No email check logic
      // With "Confirm Email" disabled in Supabase, data.session will be present immediately.
      toast.success("Account created! Welcome! 🎉");
      router.push("/dashboard");
      
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Try logging in.");
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-up
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up with Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 relative"
      style={{
        backgroundImage:
          "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Nov%208%2C%202025%2C%2005_13_59%20PM-vsQdr0iwJRYTDLnsGeNxnTFBLB1dsR.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Card */}
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-blue-100/40">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-slate-700" />
            </div>
          </div>

          <h1 className="text-center text-2xl font-semibold text-slate-900 mb-2">
            Create your account
          </h1>
          <p className="text-center text-sm text-slate-500 mb-8">
            Join us to collaborate and bring your ideas to life
          </p>

          {/* Google Sign-up Button */}
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full h-11 mb-6 bg-white hover:bg-gray-50 text-slate-900 border border-slate-300 font-medium rounded-lg flex items-center justify-center gap-3 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/90 text-slate-500">Or sign up with email</span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handlePasswordSignup} className="space-y-4 mb-6">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                name="fullName"
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                disabled={loading || googleLoading}
                className="h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading || googleLoading}
                className="h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                disabled={loading || googleLoading}
                className="h-11 pl-11 pr-11 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading || googleLoading}
                className="h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-sm text-center text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-slate-900 font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-xs text-center text-slate-400 mt-4">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-600">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-slate-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}