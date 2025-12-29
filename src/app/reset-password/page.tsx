import { Suspense } from "react";
import ResetPasswordClient from "./ResetPassword";
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading reset page...</p>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
