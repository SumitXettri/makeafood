import { supabase } from "@/lib/supabaseClient";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = params.token as string;

  if (!token) return <p>Invalid verification link</p>;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("verify_token", token)
    .single();

  if (!user) return <p>Invalid or expired link</p>;

  if (new Date(user.verify_token_expires_at) < new Date()) {
    return <p>Verification link expired</p>;
  }

  await supabase
    .from("users")
    .update({
      is_verified: true,
      verify_token: null,
      verify_token_expires_at: null,
    })
    .eq("id", user.id);

  return <p>Your account is verified 🎉 You can now log in.</p>;
}
