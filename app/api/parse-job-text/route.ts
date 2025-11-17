// app/api/parse-job-text/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ 
        error: "Please paste job description text (at least 50 characters)" 
      }, { status: 400 });
    }

    console.log("Processing pasted text, length:", text.length);

    // Use AI to extract structured data from pasted text
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "GEMINI_API_KEY is not configured" 
      }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are a job posting parser. Extract the following details from this job posting text.
The text may be copied from any job board (LinkedIn, Indeed, Unstop, Naukri, company websites, etc.).

Return ONLY a valid JSON object with these exact keys (no markdown, no explanation, no preamble):

{
  "company_name": "company name",
  "job_title": "job title/position",
  "location": "location (city, state/country) or 'Remote'",
  "salary_min": salary minimum as number only (e.g., 100000) or null,
  "salary_max": salary maximum as number only (e.g., 150000) or null,
  "job_description": "brief 2-3 sentence summary of the role",
  "requirements": "key requirements or qualifications",
  "benefits": "benefits or perks mentioned, if any",
  "application_url": "application URL if mentioned, otherwise null"
}

Important rules:
- If a field is not found, use null (not empty string)
- For salary, extract ONLY numbers without any symbols or currency (e.g., 100000 not "₹1,00,000" or "$100k")
- If salary is in lakhs (e.g., "5-8 LPA"), convert to actual numbers (e.g., 500000-800000)
- Be precise and extract only what's explicitly stated
- Keep descriptions concise
- Look for application links in the text

Job Posting Text:
${text.substring(0, 20000)}
`;

    console.log("Sending to Gemini...");

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (aiError: any) {
      console.error("Gemini API error:", aiError);
      return NextResponse.json({ 
        error: "AI processing failed. Please try again." 
      }, { status: 500 });
    }

    const aiResponse = result.response.text();
    console.log("AI Response received:", aiResponse.substring(0, 200));

    // Clean up AI response
    let cleanResponse = aiResponse.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\n?/g, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", cleanResponse);
      return NextResponse.json({ 
        error: "Failed to parse AI response. Please try again." 
      }, { status: 500 });
    }

    // Combine requirements and benefits into notes
    const noteParts = [];
    if (parsed.job_description) noteParts.push(parsed.job_description);
    if (parsed.requirements) noteParts.push(`\n\nRequirements:\n${parsed.requirements}`);
    if (parsed.benefits) noteParts.push(`\n\nBenefits:\n${parsed.benefits}`);

    // Return data in the format expected by frontend
    const responseData = {
      company_name: parsed.company_name || null,
      job_title: parsed.job_title || null,
      location: parsed.location || null,
      salary_min: parsed.salary_min || null,
      salary_max: parsed.salary_max || null,
      application_url: parsed.application_url || null,
      notes: noteParts.join('') || null,
    };

    console.log("Returning parsed data:", responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";