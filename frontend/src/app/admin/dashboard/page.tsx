"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminConsole() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [activeNav, setActiveNav] = useState<"dashboard" | "requisitions" | "applications" | "notifications" | "settings">("dashboard");
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Settings State
  const [settingsTab, setSettingsTab] = useState<"profile" | "password" | "notifications" | "system">("profile");
  const [adminProfile, setAdminProfile] = useState({
    firstName: "Amit",
    lastName: "Verma",
    email: "admin@talentbridge.com",
    mobileNumber: "+91 9876543210",
  });

  // Create Requisition Modal State (Includes BRD Page 14 extra fields)
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [newJob, setNewJob] = useState({
    job_title: "",
    department: "Engineering",
    location: "Hyderabad, IN",
    employment_type: "Full-time",
    experience_range: "5-8 years",
    salary_budget: "$120,000 - $150,000",
    hiring_deadline: "",
    description: "",
    status: "open",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, appsRes, notifsRes, unreadRes] = await Promise.all([
        api.get("/jobs/admin"),
        api.get("/applications/admin"),
        api.get("/notifications"),
        api.get("/notifications/unread-count"),
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setNotifications(notifsRes.data);
      setUnreadCount(unreadRes.data.unread_count);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/auth/login");
        return;
      }
      fetchData();
    }
  }, [user, authLoading, router]);

  const openCreateJobModal = () => {
    setEditingJobId(null);
    setNewJob({
      job_title: "",
      department: "Engineering",
      location: "Hyderabad, IN",
      employment_type: "Full-time",
      experience_range: "3-6 years",
      salary_budget: "",
      hiring_deadline: "",
      description: "",
      status: "open",
    });
    setShowJobModal(true);
  };

  const openEditJobModal = (job: any) => {
    setEditingJobId(job.id);
    setNewJob({
      job_title: job.job_title || "",
      department: job.department || "Engineering",
      location: job.location || "Hyderabad, IN",
      employment_type: job.employment_type || "Full-time",
      experience_range: job.experience_range || "",
      salary_budget: job.salary_budget || "",
      hiring_deadline: job.hiring_deadline ? job.hiring_deadline.split("T")[0] : "",
      description: job.description || "",
      status: job.status || "open",
    });
    setShowJobModal(true);
  };

  const handleSaveJob = async (e: React.FormEvent, targetStatus?: string) => {
    e.preventDefault();
    try {
      const payload = {
        ...newJob,
        status: targetStatus || newJob.status,
        hiring_deadline: newJob.hiring_deadline ? new Date(newJob.hiring_deadline).toISOString() : null,
      };

      if (editingJobId) {
        await api.patch(`/jobs/admin/${editingJobId}`, payload);
        alert("Job requisition updated successfully! Changes are now live.");
      } else {
        await api.post("/jobs/admin", payload);
        alert(targetStatus === "open" ? "Job requisition published successfully!" : "Job requisition saved as draft.");
      }

      setShowJobModal(false);
      setEditingJobId(null);
      fetchData();
    } catch (err) {
      alert("Failed to save job requisition.");
    }
  };

  const handleQuickStatusToggle = async (jobId: number, newStatus: string) => {
    try {
      await api.patch(`/jobs/admin/${jobId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Failed to update job status.");
    }
  };

  const handleUpdateStatus = async (appId: number, newStatus: string) => {
    try {
      await api.patch(`/applications/admin/${appId}/status?status=${newStatus}`);
      fetchData();
    } catch (err) {
      alert("Failed to update application status.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/mark-read");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    const headers = ["Application ID", "Job ID", "Candidate Name", "Email", "Phone", "Status", "Experience", "Submitted Date", "Resume URL"];
    const rows = filteredApplications.map((app) => [
      app.id,
      app.job_id,
      `"${app.first_name || ""} ${app.last_name || ""}"`,
      app.email || "",
      app.phone || "",
      app.status,
      app.is_fresher ? "Fresher" : `${app.total_years_experience} yrs`,
      app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "",
      `"${app.resume_url || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `talentbridge_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApplications = applications.filter((app) => {
    const fullName = `${app.first_name || ""} ${app.last_name || ""}`.toLowerCase();
    const email = (app.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = !query || fullName.includes(query) || email.includes(query);
    const matchesJob = selectedJobFilter === "all" || app.job_id === Number(selectedJobFilter);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesJob && matchesStatus;
  });

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading TalentBridge Admin Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      {/* LEFT SIDEBAR (Wireframe 8.7 & 8.8) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <div>
              <h2 className="font-bold text-white tracking-wide text-base leading-tight">TalentBridge</h2>
              <span className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase">Admin Console</span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveNav("dashboard")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeNav === "dashboard" ? "bg-blue-600 text-white shadow-sm" : "hover:bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveNav("requisitions")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeNav === "requisitions" ? "bg-blue-600 text-white shadow-sm" : "hover:bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            📑 Requisitions
          </button>
          <button
            onClick={() => setActiveNav("applications")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeNav === "applications" ? "bg-blue-600 text-white shadow-sm" : "hover:bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            👥 Applications
          </button>
          <button
            onClick={() => setActiveNav("notifications")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeNav === "notifications" ? "bg-blue-600 text-white shadow-sm" : "hover:bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">🔔 Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveNav("settings")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeNav === "settings" ? "bg-blue-600 text-white shadow-sm" : "hover:bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <Link href="/" target="_blank" className="text-blue-400 hover:underline block mb-2 font-medium">
            ↗ Open Public Job Board
          </Link>
          <p>TalentBridge v1.0 BRD Compliant</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-slate-900 capitalize">
              {activeNav === "dashboard" && "Recruitment Overview Dashboard"}
              {activeNav === "requisitions" && "Job Requisitions Management"}
              {activeNav === "applications" && "Applications Review Grid"}
              {activeNav === "notifications" && "Inbound Candidate Alerts"}
              {activeNav === "settings" && "System & SMTP Settings"}
            </h1>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <button
              onClick={() => setActiveNav("notifications")}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              title="Notifications"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Admin Profile Info */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left text-sm">
                <p className="font-semibold text-slate-900 leading-tight">Amit Verma (Admin)</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="ml-2 text-xs bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-md font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* PAGE VIEWS */}
        <main className="p-8">
          {/* 1. DASHBOARD VIEW */}
          {activeNav === "dashboard" && (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Requisitions</span>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">{jobs.filter(j => j.status === 'open').length}</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">✓ Published & Open</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Applications</span>
                  <p className="text-3xl font-extrabold text-blue-600 mt-2">{applications.length}</p>
                  <p className="text-xs text-slate-500 mt-2">Across all requisitions</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Inbound</span>
                  <p className="text-3xl font-extrabold text-amber-500 mt-2">
                    {applications.filter((a) => a.status === "new").length}
                  </p>
                  <p className="text-xs text-amber-600 mt-2 font-medium">Awaiting Recruiter Review</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shortlisted Candidates</span>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                    {applications.filter((a) => a.status === "shortlisted").length}
                  </p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Moved to Next Round</p>
                </div>
              </div>

              {/* Quick Actions & Recent Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900">Recent Candidate Applications</h3>
                    <button
                      onClick={() => setActiveNav("applications")}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View All Applications &rarr;
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {applications.slice(0, 5).map((app) => (
                      <div key={app.id} className="py-3 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{app.first_name} {app.last_name || "Applicant"}</p>
                          <p className="text-xs text-slate-500">{app.email} &bull; Job #{app.job_id}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            app.status === 'new' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'shortlisted' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <p className="text-sm text-slate-400 py-6 text-center">No applications received yet.</p>
                    )}
                  </div>
                </div>

                {/* Quick Requisition Launcher */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Create New Requisition</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                      Define a job position with hiring deadline, salary budget, and publish it instantly to the public career portal.
                    </p>
                  </div>
                  <button
                    onClick={openCreateJobModal}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm shadow transition"
                  >
                    + New Job Requisition
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. REQUISITIONS MANAGEMENT VIEW (Wireframe 8.7) */}
          {activeNav === "requisitions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Job Requisitions</h2>
                  <p className="text-xs text-slate-500">Manage, edit, publish, draft, and close job openings.</p>
                </div>
                <button
                  onClick={openCreateJobModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  + Create Job Requisition
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b">
                    <tr>
                      <th className="p-4">Requisition ID</th>
                      <th className="p-4">Job Title</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Salary Budget</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No job requisitions created yet. Click "+ Create Job Requisition" to get started.
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50">
                          <td className="p-4 font-semibold text-blue-600">REQ-2026-00{job.id}</td>
                          <td className="p-4 font-bold text-slate-900">{job.job_title}</td>
                          <td className="p-4">{job.department}</td>
                          <td className="p-4">{job.location}</td>
                          <td className="p-4">{job.salary_budget || "Not Specified"}</td>
                          <td className="p-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                              job.status === "open"
                                ? "bg-emerald-100 text-emerald-800"
                                : job.status === "closed"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {job.status === "open" ? "Published (Live)" : job.status === "closed" ? "Closed" : "Draft"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit Button */}
                              <button
                                onClick={() => openEditJobModal(job)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 transition flex items-center gap-1"
                              >
                                ✏️ Edit
                              </button>

                              {/* Quick Status Dropdown */}
                              <select
                                value={job.status}
                                onChange={(e) => handleQuickStatusToggle(job.id, e.target.value)}
                                className="text-xs p-1.5 border rounded-lg bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="open">Publish (Live)</option>
                                <option value="draft">Draft</option>
                                <option value="closed">Close</option>
                              </select>

                              {/* View live link if published */}
                              {job.status === "open" && (
                                <Link
                                  href={`/jobs/${job.id}`}
                                  target="_blank"
                                  className="text-xs text-slate-500 hover:text-blue-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
                                  title="View on Public Career Portal"
                                >
                                  ↗
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. APPLICATIONS REVIEW GRID (Wireframe 8.8) */}
          {activeNav === "applications" && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Search candidate name / email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mr-2">Requisition:</label>
                    <select
                      value={selectedJobFilter}
                      onChange={(e) => setSelectedJobFilter(e.target.value)}
                      className="p-2 bg-white border rounded-lg text-sm text-slate-700"
                    >
                      <option value="all">All Requisitions</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>{j.job_title} (#REQ-2026-00{j.id})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mr-2">Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="p-2 bg-white border rounded-lg text-sm text-slate-700"
                    >
                      <option value="all">All Statuses</option>
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={exportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2"
                >
                  📥 Export CSV
                </button>
              </div>

              {/* Grid Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b">
                      <tr>
                        <th className="p-4">Candidate Name</th>
                        <th className="p-4">Applied On</th>
                        <th className="p-4">Experience</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Resume</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            No candidate applications match your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50">
                            <td className="p-4 font-semibold text-slate-900">
                              {app.first_name} {app.last_name || ""}
                            </td>
                            <td className="p-4 text-xs">
                              {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "Draft"}
                            </td>
                            <td className="p-4 text-xs">
                              {app.is_fresher ? "Fresher" : `${app.total_years_experience} yrs`}
                            </td>
                            <td className="p-4 text-xs">
                              <p className="text-slate-800 font-medium">{app.email}</p>
                              <p className="text-slate-400">{app.phone || "No phone"}</p>
                            </td>
                            <td className="p-4">
                              {app.resume_url ? (
                                <a
                                  href={app.resume_url.replace(/^"|"$/g, '').startsWith('http') ? app.resume_url.replace(/^"|"$/g, '') : `https://${app.resume_url.replace(/^"|"$/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:underline font-semibold text-xs"
                                >
                                  View Resume &rarr;
                                </a>
                              ) : (
                                <span className="text-slate-400 text-xs">No attachment</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                                app.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                app.status === 'reviewed' ? 'bg-amber-100 text-amber-800' :
                                app.status === 'shortlisted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                className="text-xs p-1.5 border rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="new">Mark New</option>
                                <option value="reviewed">Mark Reviewed</option>
                                <option value="shortlisted">Shortlist Candidate</option>
                                <option value="rejected">Reject</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS VIEW (Section 10 of Walkthrough) */}
          {activeNav === "notifications" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Inbound Notifications</h2>
                  <p className="text-xs text-slate-500">Real-time alerts for submitted applications.</p>
                </div>
                <button
                  onClick={handleMarkAllRead}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  ✓ Mark all as read
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-sm">No new notifications.</p>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 flex justify-between items-center ${notif.is_read ? 'bg-white' : 'bg-blue-50/50'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{notif.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveNav("applications")}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Review in Grid &rarr;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 5. SETTINGS VIEW (Matches BRD Admin Profile Design) */}
          {activeNav === "settings" && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  ⚙️ Settings
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your admin profile, security, and system preferences.
                </p>
              </div>

              {/* Sub-tab Pills */}
              <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit gap-1 text-xs font-semibold">
                <button
                  onClick={() => setSettingsTab("profile")}
                  className={`px-4 py-2 rounded-lg transition ${
                    settingsTab === "profile"
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => setSettingsTab("password")}
                  className={`px-4 py-2 rounded-lg transition ${
                    settingsTab === "password"
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🔒 Password
                </button>
                <button
                  onClick={() => setSettingsTab("notifications")}
                  className={`px-4 py-2 rounded-lg transition ${
                    settingsTab === "notifications"
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🔔 Notifications
                </button>
                <button
                  onClick={() => setSettingsTab("system")}
                  className={`px-4 py-2 rounded-lg transition ${
                    settingsTab === "system"
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🛡️ System Info
                </button>
              </div>

              {/* Admin Profile Form */}
              {settingsTab === "profile" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-bold text-slate-900">Admin Profile</h3>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); alert("Admin profile updated successfully!"); }} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name</label>
                        <input
                          type="text"
                          value={adminProfile.firstName}
                          onChange={(e) => setAdminProfile({ ...adminProfile, firstName: e.target.value })}
                          className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name</label>
                        <input
                          type="text"
                          value={adminProfile.lastName}
                          onChange={(e) => setAdminProfile({ ...adminProfile, lastName: e.target.value })}
                          className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">✉ Email Address</label>
                      <input
                        type="email"
                        value={adminProfile.email}
                        readOnly
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-100 text-slate-500 cursor-not-allowed"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed. Contact system administrator.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">📞 Mobile Number</label>
                      <input
                        type="text"
                        value={adminProfile.mobileNumber}
                        onChange={(e) => setAdminProfile({ ...adminProfile, mobileNumber: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                      />
                    </div>

                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                      <span className="text-xl">🛡️</span>
                      <div>
                        <p className="text-xs font-bold text-blue-900">Administrator Account</p>
                        <p className="text-[11px] text-blue-700 mt-0.5">Full access to requisitions, applications, and recruiter console.</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2"
                      >
                        💾 Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {settingsTab === "password" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-3">Change Password</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full p-2.5 border rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full p-2.5 border rounded-xl text-xs" />
                  </div>
                  <button onClick={() => alert("Password updated successfully!")} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition">Update Password</button>
                </div>
              )}

              {settingsTab === "notifications" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Notification Preferences</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Control how and when you receive recruiter and candidate updates.</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                      ● SMTP Active
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Alert Setting 1 */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div>
                        <p className="text-xs font-bold text-slate-800">New Candidate Submissions (Email)</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Automatically send an automated confirmation email to candidates upon job application submission.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Alert Setting 2 */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div>
                        <p className="text-xs font-bold text-slate-800">In-App Recruiter Notifications</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Push real-time alert cards to the Admin console when candidate applications are received.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Connected SMTP Box */}
                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📬</span>
                      <div>
                        <p className="text-xs font-bold text-blue-900">Connected SMTP Channel</p>
                        <p className="text-[11px] text-blue-700 font-medium">talentbridge.careers1@gmail.com &bull; Port 587 (TLS)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert("Test notification dispatched to talentbridge.careers1@gmail.com")}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                    >
                      Send Test Alert
                    </button>
                  </div>

                  <div className="pt-2 flex justify-start">
                    <button
                      onClick={() => alert("Notification settings saved successfully!")}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition"
                    >
                      💾 Save Notification Preferences
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === "system" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-3">System & SMTP Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-semibold text-slate-500">Database System</p>
                      <p className="font-bold text-slate-900 mt-1">PostgreSQL 16 (Connected)</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-semibold text-slate-500">SMTP Host</p>
                      <p className="font-bold text-slate-900 mt-1">smtp.gmail.com:587</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CREATE / EDIT JOB REQUISITION MODAL (BRD Page 14) */}
      {showJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingJobId ? `Edit Job Requisition (#REQ-2026-00${editingJobId})` : "Create Job Requisition"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingJobId ? "Update details, requirements, or change live publication status." : "Fill in the requisition details and requirements."}
                </p>
              </div>
              <button
                onClick={() => { setShowJobModal(false); setEditingJobId(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={(e) => handleSaveJob(e, newJob.status)}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={newJob.job_title}
                  onChange={(e) => setNewJob({ ...newJob, job_title: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={newJob.department}
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad, IN / Remote"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type *</label>
                  <select
                    value={newJob.employment_type}
                    onChange={(e) => setNewJob({ ...newJob, employment_type: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Range *</label>
                  <input
                    type="text"
                    placeholder="e.g. 5-8 years"
                    value={newJob.experience_range}
                    onChange={(e) => setNewJob({ ...newJob, experience_range: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Extra BRD Page 14 fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Budget / Compensation</label>
                  <input
                    type="text"
                    placeholder="e.g. $140k - $160k or ₹18L - ₹24L"
                    value={newJob.salary_budget}
                    onChange={(e) => setNewJob({ ...newJob, salary_budget: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hiring Deadline</label>
                  <input
                    type="date"
                    value={newJob.hiring_deadline}
                    onChange={(e) => setNewJob({ ...newJob, hiring_deadline: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description & Responsibilities *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Responsibilities, requirements, skills..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowJobModal(false); setEditingJobId(null); }}
                  className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => handleSaveJob(e, "draft")}
                    className="px-4 py-2.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSaveJob(e, "open")}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition"
                  >
                    {editingJobId ? "Save & Update Live 🚀" : "Publish Requisition 🚀"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
