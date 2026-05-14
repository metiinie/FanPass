"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState<"PHONE" | "EMAIL">("PHONE");
  const [step, setStep] = useState<"PHONE" | "CODE">("PHONE");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setStep("CODE");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        phone,
        code,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#111827] tracking-wide mb-2 font-['Outfit']">
            Welcome back
          </h1>
          <p className="text-[#6B7280]">
            {loginMode === "EMAIL" 
              ? "Sign in with your email" 
              : step === "PHONE" 
                ? "Enter your phone number to sign in" 
                : "Enter the 6-digit code sent to your phone"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-500 text-sm border border-red-100">
            {error}
          </div>
        )}

        {loginMode === "EMAIL" ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#111827] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#111827] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 px-4 rounded-xl font-semibold tracking-wide bg-[#1A7A4A] text-white hover:bg-[#0F4D2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("PHONE")}
              className="w-full py-2 text-sm text-[#6B7280] hover:text-[#111827]"
            >
              Back to Phone Login
            </button>
          </form>
        ) : step === "PHONE" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#111827] mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+251..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !phone}
              className="w-full py-3 px-4 rounded-xl font-semibold tracking-wide bg-[#1A7A4A] text-white hover:bg-[#0F4D2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Sending..." : "Continue"}
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("EMAIL")}
              className="w-full py-2 text-sm text-[#6B7280] hover:text-[#111827]"
            >
              Admin/Staff Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-[#111827] mb-1">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#1A7A4A] focus:outline-none transition-colors tracking-widest text-center text-lg"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full py-3 px-4 rounded-xl font-semibold tracking-wide bg-[#1A7A4A] text-white hover:bg-[#0F4D2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Verifying..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => setStep("PHONE")}
              className="w-full py-2 text-sm text-[#6B7280] hover:text-[#111827]"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
