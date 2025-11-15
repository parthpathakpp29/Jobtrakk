"use client";
import { useAuth } from "@/lib/AuthProviderContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

export default function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      variant="outline" 
      size="sm"
      disabled={loading}
      className="cursor-pointer"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}