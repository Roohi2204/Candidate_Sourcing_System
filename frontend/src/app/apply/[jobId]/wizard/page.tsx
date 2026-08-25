"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import CandidateNavbar from "@/components/candidate/Navbar";
import Link from "next/link";

interface EducationItem {
  level: string;
  degree: string;
  specialization: string;
  institution: string;
  year: string;
  grade: string;
}

interface ExperienceItem {
  company: string;
  designation: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  responsibilities: string;
}

export default function ApplicationWizardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const jobId = params?.jobId;

  const [job, setJob] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [appId, setAppId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Bio-Data (Step 1)
  const [bioData, setBioData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    location: "Hyderabad, TS",
    noticePeriod: "",
    currentCompany: "",
    address: "",
  });

  // Education Details (Step 2)
  const [educations, setEducations] = useState<EducationItem[]>([
    {
      level: "Bachelor's",
      degree: "",
      specialization: "",
      institution: "",
      year: "",
      grade: "",
    },
  ]);

  // Work Experience (Step 3)
  const [isFresher, setIsFresher] = useState(false);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    {
      company: "",
      designation: "",
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      responsibilities: "",
    },
  ]);

  // Resume & Consent (Step 4)
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // Load Job & Init Draft
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/apply/${jobId}`);
      return;
    }

    if (user?.role === "admin") {
      router.push("/admin/dashboard");
      return;
    }

    if (user && jobId) {
      api.get(`/jobs/public/${jobId}`)
        .then((res) => setJob(res.data))
        .catch(console.error);

      api.post("/applications/draft", {
        job_id: Number(jobId),
        email: user.email,
      })
      .then((res) => {
        setAppId(res.data.id);
        if (res.data.first_name) {
          setBioData((prev) => ({
            ...prev,
            firstName: res.data.first_name || "",
            lastName: res.data.last_name || "",
          }));
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Could not initialize application.");
        setLoading(false);
      });
    }
  }, [user, authLoading, jobId, router]);

  const saveDraft = async () => {
    if (!appId) return;
    try {
      await api.patch(`/applications/draft/${appId}`, {
        first_name: bioData.firstName,
        last_name: bioData.lastName,
        phone: bioData.noticePeriod ? `${bioData.location} | Notice: ${bioData.noticePeriod}` : bioData.location,
        education_details: JSON.stringify(educations),
        is_fresher: isFresher,
        experience_details: JSON.stringify(experiences),
        total_years_experience: isFresher ? 0 : experiences.length * 2,
        resume_url: resumeUrl,
      });
    } catch (err) {
      console.error("Auto-save draft error", err);
    }
  };

  // Calculate max allowed DOB (must be at least 18 years old)
  const maxDobDate = new Date(new Date().setFullYear(new Date().getFullYear() - 18))
    .toISOString()
    .split("T")[0];
  const minDobDate = "1940-01-01";

  const handleNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    // Step 1 Validations
    if (step === 1) {
      if (!bioData.firstName.trim()) {
        setError("Please enter your First Name.");
        return;
      }
      if (!bioData.lastName.trim()) {
        setError("Please enter your Last Name.");
        return;
      }
      if (!bioData.gender) {
        setError("Please select your Gender.");
        return;
      }
      if (!bioData.dob) {
        setError("Please select your Date of Birth.");
        return;
      }
      if (bioData.dob > maxDobDate) {
        setError("Candidate must be at least 18 years old to apply.");
        return;
      }
      if (bioData.dob < minDobDate) {
        setError("Please provide a valid Date of Birth.");
        return;
      }
      if (!bioData.location.trim()) {
        setError("Please enter your Current Location.");
        return;
      }
      if (!bioData.noticePeriod) {
        setError("Please select your Notice Period.");
        return;
      }
      if (!bioData.address.trim()) {
        setError("Please enter your Current Address.");
        return;
      }
    }

    // Step 2 Validations
    if (step === 2) {
      for (let i = 0; i < educations.length; i++) {
        const edu = educations[i];
        if (!edu.degree.trim() || !edu.institution.trim() || !edu.year.trim()) {
          setError(`Please complete all mandatory (*) fields for Qualification #${i + 1}.`);
          return;
        }
      }
    }

    // Step 3 Validations
    if (step === 3 && !isFresher) {
      for (let i = 0; i < experiences.length; i++) {
        const exp = experiences[i];
        if (!exp.company.trim() || !exp.designation.trim() || !exp.startDate) {
          setError(`Please complete all mandatory (*) fields (Company, Designation, Start Date) for Experience #${i + 1}.`);
          return;
        }
      }
    }

    await saveDraft();
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Education Helpers
  const addEducation = () => {
    setEducations([
      ...educations,
      { level: "Bachelor's", degree: "", specialization: "", institution: "", year: "", grade: "" },
    ]);
  };

  const removeEducation = (index: number) => {
    if (educations.length > 1) {
      setEducations(educations.filter((_, i) => i !== index));
    }
  };

  const updateEducation = (index: number, field: keyof EducationItem, val: string) => {
    const updated = [...educations];
    updated[index][field] = val;
    setEducations(updated);
  };

  // Experience Helpers
  const addExperience = () => {
    setExperiences([
      ...experiences,
      { company: "", designation: "", startDate: "", endDate: "", currentlyWorking: false, responsibilities: "" },
    ]);
  };

  const removeExperience = (index: number) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter((_, i) => i !== index));
    }
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, val: any) => {
    const updated = [...experiences];
    (updated[index] as any)[field] = val;
    setExperiences(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFileName(file.name);
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/applications/upload-resume", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setResumeUrl(res.data.resume_url);
      } catch (err) {
        // Fallback: Read file as Data URL so it opens directly in browser
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setResumeUrl(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (!resumeUrl) {
      setError("Please attach your mandatory resume file.");
      return;
    }
    if (!confirmAccurate || !agreePrivacy) {
      setError("Please accept all consent checkboxes before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await saveDraft();
      await api.post(`/applications/${appId}/submit`);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <CandidateNavbar />
        <div className="max-w-4xl mx-auto p-12 text-center text-slate-400">
          Loading application wizard...
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <CandidateNavbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-10 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted Successfully!</h2>
            <p className="text-sm text-slate-500 mb-6">
              Your application for <strong>{job?.job_title}</strong> (ID: <strong>APP-{appId ? String(appId).padStart(5, '0') : ''}</strong>) has been received. A confirmation email has been dispatched to {user?.email}.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/my-applications" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition">
                View My Applications
              </Link>
              <Link href="/" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-5 py-2.5 rounded-xl transition">
                Browse More Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
      <CandidateNavbar />

      <main className="max-w-4xl w-full mx-auto px-6 py-8 flex-1">
        {/* Top Dark Hero Card (Screenshots 2-5) */}
        <div className="bg-[#131728] text-white rounded-2xl p-6 shadow-md mb-6 flex justify-between items-center">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-bold text-indigo-400">
              APPLYING FOR
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">
              {job?.job_title || "Senior Backend Engineer"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {job?.department || "Engineering"} • {job?.location || "Hyderabad, IN"} (REQ-2026-{job?.id ? String(job.id).padStart(5, '0') : '92382'})
            </p>
          </div>

          <div className="bg-[#1e2338] px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300">
            Step {step} of 4
          </div>
        </div>

        {/* 4-Step Stepper Card (Screenshots 2-5) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 mb-6">
          <div className="grid grid-cols-4 gap-2">
            {/* Step 1 */}
            <div
              className={`flex items-center justify-center gap-2.5 py-3 px-2 rounded-xl transition ${
                step === 1
                  ? "bg-indigo-50/80 border border-indigo-200 text-indigo-700 font-bold"
                  : step > 1
                  ? "text-emerald-700 font-semibold"
                  : "text-slate-400 font-medium"
              }`}
            >
              {step > 1 ? (
                <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              ) : (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  1
                </span>
              )}
              <span className="text-xs">Bio-Data</span>
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-center justify-center gap-2.5 py-3 px-2 rounded-xl transition ${
                step === 2
                  ? "bg-indigo-50/80 border border-indigo-200 text-indigo-700 font-bold"
                  : step > 2
                  ? "text-emerald-700 font-semibold"
                  : "text-slate-400 font-medium"
              }`}
            >
              {step > 2 ? (
                <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              ) : (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  2
                </span>
              )}
              <span className="text-xs">Education</span>
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-center justify-center gap-2.5 py-3 px-2 rounded-xl transition ${
                step === 3
                  ? "bg-indigo-50/80 border border-indigo-200 text-indigo-700 font-bold"
                  : step > 3
                  ? "text-emerald-700 font-semibold"
                  : "text-slate-400 font-medium"
              }`}
            >
              {step > 3 ? (
                <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              ) : (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  3
                </span>
              )}
              <span className="text-xs">Work Experience</span>
            </div>

            {/* Step 4 */}
            <div
              className={`flex items-center justify-center gap-2.5 py-3 px-2 rounded-xl transition ${
                step === 4
                  ? "bg-indigo-50/80 border border-indigo-200 text-indigo-700 font-bold"
                  : "text-slate-400 font-medium"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                4
              </span>
              <span className="text-xs">Resume & Submit</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: PERSONAL BIO-DATA (Screenshot 2) */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 pb-4 border-b border-slate-100 mb-6">
              <span className="text-indigo-600 text-lg">👤</span> Step 1: Personal Bio-Data
            </h2>

            <form onSubmit={handleNext} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bioData.firstName}
                    onChange={(e) => setBioData({ ...bioData, firstName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bioData.lastName}
                    onChange={(e) => setBioData({ ...bioData, lastName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={bioData.gender}
                    onChange={(e) => setBioData({ ...bioData, gender: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date of Birth <span className="text-red-500">*</span> <span className="text-[10px] text-slate-400 font-normal">(Min 18 yrs)</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={maxDobDate}
                    min={minDobDate}
                    value={bioData.dob}
                    onChange={(e) => setBioData({ ...bioData, dob: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Location (City, State) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bioData.location}
                    onChange={(e) => setBioData({ ...bioData, location: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Hyderabad, TS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Notice Period <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={bioData.noticePeriod}
                    onChange={(e) => setBioData({ ...bioData, noticePeriod: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Notice Period</option>
                    <option value="Immediate">Immediate</option>
                    <option value="15 days">15 days</option>
                    <option value="30 days">30 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90+ days">90+ days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Company (Optional)</label>
                <input
                  type="text"
                  value={bioData.currentCompany}
                  onChange={(e) => setBioData({ ...bioData, currentCompany: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  placeholder="Leave blank if fresher"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={bioData.address}
                  onChange={(e) => setBioData({ ...bioData, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  placeholder="Street address, City, State, PIN Code"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
                >
                  Save & Continue to Education →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: EDUCATION DETAILS (Screenshot 3) */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="text-indigo-600 text-lg">🎓</span> Step 2: Education Details
              </h2>
              <button
                type="button"
                onClick={addEducation}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition"
              >
                + Add Qualification
              </button>
            </div>

            <div className="space-y-6">
              {educations.map((edu, idx) => (
                <div key={idx} className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-6 relative">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-indigo-700">
                      Qualification #{idx + 1}
                    </span>
                    {educations.length > 1 && (
                      <button
                        onClick={() => removeEducation(idx)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Education Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={edu.level}
                        onChange={(e) => updateEducation(idx, "level", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="High School">High School</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Bachelor's">Bachelor's</option>
                        <option value="Master's">Master's</option>
                        <option value="Doctorate">Doctorate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Degree / Qualification <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. B.Tech / B.Sc / MBA"
                        value={edu.degree}
                        onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={edu.specialization}
                        onChange={(e) => updateEducation(idx, "specialization", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Institution / University <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IIT Hyderabad / Delhi University"
                        value={edu.institution}
                        onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Year of Passing <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2024"
                        value={edu.year}
                        onChange={(e) => updateEducation(idx, "year", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / CGPA</label>
                      <input
                        type="text"
                        placeholder="e.g. 8.5 CGPA / 80%"
                        value={edu.grade}
                        onChange={(e) => updateEducation(idx, "grade", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                Save & Continue to Work Experience →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WORK EXPERIENCE (Screenshot 4) */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="text-indigo-600 text-lg">💼</span> Step 3: Work Experience
              </h2>

              {!isFresher && (
                <button
                  type="button"
                  onClick={addExperience}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition"
                >
                  + Add Experience
                </button>
              )}
            </div>

            {/* Fresher Toggle Card */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl mb-6 flex items-center gap-3">
              <input
                type="checkbox"
                id="fresherToggle"
                checked={isFresher}
                onChange={(e) => setIsFresher(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="fresherToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                I am a Fresher / Have no formal work experience
              </label>
            </div>

            {!isFresher && (
              <div className="space-y-6">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-indigo-700">
                        Experience #{idx + 1}
                      </span>
                      {experiences.length > 1 && (
                        <button
                          onClick={() => removeExperience(idx)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Employer / Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Google / Infosys / Startup Ltd"
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, "company", e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Designation / Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Software Engineer / Data Analyst"
                          value={exp.designation}
                          onChange={(e) => updateExperience(idx, "designation", e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                        <input
                          type="date"
                          disabled={exp.currentlyWorking}
                          value={exp.endDate}
                          onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs disabled:bg-slate-100"
                        />
                        <div className="flex items-center gap-1.5 mt-2">
                          <input
                            type="checkbox"
                            id={`curr-${idx}`}
                            checked={exp.currentlyWorking}
                            onChange={(e) => updateExperience(idx, "currentlyWorking", e.target.checked)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded"
                          />
                          <label htmlFor={`curr-${idx}`} className="text-[11px] text-slate-500">Currently working here</label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Key Responsibilities</label>
                      <textarea
                        rows={3}
                        placeholder="Summarize key projects, technologies used, and achievements..."
                        value={exp.responsibilities}
                        onChange={(e) => updateExperience(idx, "responsibilities", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                Save & Continue to Resume Upload →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RESUME UPLOAD & REVIEW & SUBMIT */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 pb-4 border-b border-slate-100 mb-6">
              <span className="text-indigo-600 text-lg">📄</span> Step 4: Resume & Review & Submit
            </h2>

            <div className="space-y-6">
              {/* Mandatory Resume Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Upload Mandatory Resume File (PDF, DOC, DOCX - Max 5MB) <span className="text-red-500">*</span>
                </label>

                <label className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition ${resumeUrl ? 'border-emerald-300 bg-emerald-50/40' : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/40'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-2 ${resumeUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {resumeUrl ? '✓' : '📄'}
                  </div>
                  <span className="text-xs font-bold text-indigo-600 hover:underline">
                    {resumeFileName ? `Selected: ${resumeFileName}` : "Click to choose file (Mandatory *)"}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Accepted formats: PDF, DOC, DOCX up to 5 MB
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Or enter a direct link / Google Drive URL for your resume:
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/... or http://..."
                    value={resumeUrl}
                    onChange={(e) => {
                      setResumeUrl(e.target.value);
                      if (e.target.value) setResumeFileName("Online Resume Link");
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {!resumeUrl && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1">
                    * Resume attachment is strictly required for application submission.
                  </p>
                )}
              </div>

              {/* Review & Verify Summary Box */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📋</span> Application Review Summary
                  </h3>
                  <span className="text-[11px] text-indigo-600 font-semibold">Review before submitting</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Candidate Name:</span>
                    <p className="font-bold text-slate-800">{bioData.firstName} {bioData.lastName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Email Address:</span>
                    <p className="font-bold text-slate-800">{user?.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Date of Birth & Gender:</span>
                    <p className="font-bold text-slate-800">{bioData.dob || "N/A"} &bull; {bioData.gender || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Location & Notice:</span>
                    <p className="font-bold text-slate-800">{bioData.location} &bull; {bioData.noticePeriod}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400 font-medium">Address:</span>
                    <p className="font-semibold text-slate-800">{bioData.address || "N/A"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400 font-medium">Education:</span>
                    <p className="font-semibold text-slate-800">
                      {educations.map((e) => `${e.level} in ${e.degree || 'Degree'} (${e.institution || 'Inst'}, ${e.year || 'Yr'})`).join(" | ")}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400 font-medium">Experience:</span>
                    <p className="font-semibold text-slate-800">
                      {isFresher ? "Fresher (No prior formal experience)" : experiences.map((exp) => `${exp.designation || 'Role'} at ${exp.company || 'Company'}`).join(" | ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional Cover Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Optional Cover Note for Recruiter
                </label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Add a brief note explaining why you're a great fit for this role..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Consent Declarations */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consent1"
                    checked={confirmAccurate}
                    onChange={(e) => setConfirmAccurate(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="consent1" className="text-xs text-slate-600 cursor-pointer">
                    I confirm that all the personal, education, and work experience details provided are accurate to the best of my knowledge. <span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consent2"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="consent2" className="text-xs text-slate-600 cursor-pointer">
                    I agree to the TalentBridge Data Privacy Policy and consent to storing my resume for recruitment evaluation. <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !resumeUrl}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
