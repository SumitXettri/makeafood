import { Suspense } from "react";
import ResetPasswordClient from "./ResetPassword";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading reset page...
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
