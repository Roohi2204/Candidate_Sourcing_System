"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import CandidateNavbar from "@/components/candidate/Navbar";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const jobId = params?.id;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;
    api.get(`/jobs/public/${jobId}`)
      .then((res) => {
        setJob(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [jobId]);

  const handleApplyClick = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/apply/${jobId}`);
    } else {
      router.push(`/apply/${jobId}`);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(currentUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareText = job ? `Check out this opening for ${job.job_title} at TalentBridge (${job.location})!` : "Check out this job opening on TalentBridge!";
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(shareText);

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: job?.job_title || "Job Opportunity",
          text: shareText,
          url: currentUrl,
        });
      } catch (err) {
        // Fallback to modal
      }
    } else {
      setShowShareModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <CandidateNavbar />
        <div className="max-w-6xl mx-auto p-12 text-center text-slate-400">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <CandidateNavbar />
        <div className="max-w-6xl mx-auto p-12 text-center">
          <p className="text-red-500 font-semibold mb-4">Job requisition not found or closed.</p>
          <Link href="/" className="text-indigo-600 hover:underline">← Back to job listings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <CandidateNavbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition">
          <span>←</span> Back to job listings
        </Link>

        {/* Top Hero Card (Screenshot 1) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-md border border-indigo-100">
                  {job.department}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Requisition ID: <strong className="text-slate-600 font-semibold">REQ-2026-0000{job.id}</strong>
                </span>
              </div>

              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                {job.job_title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  📍 {job.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  💼 {job.employment_type}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  🕒 Exp: {job.experience_range}
                </span>
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition shadow-sm hover:border-slate-300"
              >
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Position
              </button>

              <button
                onClick={handleApplyClick}
                disabled={user?.role === "admin"}
                className={`bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-indigo-500/20 transition ${user?.role === "admin" ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
              >
                {user?.role === "admin" ? "Admin View" : "Apply Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Share Modal Dialog */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Share Job Requisition</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{job.job_title} &bull; {job.location}</p>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition"
                >
                  ✕
                </button>
              </div>

              {/* Social Channels Grid */}
              <div className="grid grid-cols-4 gap-3 mb-6 text-center">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-900">WhatsApp</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-100 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0077b5] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-900">LinkedIn</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800">X / Twitter</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Job Opportunity: ${job.job_title}`)}&body=${encodeURIComponent(`${shareText}\n\nApply here: ${currentUrl}`)}`}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-900">Email</span>
                </a>
              </div>

              {/* Direct Link Copy Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Or copy direct link</label>
                <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded-2xl bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="w-full bg-transparent px-2.5 text-xs text-slate-600 outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <span>✓</span> Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Two-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Job Description */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
            <h2 className="text-lg font-bold text-slate-900 pb-4 border-b border-slate-100 mb-6">
              Job Description
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-4">
              {job.description}
            </div>
          </div>

          {/* Right: Job Overview Card (Screenshot 1) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase pb-3 border-b border-slate-100">
              JOB OVERVIEW
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Department</p>
                <p className="text-slate-900 font-semibold mt-0.5">{job.department}</p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Location</p>
                <p className="text-slate-900 font-semibold mt-0.5">{job.location}</p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Employment Type</p>
                <p className="text-slate-900 font-semibold mt-0.5">{job.employment_type}</p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Experience Range</p>
                <p className="text-slate-900 font-semibold mt-0.5">{job.experience_range}</p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Total Openings</p>
                <p className="text-slate-900 font-semibold mt-0.5">2 Positions</p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Hiring Manager</p>
                <p className="text-slate-900 font-semibold mt-0.5">Talent Acquisition Lead</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleApplyClick}
                disabled={user?.role === "admin"}
                className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md shadow-indigo-500/20 transition text-center block ${user?.role === "admin" ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
              >
                {user?.role === "admin" ? "Admin View" : "Apply For This Position"}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2.5">
                Authentication is required before submitting your application.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
