import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

export async function POST(req: Request) {
  const { userId, email } = await req.json();

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Save token
  await supabase
    .from("users")
    .update({
      verify_token: token,
      verify_token_expires_at: expiresAt,
    })
    .eq("id", userId);

  // Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  console.log(process.env.EMAIL_USER);
  console.log(!!process.env.EMAIL_PASS);

  await transporter.sendMail({
    from: "MakeAfood <yourgmail@gmail.com>",
    to: email,
    subject: "Verify your MakeAfood account",
    html: `
      <h2>Welcome to MakeAfood 👋</h2>
      <p>Please verify your email:</p>
      <a href="https://makeafood.vercel.app/verify?token=${token}">
        Verify Account
      </a>
      <p>This link expires in 24 hours.</p>
    `,
  });

  return NextResponse.json({ success: true });
}
