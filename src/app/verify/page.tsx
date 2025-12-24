"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const [message, setMessage] = useState("Verifying...");
  const searchParams = useSearchParams(); // hook to safely access query params

  useEffect(() => {
    async function verify() {
      const userId = searchParams.get("userId");
      const username = searchParams.get("username");
      const email = searchParams.get("email");

      console.log(userId, username, email);
      if (!userId || !email || !username) {
        setMessage("Invalid verification link.");
        return;
      }

      try {
        // Check if user already exists in public.users
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (!existingUser) {
          // Insert into public.users
          const { error: insertError } = await supabase.from("users").insert([
            {
              id: userId,
              username,
              email,
              is_verified: true, // mark verified on insert
            },
          ]);

          if (insertError) {
            setMessage("Failed to create user profile. Try again later.");
            return;
          }
        } else {
          // If exists, just mark verified
          await supabase
            .from("users")
            .update({ is_verified: true })
            .eq("id", userId);
        }

        setMessage("Email verified! You can now log in.");
      } catch (err) {
        console.error(err);
        setMessage("Verification failed. Try again later.");
      }
    }

    verify();
  }, [searchParams]);

  return <h1>{message}</h1>;
}
