import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    // 1. Get the token from the Authorization header (matching your frontend)
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Create Supabase client using the token directly
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader, // Pass the 'Bearer ...' string directly
          },
        },
      }
    );

    // 3. Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 4. Fetch the resume
    const { data, error } = await supabase
      .from("user_profiles")
      .select("resume_text")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // It's okay if they haven't saved a resume yet, just return empty
      return NextResponse.json({ resume_text: "" });
    }

    return NextResponse.json({ resume_text: data?.resume_text || "" });
  } catch (error) {
    console.error("Error in get-resume:", error);
    return NextResponse.json({ resume_text: "" }, { status: 500 });
  }
}