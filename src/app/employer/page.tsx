'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/components/JobCard';
import { Eye, Users, FileText, Edit, Trash2, PlusCircle, LayoutDashboard, Briefcase, FileSignature } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployerDashboard = () => {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, jobs, candidates, post
  const [loading, setLoading] = useState(true);

  // Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

  // Post / Edit Job Form State
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formJobType, setFormJobType] = useState('FULL_TIME');
  const [formExperience, setFormExperience] = useState('MID');
  const [formSalaryMin, setFormSalaryMin] = useState('');
  const [formSalaryMax, setFormSalaryMax] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formResponsibilities, setFormResponsibilities] = useState('');
  const [savingJob, setSavingJob] = useState(false);

  // Fetch all dashboard data (analytics, jobs, candidates)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Analytics
      const analyticsRes = await authFetch('/api/analytics/employer');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
        setJobs(analyticsData.jobAnalytics);
      }

      // 2. Fetch Candidates
      const candidatesRes = await authFetch('/api/applications/employer');
      if (candidatesRes.ok) {
        const candidatesData = await candidatesRes.json();
        setCandidates(candidatesData.applications);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Post / Edit Job submit
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formLocation || !formDescription) {
      toast.error('Please fill in required fields (Title, Location, Description)');
      return;
    }

    try {
      setSavingJob(true);
      const payload = {
        title: formTitle,
        companyName: analytics?.jobAnalytics?.[0]?.companyName || 'Our Company',
        location: formLocation,
        jobType: formJobType,
        experienceLevel: formExperience,
        salaryMin: formSalaryMin ? parseInt(formSalaryMin) : null,
        salaryMax: formSalaryMax ? parseInt(formSalaryMax) : null,
        description: formDescription,
        requirements: formRequirements,
        responsibilities: formResponsibilities,
      };

      const url = editingJobId ? `/api/jobs/${editingJobId}` : '/api/jobs';
      const method = editingJobId ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingJobId ? 'Job posting updated!' : 'Job posting created!');
        resetForm();
        setActiveTab('jobs');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to save job');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving job posting');
    } finally {
      setSavingJob(false);
    }
  };

  // Trigger Job Edit mode
  const startEditJob = async (jobId: string) => {
    try {
      const res = await authFetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        const job = data.job;
        setEditingJobId(jobId);
        setFormTitle(job.title);
        setFormLocation(job.location);
        setFormJobType(job.jobType);
        setFormExperience(job.experienceLevel);
        setFormSalaryMin(job.salaryMin?.toString() || '');
        setFormSalaryMax(job.salaryMax?.toString() || '');
        setFormDescription(job.description);
        setFormRequirements(job.requirements);
        setFormResponsibilities(job.responsibilities);
        
        setActiveTab('post');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not load job details for editing');
    }
  };

  // Delete Job posting
  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;
    try {
      const res = await authFetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Job posting deleted');
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete job posting');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting job posting');
    }
  };

  // Update candidate status pipeline
  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const res = await authFetch(`/api/applications/status/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setCandidates(prev =>
          prev.map(c => (c.id === appId ? { ...c, status: newStatus } : c))
        );
        toast.success(`Candidate status updated to ${newStatus}`);
        fetchData(); // reload analytics splits
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update candidate status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating candidate status');
    }
  };

  const resetForm = () => {
    setEditingJobId(null);
    setFormTitle('');
    setFormLocation('');
    setFormJobType('FULL_TIME');
    setFormExperience('MID');
    setFormSalaryMin('');
    setFormSalaryMax('');
    setFormDescription('');
    setFormRequirements('');
    setFormResponsibilities('');
  };

  const typeLabels: Record<string, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    REMOTE: 'Remote',
    INTERNSHIP: 'Internship',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Info */}
      <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 sm:p-8 text-white mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl"></div>
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Employer Panel</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Recruitment Workspace</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Post roles, review applications, and manage candidate pipelines</p>
        </div>
        <button
          onClick={() => { resetForm(); setActiveTab('post'); }}
          className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow shadow-indigo-600/10 shrink-0"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Post a New Job
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6 overflow-x-auto gap-4">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-4.5 h-4.5" />
          Analytics Overview
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'jobs'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Briefcase className="w-4.5 h-4.5" />
          Manage Postings ({jobs.length})
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'candidates'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          Candidate Pipeline ({candidates.length})
        </button>

        <button
          onClick={() => setActiveTab('post')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'post'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <FileSignature className="w-4.5 h-4.5" />
          {editingJobId ? 'Edit Job Posting' : 'Post a Job'}
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl shimmer border border-slate-100 dark:border-slate-700"></div>
          ))}
        </div>
      ) : (
        <div>
          {/* 1. ANALYTICS TAB */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase">Total Postings</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{analytics.summary.totalPostings}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase">Total Views</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{analytics.summary.totalViews}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase">Total Applicants</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{analytics.summary.totalApplications}</p>
                  </div>
                </div>
              </div>

              {/* Status pipeline breakdown */}
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-5">Pipeline Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-slate-400 text-xs font-semibold uppercase">Applied</p>
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{analytics.pipeline.applied}</p>
                  </div>
                  <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 rounded-xl border border-purple-100 dark:border-purple-950 text-center">
                    <p className="text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase">Shortlisted</p>
                    <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">{analytics.pipeline.shortlisted}</p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-950 text-center">
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase">Hired</p>
                    <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{analytics.pipeline.hired}</p>
                  </div>
                  <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-950 text-center">
                    <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase">Rejected</p>
                    <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">{analytics.pipeline.rejected}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. MANAGE JOBS TAB */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{job.title}</h3>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-1.5 font-medium">
                        <span>Type: {typeLabels[job.jobType] || job.jobType}</span>
                        <span>Location: {job.location}</span>
                        <span>Posted: {formatDate(job.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5" title="Views count">
                          <Eye className="w-4 h-4" />
                          {job.views}
                        </span>
                        <span className="flex items-center gap-1.5" title="Applicant count">
                          <Users className="w-4 h-4" />
                          {job.applicantCount}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditJob(job.id)}
                          className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                          title="Edit Job"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-rose-600"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">No jobs posted yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto text-xs">
                    Start publishing open roles to begin receiving and tracking candidate applications.
                  </p>
                  <button
                    onClick={() => setActiveTab('post')}
                    className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Post a Job
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. CANDIDATES PIPELINE TAB */}
          {activeTab === 'candidates' && (
            <div className="space-y-4">
              {candidates.length > 0 ? (
                candidates.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{app.name}</h3>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                          {app.job.title}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{app.email}</p>
                      
                      {app.coverLetter && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2 max-w-xl bg-slate-50 dark:bg-slate-700/20 p-2 rounded-lg mt-1 border border-slate-100 dark:border-slate-700/50">
                          "{app.coverLetter}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 shrink-0 w-full md:w-auto justify-between border-t md:border-t-0 pt-3 md:pt-0">
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300"
                      >
                        <FileText className="w-4 h-4 text-indigo-600" />
                        View Resume
                      </a>

                      <div className="flex items-center gap-2">
                        <label htmlFor={`status-${app.id}`} className="text-xs text-slate-400 font-semibold uppercase">Pipeline:</label>
                        <select
                          id={`status-${app.id}`}
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 dark:bg-slate-700 dark:border-slate-650 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="HIRED">Hired</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">No applicants yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto text-xs">
                    Candidates who apply to your active job postings will show up here along with their resumes and statuses.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. POST / EDIT JOB TAB */}
          {activeTab === 'post' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 dark:text-white text-base mb-5 pb-2 border-b border-slate-50 dark:border-slate-700/50">
                {editingJobId ? 'Edit Job Posting' : 'Publish a New Position'}
              </h2>

              <form onSubmit={handleJobSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="jobTitle" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Job Title</label>
                    <input
                      type="text"
                      id="jobTitle"
                      required
                      placeholder="e.g. Lead Frontend Architect"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="jobLocation" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Location</label>
                    <input
                      type="text"
                      id="jobLocation"
                      required
                      placeholder="e.g. Austin, TX or Remote"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="jobType" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Job Type</label>
                    <select
                      id="jobType"
                      value={formJobType}
                      onChange={(e) => setFormJobType(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="FULL_TIME">Full-time</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="REMOTE">Remote</option>
                      <option value="INTERNSHIP">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="jobExp" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Experience Level</label>
                    <select
                      id="jobExp"
                      value={formExperience}
                      onChange={(e) => setFormExperience(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="ENTRY">Entry Level</option>
                      <option value="MID">Mid Level</option>
                      <option value="SENIOR">Senior Level</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="salMin" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Min Salary (Annual $)</label>
                    <input
                      type="number"
                      id="salMin"
                      placeholder="e.g. 80000"
                      value={formSalaryMin}
                      onChange={(e) => setFormSalaryMin(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="salMax" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Max Salary (Annual $)</label>
                    <input
                      type="number"
                      id="salMax"
                      placeholder="e.g. 120000"
                      value={formSalaryMax}
                      onChange={(e) => setFormSalaryMax(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="jobDesc" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    id="jobDesc"
                    rows={5}
                    placeholder="Describe the company, the role, team context, and growth opportunities..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="jobReqs" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Requirements (one per line)</label>
                  <textarea
                    id="jobReqs"
                    rows={4}
                    placeholder="e.g. 3+ years experience with React&#10;BS in Computer Science or equivalent&#10;Strong communication skills"
                    value={formRequirements}
                    onChange={(e) => setFormRequirements(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="jobResps" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Responsibilities (one per line)</label>
                  <textarea
                    id="jobResps"
                    rows={4}
                    placeholder="e.g. Write clean JSX and CSS code&#10;Lead engineering team standups&#10;Coordinate with UI designers on layouts"
                    value={formResponsibilities}
                    onChange={(e) => setFormResponsibilities(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setActiveTab('jobs'); }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingJob}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow disabled:opacity-50"
                  >
                    {savingJob ? 'Saving...' : editingJobId ? 'Save Changes' : 'Publish Job'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
