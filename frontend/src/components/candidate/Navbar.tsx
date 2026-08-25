"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function CandidateNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-[#131728] text-white px-8 py-3.5 flex justify-between items-center shadow-md sticky top-0 z-30">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">TalentBridge</span>
      </Link>

      {/* Nav Actions */}
      <div className="flex items-center gap-6 text-sm font-medium">
        <Link href="/" className="text-slate-300 hover:text-white transition">
          Browse Jobs
        </Link>

        {user ? (
          <>
            <Link href="/my-applications" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Applications
            </Link>

            {user.role === "admin" && (
              <Link href="/admin/dashboard" className="text-purple-400 hover:text-purple-300 transition">
                Admin Console
              </Link>
            )}

            {/* User Pill */}
            <div className="flex items-center gap-3 bg-[#1e2338] px-3.5 py-1.5 rounded-full border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs">
                {user.email?.charAt(0).toLowerCase()}
              </div>
              <span className="text-xs text-slate-200 font-semibold">{user.email?.split("@")[0]}</span>
              <button
                onClick={logout}
                title="Logout"
                className="text-slate-400 hover:text-red-400 text-sm ml-1 transition"
              >
                ➔
              </button>
            </div>
          </>
        ) : (
          <Link
            href="/auth/login"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            Login / Sign Up
          </Link>
        )}
      </div>
    </header>
  );
}
