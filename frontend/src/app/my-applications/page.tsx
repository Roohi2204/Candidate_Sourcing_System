"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CandidateNavbar from "@/components/candidate/Navbar";

export default function MyApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/my-applications");
      return;
    }

    if (user) {
      api.get("/applications/my-applications")
        .then((res) => {
          setApplications(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user, authLoading, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold uppercase">Submitted (New)</span>;
      case "reviewed":
        return <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold uppercase">Under Review</span>;
      case "shortlisted":
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold uppercase">Shortlisted</span>;
      case "rejected":
        return <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold uppercase">Not Selected</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-full font-bold uppercase">{status}</span>;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <CandidateNavbar />
        <div className="max-w-4xl mx-auto p-12 text-center text-slate-400">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
      <CandidateNavbar />

      <main className="max-w-4xl w-full mx-auto px-6 py-10 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My Applications</h1>
            <p className="text-xs text-slate-500 mt-1">Track and monitor your active job submissions.</p>
          </div>
          <Link
            href="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            Browse More Jobs &rarr;
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
            <p className="text-slate-500 font-medium mb-3">You haven't applied to any job requisitions yet.</p>
            <Link href="/" className="text-indigo-600 hover:underline text-xs font-semibold">
              Explore open positions and apply
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 hover:border-indigo-200 hover:shadow-md transition duration-200"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {app.job?.job_title || `Role Application (Job #${app.job_id})`}
                    </h2>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 font-medium">
                    {app.job?.department && (
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md font-semibold border border-indigo-100/60">
                        {app.job.department}
                      </span>
                    )}
                    {app.job?.location && (
                      <span className="flex items-center gap-1 text-slate-600">
                        📍 {app.job.location}
                      </span>
                    )}
                    <span>&bull;</span>
                    <span>
                      App ID: <strong className="text-slate-700 font-bold">#APP-{String(app.id).padStart(5, '0')}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Req ID: <strong className="text-slate-700 font-bold">REQ-2026-00{app.job_id}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                    <span className="text-slate-400">
                      Submitted: <span className="text-slate-600 font-semibold">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString("en-GB") : "Draft"}</span>
                    </span>

                    {app.resume_url && (
                      <a
                        href={app.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Submitted Resume &rarr;
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400">
                    Last Updated: {new Date(app.updated_at).toLocaleDateString("en-GB")}
                  </span>
                  <Link
                    href={`/jobs/${app.job_id}`}
                    className="text-xs text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    View Job Posting &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
