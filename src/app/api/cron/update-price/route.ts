import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Database writes are now handled exclusively by the Python backend via CRON.
    return NextResponse.json({ success: true, message: "Pricing is now managed by the Python backend." });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
