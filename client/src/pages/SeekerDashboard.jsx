import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate, getLogoColor } from '../components/JobCard';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Bookmark, User, FileText, CheckCircle2, XCircle, AlertCircle, Clock, ChevronRight, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const SeekerDashboard = () => {
  const { user, authFetch, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('applications'); // applications, bookmarks, profile
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [applications, setApplications] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  
  // Profile Form State
  const [profileTitle, setProfileTitle] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileResumeUrl, setProfileResumeUrl] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Fetch Dashboard details
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/seeker/dashboard');
      if (!res.ok) throw new Error('Could not load dashboard data');
      const data = await res.json();
      setApplications(data.applications);
      setBookmarks(data.bookmarks);

      // Fetch full profile info for form editing
      const userRes = await authFetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        const profile = userData.user.profile || {};
        setProfileTitle(profile.title || '');
        setProfileBio(profile.bio || '');
        setProfileSkills(profile.skills || '');
        setProfileResumeUrl(profile.resumeUrl || '');
        setProfileName(userData.user.name || '');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Remove Bookmark toggler
  const handleRemoveBookmark = async (jobId) => {
    try {
      const res = await authFetch(`/api/seeker/bookmarks/${jobId}`, {
        method: 'POST',
      });
      if (res.ok) {
        setBookmarks(prev => prev.filter(b => b.job.id !== jobId));
        toast.success('Bookmark removed');
      } else {
        toast.error('Failed to remove bookmark');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error modifying bookmark');
    }
  };

  // Handle Profile Update submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileName) {
      toast.error('Name is required');
      return;
    }

    try {
      setUpdatingProfile(true);
      const res = await authFetch('/api/seeker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          title: profileTitle,
          bio: profileBio,
          skills: profileSkills,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Update user state inside AuthContext
        setUser(prev => ({
          ...prev,
          name: data.user.name,
          profile: data.user.profile,
        }));
        // Update localStorage
        const stored = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({
          ...stored,
          name: data.user.name,
        }));
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Get status color pill
  const getStatusPill = (status) => {
    const statuses = {
      APPLIED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60',
      SHORTLISTED: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/60',
      REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60',
      HIRED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60',
    };

    const icons = {
      APPLIED: <Clock className="w-3.5 h-3.5" />,
      SHORTLISTED: <AlertCircle className="w-3.5 h-3.5 animate-pulse" />,
      REJECTED: <XCircle className="w-3.5 h-3.5" />,
      HIRED: <CheckCircle2 className="w-3.5 h-3.5" />,
    };

    const labels = {
      APPLIED: 'Applied',
      SHORTLISTED: 'Shortlisted',
      REJECTED: 'Rejected',
      HIRED: 'Hired',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded-lg text-xs font-semibold ${statuses[status] || statuses.APPLIED}`}>
        {icons[status] || icons.APPLIED}
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard header banner */}
      <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 sm:p-8 text-white mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl"></div>
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{user?.name}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Manage applications, update your resume, and check saved jobs</p>
        </div>
      </div>

      {/* Tabs navigation grid */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6 overflow-x-auto gap-4">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'applications'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Briefcase className="w-4.5 h-4.5" />
          My Applications ({applications.length})
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'bookmarks'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Bookmark className="w-4.5 h-4.5" />
          Saved Jobs ({bookmarks.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <User className="w-4.5 h-4.5" />
          My Profile
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-xl shimmer border border-slate-100 dark:border-slate-700"></div>
          ))}
        </div>
      ) : (
        <div>
          {/* 1. APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getLogoColor(app.job.companyName)}`}>
                        {app.job.companyLogo || app.job.companyName.charAt(0)}
                      </div>
                      <div>
                        <Link to={`/jobs/${app.job.id}`} className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          {app.job.title}
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-0.5">{app.job.companyName}</p>
                        <div className="flex gap-4 text-[10px] text-slate-400 mt-2 font-medium">
                          <span>Applied on: {formatDate(app.createdAt)}</span>
                          <span>Location: {app.job.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto shrink-0 justify-between">
                      {getStatusPill(app.status)}
                      <Link
                        to={`/jobs/${app.job.id}`}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
                      >
                        View Job Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">No applications submitted yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto text-xs">
                    Start applying to job listings on our search page to track your job applications pipeline.
                  </p>
                  <Link
                    to="/"
                    className="inline-block mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Search Jobs
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 2. BOOKMARKS TAB */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              {bookmarks.length > 0 ? (
                bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getLogoColor(bookmark.job.companyName)}`}>
                        {bookmark.job.companyLogo || bookmark.job.companyName.charAt(0)}
                      </div>
                      <div>
                        <Link to={`/jobs/${bookmark.job.id}`} className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          {bookmark.job.title}
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-0.5">{bookmark.job.companyName}</p>
                        <div className="flex gap-4 text-[10px] text-slate-400 mt-2 font-medium">
                          <span>Location: {bookmark.job.location}</span>
                          <span>Type: {bookmark.job.jobType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <button
                        onClick={() => handleRemoveBookmark(bookmark.job.id)}
                        className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-300 transition-colors"
                      >
                        Remove
                      </button>
                      <Link
                        to={`/jobs/${bookmark.job.id}`}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        Apply Now
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">No saved jobs</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto text-xs">
                    Save jobs that interest you while browsing to look at or apply to them later.
                  </p>
                  <Link
                    to="/"
                    className="inline-block mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Browse Jobs
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 3. PROFILE SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Form editing card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm lg:col-span-2">
                <h2 className="font-bold text-slate-900 dark:text-white text-base mb-5 pb-2 border-b border-slate-50 dark:border-slate-700/50">Edit Profile Details</h2>
                
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Name</label>
                      <input
                        type="text"
                        id="pName"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="pTitle" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Professional Title</label>
                      <input
                        type="text"
                        id="pTitle"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={profileTitle}
                        onChange={(e) => setProfileTitle(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pSkills" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Skills (Comma-separated)</label>
                    <input
                      type="text"
                      id="pSkills"
                      placeholder="e.g. React, Node.js, Tailwind, JavaScript"
                      value={profileSkills}
                      onChange={(e) => setProfileSkills(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="pBio" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Professional Bio</label>
                    <textarea
                      id="pBio"
                      rows={5}
                      placeholder="Write a brief professional summary about yourself..."
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>

              {/* Resume summary sidebar card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Resume File</h3>
                {profileResumeUrl ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border border-slate-150 dark:border-slate-700 rounded-xl flex items-start gap-3">
                    <FileText className="w-6 h-6 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Saved Resume Document</p>
                      <a
                        href={profileResumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block"
                      >
                        View Resume File
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium">No resume uploaded</p>
                    <p className="text-[10px] mt-0.5">Upload a resume when applying for a job to save it here automatically.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeekerDashboard;
