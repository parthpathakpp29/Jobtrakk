// app/api/chat-bot/route.ts

import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json();

    // Validation
    if (!userId) {
      return NextResponse.json({ error: "UserId is missing" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Message is missing" }, { status: 400 });
    }

    // Create Supabase client with the user's session
    // Get the auth token from the request headers
    const authHeader = req.headers.get('authorization');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Fetch applications with explicit user_id filter
    const { data: applications, error: dbError } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId);

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Database error", details: dbError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${applications?.length || 0} applications for user ${userId}`);

    // Server deterministic stats
    const totalApplications = applications?.length || 0;

    // Detect upcoming interviews
    const now = new Date();

    const upcoming = (applications || [])
      .map((a) => {
        if (a.interview_date && a.interview_time) {
          return {
            ...a,
            interviewDateTime: new Date(`${a.interview_date}T${a.interview_time}`)
          };
        }
        return { ...a, interviewDateTime: null };
      })
      .filter((a) => a.interviewDateTime && a.interviewDateTime > now)
      .sort((a, b) => a.interviewDateTime.getTime() - b.interviewDateTime.getTime());

    const upcomingInterviews = upcoming.length;

    const nextFive = upcoming.slice(0, 5).map((a) => ({
      company_name: a.company_name,
      job_title: a.job_title,
      interview_at: a.interviewDateTime.toISOString(),
    }));

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const systemPrompt = `
      You are a smart job-application-assistant bot.
      You help users understand their job search progress.

      You have access to the user's applications, interview dates, statuses, notes, and job titles.

      Server-computed facts:
      - Total Applications: ${totalApplications}
      - Upcoming Interviews: ${upcomingInterviews}
      - Next Interviews (first five): ${JSON.stringify(nextFive)}

      Use ONLY these numbers for statistics.
      DO NOT recalculate or guess counts.
      Always be short, clear, and friendly.

      User Applications:
      ${JSON.stringify(applications || [], null, 2)}
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: message }] },
      ],
    });

    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      reply: text,
      stats: {
        totalApplications,
        upcomingInterviews,
        nextFive,
      },
    });

  } catch (err: any) {
    console.error("Chatbot Error:", err);

    return NextResponse.json(
      { error: "Chatbot Error", details: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";