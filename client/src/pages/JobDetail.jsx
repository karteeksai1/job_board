import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLogoColor, formatDate } from '../components/JobCard';
import { MapPin, Briefcase, DollarSign, Calendar, Eye, Bookmark, Share2, ArrowLeft, Send, Upload, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();

  const [job, setJob] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyName, setApplyName] = useState(user?.name || '');
  const [applyEmail, setApplyEmail] = useState(user?.email || '');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [useProfileResume, setUseProfileResume] = useState(false);
  const [profileResumeUrl, setProfileResumeUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Fetch job details
  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error('Job not found');
      const data = await res.json();
      setJob(data.job);
      setRelatedJobs(data.relatedJobs);
    } catch (err) {
      console.error(err);
      toast.error('Could not load job details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Check application and bookmark status
  const checkStatus = useCallback(async () => {
    if (!user || user.role !== 'JOB_SEEKER') return;
    try {
      const res = await authFetch('/api/seeker/dashboard');
      if (res.ok) {
        const data = await res.json();
        
        // Check bookmark
        const bookmarked = data.bookmarks.some(b => b.job.id === id);
        setIsBookmarked(bookmarked);

        // Check if already applied
        const applied = data.applications.some(app => app.jobId === id);
        setAlreadyApplied(applied);

        // Set profile resume if available
        const userRes = await authFetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user.profile?.resumeUrl) {
            setProfileResumeUrl(userData.user.profile.resumeUrl);
            setUseProfileResume(true);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard status:', err);
    }
  }, [user, id, authFetch]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!user) {
      toast.error('Please log in to bookmark jobs');
      navigate('/login');
      return;
    }
    try {
      const res = await authFetch(`/api/seeker/bookmarks/${id}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.bookmarked);
        toast.success(data.message);
      } else {
        toast.error('Failed to update bookmark');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error toggling bookmark');
    }
  };

  // Handle link sharing
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Job link copied to clipboard!');
  };

  // Handle Resume File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowed = ['.pdf', '.doc', '.docx'];
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(extension)) {
        toast.error('Only PDF and Doc files are allowed');
        return;
      }
      setResumeFile(file);
      setUseProfileResume(false);
    }
  };

  // Handle job application submission
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyName || !applyEmail) {
      toast.error('Name and Email are required');
      return;
    }
    if (!resumeFile && !useProfileResume) {
      toast.error('Please upload a resume or use your profile resume');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', applyName);
      formData.append('email', applyEmail);
      formData.append('coverLetter', coverLetter);
      
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await authFetch(`/api/applications/${id}`, {
        method: 'POST',
        // Note: Content-Type header must be omitted so the browser automatically sets the multipart boundary!
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Application submitted successfully!');
        setAlreadyApplied(true);
        setShowApplyModal(false);
      } else {
        toast.error(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
        <div className="flex gap-4 items-start mb-6">
          <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6"></div>
      </div>
    );
  }

  const {
    title,
    companyName,
    companyLogo,
    location,
    jobType,
    experienceLevel,
    salaryMin,
    salaryMax,
    description,
    requirements,
    responsibilities,
    views,
    createdAt,
    employer,
  } = job;

  const typeLabels = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    REMOTE: 'Remote',
    INTERNSHIP: 'Internship',
  };

  const levelLabels = {
    ENTRY: 'Entry level',
    MID: 'Mid level',
    SENIOR: 'Senior level',
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary undisclosed';
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    }
    return min ? `From $${min.toLocaleString()}` : `Up to $${max.toLocaleString()}`;
  };

  // Convert requirements and responsibilities to list formats
  const requirementsList = requirements.split('\n').filter(r => r.trim().length > 0);
  const responsibilitiesList = responsibilities.split('\n').filter(r => r.trim().length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 group transition-colors">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl shrink-0 ${getLogoColor(companyName)}`}>
                  {companyLogo || companyName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm mt-0.5">{companyName}</p>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title="Share link"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {user?.role === 'JOB_SEEKER' && (
                  <button
                    onClick={handleBookmarkToggle}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isBookmarked
                        ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
                  >
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Meta Data Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2.5 py-4 border-t border-b border-slate-50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>{location}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                  <Briefcase className="w-4 h-4" />
                  </div>
                <span>{typeLabels[jobType] || jobType}</span>
              </div>

              <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span>{formatSalary(salaryMin, salaryMax)}</span>
              </div>
            </div>

            {/* Application CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
              {alreadyApplied ? (
                <div className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl text-sm border border-emerald-200 dark:border-emerald-900/60">
                  <CheckCircle2 className="w-5 h-5" />
                  Application Submitted
                </div>
              ) : user?.role === 'EMPLOYER' ? (
                /* Employer owner view */
                user.id === job.employerId ? (
                  <Link
                    to="/employer"
                    className="w-full text-center py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Manage Postings in Dashboard
                  </Link>
                ) : (
                  <div className="w-full text-center py-3 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/20 rounded-xl font-medium">
                    Employers cannot apply to job postings
                  </div>
                )
              ) : (
                <button
                  onClick={() => {
                    if (!user) {
                      toast.error('Please login as a Job Seeker to apply');
                      navigate('/login', { state: { from: window.location } });
                    } else {
                      setShowApplyModal(true);
                    }
                  }}
                  className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md text-center"
                >
                  Apply for this position
                </button>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Job Description</h2>
              <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{description}</div>
            </div>

            {requirementsList.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Requirements</h2>
                <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300 text-sm space-y-2">
                  {requirementsList.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {responsibilitiesList.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Responsibilities</h2>
                <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300 text-sm space-y-2">
                  {responsibilitiesList.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info & Related Jobs */}
        <div className="space-y-6">
          {/* Post Metrics Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Job Overview</h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Date Posted</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(createdAt)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  <span>Job Level</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{levelLabels[experienceLevel] || experienceLevel}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Views</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{views} views</span>
              </div>
            </div>

            {/* Employer company info */}
            {employer?.profile && (
              <div className="pt-4 border-t border-slate-50 dark:border-slate-700/50 mt-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">About the Company</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-2">{employer.profile.bio}</p>
                {employer.profile.companyWebsite && (
                  <a
                    href={employer.profile.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Related Jobs Section */}
          {relatedJobs.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Related Jobs</h3>
              <div className="space-y-4">
                {relatedJobs.map((rJob) => (
                  <div key={rJob.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-xl p-4 shadow-sm hover-card">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">{typeLabels[rJob.jobType]}</span>
                    <Link to={`/jobs/${rJob.id}`} className="block mt-1">
                      <h4 className="font-bold text-slate-950 dark:text-white text-sm hover:underline line-clamp-1">{rJob.title}</h4>
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">{rJob.companyName}</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50 dark:border-slate-700/50 text-slate-400 text-xs">
                      <span>{rJob.location}</span>
                      <Link to={`/jobs/${rJob.id}`} className="font-semibold text-indigo-600 dark:text-indigo-400">View Details</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Modal Popup */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setShowApplyModal(false)}></div>
            
            {/* Modal Box */}
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 transition-all transform relative">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Apply for {title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-5">Provide details and upload your resume to complete your application.</p>

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label htmlFor="modalName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="modalName"
                    required
                    value={applyName}
                    onChange={(e) => setApplyName(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="modalEmail" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="modalEmail"
                    required
                    value={applyEmail}
                    onChange={(e) => setApplyEmail(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Resume selection section */}
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Resume Document
                  </span>

                  {profileResumeUrl && (
                    <label className="flex items-center gap-2.5 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 rounded-xl mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useProfileResume}
                        onChange={(e) => {
                          setUseProfileResume(e.target.checked);
                          if (e.target.checked) setResumeFile(null);
                        }}
                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500/20 w-4.5 h-4.5"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Use Saved Resume</p>
                        <p className="text-[10px] text-indigo-500 font-medium">Use the resume stored in your seeker profile settings.</p>
                      </div>
                    </label>
                  )}

                  {/* Manual file upload */}
                  <div className="relative">
                    <input
                      type="file"
                      id="resumeUpload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="resumeUpload"
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer text-center transition-all ${
                        resumeFile
                          ? 'border-indigo-400 bg-indigo-50/10'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                      }`}
                    >
                      {resumeFile ? (
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{resumeFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                          <Upload className="w-5 h-5" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Upload new resume</span>
                          <span className="text-[10px] text-slate-400">PDF, DOC, DOCX up to 10MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="coverLetter" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    id="coverLetter"
                    rows={4}
                    placeholder="Briefly introduce yourself and why you'd be a great fit for this role..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow disabled:opacity-50"
                  >
                    {submitting ? (
                      'Sending...'
                    ) : (
                      <>
                        Submit Application
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
