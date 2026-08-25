"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import CandidateNavbar from "@/components/candidate/Navbar";

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/jobs/public")
      .then((res) => {
        setJobs(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !search ||
      job.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase()) ||
      job.description?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || job.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(jobs.map((j) => j.department)));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
      <CandidateNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#131728] to-[#1c223b] text-white py-16 px-6 text-center shadow-inner">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/40">
            Talent Sourcing Portal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 text-white">
            Find Your Next Opportunity
          </h1>
          <p className="text-sm md:text-base text-slate-300 mt-3 max-w-xl mx-auto">
            Discover roles across Engineering, Design, Product, and Operations. Apply in minutes with our guided application process.
          </p>

          {/* Search Bar */}
          <div className="mt-8 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 shadow-2xl">
            <input
              type="text"
              placeholder="Search by job title, skill, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 bg-white text-slate-900 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-4 py-3 bg-white text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Job Listings Grid */}
      <main className="max-w-6xl w-full mx-auto px-6 py-12 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Open Positions ({filteredJobs.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore active requisitions and submit your profile.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading open positions...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <p className="text-slate-500 font-medium">No job requisitions match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-indigo-100">
                      {job.department}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      REQ-2026-00{job.id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                    {job.job_title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-600 mb-6">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md">📍 {job.location}</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md">💼 {job.employment_type}</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md">🕒 {job.experience_range}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm shadow-indigo-500/20 transition"
                  >
                    View Details & Apply &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-[#131728] text-slate-400 py-6 text-center text-xs border-t border-slate-800">
        <p>© 2026 TalentBridge Candidate Sourcing System. All rights reserved.</p>
      </footer>
    </div>
  );
}
