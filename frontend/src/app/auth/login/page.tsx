"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      
      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      await login(response.data.access_token);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111422] text-white">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">
            T
          </div>
          <span className="font-bold text-lg tracking-wide">TalentBridge</span>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition">Browse Jobs</Link>
          <div className="bg-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold">Login / Sign Up</div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 text-slate-800 shadow-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
              💼
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-1">Sign in to Apply</h2>
          <p className="text-xs text-slate-500 text-center mb-6">Authentication required before submitting application</p>

          <div className="flex bg-slate-50 rounded-lg p-1 mb-6 border border-slate-100">
            <button className="flex-1 bg-white shadow-sm rounded-md py-2 text-sm font-bold text-indigo-600">Sign In</button>
            <Link href="/auth/register" className="flex-1 rounded-md py-2 text-sm font-semibold text-slate-500 text-center hover:text-slate-700">Create Account</Link>
          </div>

          {error && <p className="text-red-500 text-xs font-semibold mb-4 text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password *</label>
                <a href="#" className="text-[10px] font-semibold text-indigo-600 hover:underline">Forgot Password?</a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold shadow-md shadow-indigo-500/20 transition mt-2">
              Sign In & Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
