// app/api/generate-documents/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription, companyName, jobTitle } = await request.json();

    // Validation
    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume and job description are required" },
        { status: 400 }
      );
    }

    // ✅ FIX 1: Use the 'gemini-1.5-flash-latest' model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate Cover Letter
    const coverLetterPrompt = `
You are a professional career coach and expert cover letter writer.

JOB DETAILS:
Company: ${companyName || "the company"}
Position: ${jobTitle || "the position"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

TASK:
Write a compelling, professional cover letter (250-300 words) that:
1. Shows genuine enthusiasm for the role
2. Highlights 2-3 most relevant experiences from the resume that match the job requirements
3. Demonstrates understanding of the company/role
4. Explains why the candidate is a great fit
5. Ends with a strong call to action

FORMAT:
- Professional business letter format
- No address/date headers (start with "Dear Hiring Manager,")
- 3-4 paragraphs
- Warm but professional tone
- No generic phrases like "I am writing to apply"

Write only the cover letter content, no preamble or explanation.
`;

    // ✅ FIX 2: Use the new object-based API call format
    const coverLetterResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: coverLetterPrompt }] }],
    });
    const coverLetter = coverLetterResult.response.text();

    // Generate Referral Email
    const referralEmailPrompt = `
You are a professional career coach helping someone request a referral.

JOB DETAILS:
Company: ${companyName || "the company"}
Position: ${jobTitle || "the position"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

TASK:
Write a professional, friendly email (150-200 words) requesting a referral that:
1. Has a clear, specific subject line
2. Briefly introduces yourself (1 sentence from resume highlights)
3. Mentions the specific role you're interested in
4. Explains why you're excited about the company (based on JD)
5. Highlights 1-2 relevant skills/experiences
6. Politely asks if they'd be willing to refer you
7. Offers to provide more information if needed
8. Thanks them for their time

FORMAT:
Subject: [Your subject line]

Hi [Employee Name],

[Email body]

Best regards,
[Your Name]

TONE: Professional but warm and personable, not too formal or robotic.

Write only the email with subject line, no preamble or explanation.
`;

    // ✅ FIX 3: Use the new object-based API call format here too
    const referralEmailResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: referralEmailPrompt }] }],
    });
    const referralEmail = referralEmailResult.response.text();

    return NextResponse.json({
      coverLetter: coverLetter.trim(),
      referralEmail: referralEmail.trim(),
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Handle specific Gemini errors
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your Gemini API key." },
        { status: 401 }
      );
    }
    
    if (error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "API quota exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate documents. Please try again." },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs"; // This line was misplaced in your file, added it back correctly.