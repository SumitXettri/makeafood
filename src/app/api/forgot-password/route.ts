import { supabase } from "@/lib/supabaseClient";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json();
  const url = process.env.NEXT_PUBLIC_BASE_URL;

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  // 1. Find user
  const { data: user } = await supabase
    .from("users")
    .select("id, username")
    .eq("email", email)
    .single();

  if (!user) {
    return Response.json({ message: "If email exists, reset link sent" });
  }

  const { username } = user;

  // 2. Generate token
  const token = crypto.randomBytes(32).toString("hex");

  // 3. Store token
  await supabase.from("password_resets").insert({
    user_id: user.id,
    token,
    expires_at: new Date(Date.now() + 1000 * 60 * 30), // 30 min
  });

  // 4. Send email (manual)
  const resetLink = `${url}/reset-password?token=${token}`;

  await sendEmail(email, username, resetLink); // Gmail / EmailJS / Nodemailer

  return Response.json({ message: "Reset link sent" });
}
