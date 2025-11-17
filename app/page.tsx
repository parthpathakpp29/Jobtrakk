"use client"

import { useAuth } from "@/lib/AuthProviderContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, loading, router])

  
  return (
    <div className="min-h-screen p-8 flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto space-y-8 w-full">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}
