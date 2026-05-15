"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
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
        throw new Error(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
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
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 relative overflow-hidden font-outfit">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-neon/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-neon/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-brand-surface rounded-[2.5rem] shadow-2xl border border-white/5 p-8 sm:p-12 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-brand-neon/10 text-brand-neon mb-6 border border-brand-neon/20 shadow-glow-sm">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9V5.2a2 2 0 0 1 2-2h15.3a2 2 0 0 1 2 2V9" />
              <path d="M22 15V18.8a2 2 0 0 1-2 2H4.7a2 2 0 0 1-2-2V15" />
              <path d="M13 15h.01" />
              <path d="M11 15h.01" />
              <path d="M15 15h.01" />
              <path d="M9 15h.01" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-3">
            Welcome back
          </h1>
          <p className="text-gray-400 font-medium">
            Sign in to manage your FanPass account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 text-red-500 text-sm border border-red-500/20 font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@fanpass.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border-2 border-white/5 text-white placeholder:text-gray-600 focus:border-brand-neon/50 focus:bg-white/10 focus:outline-none transition-all"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border-2 border-white/5 text-white placeholder:text-gray-600 focus:border-brand-neon/50 focus:bg-white/10 focus:outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-4 px-6 rounded-2xl font-bold tracking-tight bg-brand-neon text-bg hover:shadow-glow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-4"
          >
            {isLoading ? "AUTHENTICATING..." : "SIGN IN"}
          </button>
        </form>
      </div>
      <p className="mt-8 text-gray-500 text-sm font-medium">
        Contact support if you lost your access
      </p>
    </div>
  );
}
