import "./globals.css";
import { AuthProvider } from "@/lib/AuthProviderContext";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Job Tracker - AI-Powered Application Tracking",
  description: "Track your job applications with AI-powered cover letter generation and analytics",
  keywords: ["job tracker", "application tracker", "AI cover letter", "job search"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand={false}
            toastOptions={{
              style: {
                background: "white",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              },
              className: "font-sans",
              duration: 4000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}