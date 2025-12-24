import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

// Make sure this is server-side only

export async function POST(req: Request) {
  const { userId, email, username } = await req.json();

  if (!userId || !email || !username) {
    return NextResponse.json(
      { error: "Missing userId, email, or username" },
      { status: 400 }
    );
  }

  // Check environment variables
  const EMAIL_USER = process.env.GMAIL_USER;
  const EMAIL_PASS = process.env.GMAIL_PASS;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("EMAIL_USER or EMAIL_PASS not defined!");
    return NextResponse.json(
      { error: "Server email not configured" },
      { status: 500 }
    );
  }

  try {
    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS, // App password, no spaces
      },
    });

    // Create a simple verification link (you can improve this)
    const verifyLink = `${
      process.env.NEXT_PUBLIC_BASE_URL
    }/verify?userId=${userId}&username=${encodeURIComponent(
      username
    )}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: `"MakeAFood" <${EMAIL_USER}>`,
      to: email,
      subject: "Please verify your email",
      html: `
        <h2>Welcome to MakeAFood!</h2>
        <p>Click the link below to verify your account:</p>
        <a href="${verifyLink}">Verify Email</a>
        <p>If you did not sign up, ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Verification email sent to ${email}`);
    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
