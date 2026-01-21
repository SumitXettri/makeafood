import { NextRequest, NextResponse } from "next/server";
import { sendWarningEmail } from "../../../lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, username, reason } = await request.json();

    if (!email || !username || !reason) {
      return NextResponse.json(
        { error: "Email, username, and reason are required" },
        { status: 400 }
      );
    }

    await sendWarningEmail(email, username, reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending warning email:", error);
    return NextResponse.json(
      { error: "Failed to send warning email" },
      { status: 500 }
    );
  }
}