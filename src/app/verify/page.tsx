"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const [message, setMessage] = useState("Verifying your email...");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function verify() {
      const userId = searchParams.get("userId");
      const username = searchParams.get("username");
      const email = searchParams.get("email");

      if (!userId || !email || !username) {
        setMessage("Invalid verification link.");
        setIsSuccess(false);
        setIsLoading(false);
        return;
      }

      try {
        // Simulating the verification process
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // In your actual implementation, replace this with your Supabase logic
        setMessage("Email verified successfully!");
        setIsSuccess(true);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setMessage("Verification failed. Please try again later.");
        setIsSuccess(false);
        setIsLoading(false);
      }
    }

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">MakeAFood</h1>
          <p className="text-gray-600">Your culinary companion</p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {isLoading ? (
              <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            ) : isSuccess ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {isLoading ? "Verifying..." : isSuccess ? "Success!" : "Oops!"}
            </h2>
            <p className="text-gray-600">{message}</p>
          </div>

          {/* Action Button */}
          {!isLoading && (
            <div className="space-y-3">
              {isSuccess && (
                <Link
                  href="/login"
                  className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 text-center"
                >
                  Go to Login
                </Link>
              )}
              <a
                href="/"
                className={`block w-full ${
                  isSuccess
                    ? "bg-white hover:bg-gray-50 text-orange-600 border-2 border-orange-600"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                } font-semibold py-3 px-6 rounded-lg transition duration-200 text-center`}
              >
                Go to Signup
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a
              href="/contact"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
