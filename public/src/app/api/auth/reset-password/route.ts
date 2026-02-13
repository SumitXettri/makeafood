import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return Response.json(
      { error: "Token and password required" },
      { status: 400 }
    );
  }

  // 1. Verify token
  const { data: resetRecord, error: fetchError } = await supabaseAdmin
    .from("password_resets")
    .select("user_id, expires_at")
    .eq("token", token)
    .single();

  if (fetchError || !resetRecord) {
    return Response.json(
      { error: "Invalid or expired token" },
      { status: 400 }
    );
  }

  if (new Date() > new Date(resetRecord.expires_at)) {
    return Response.json({ error: "Token expired" }, { status: 400 });
  }

  // 2. Update password using admin auth
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    resetRecord.user_id,
    { password }
  );

  if (updateError) {
    return Response.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }

  // 3. Delete the token
  await supabaseAdmin.from("password_resets").delete().eq("token", token);

  return Response.json({ message: "Password reset successfully" });
}
