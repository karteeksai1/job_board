import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, DollarSign, Calendar, ArrowRight, Bookmark } from 'lucide-react';

export const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

export const getLogoColor = (companyName?: string) => {
  if (!companyName) return 'bg-indigo-100 text-indigo-800';
  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  ];
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

interface JobCardProps {
  job: {
    id: string;
    title: string;
    companyName: string;
    companyLogo?: string | null;
    location: string;
    jobType: string;
    experienceLevel: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    createdAt?: string;
  };
  isBookmarked?: boolean;
  onBookmarkToggle?: (id: string) => void;
  userRole?: string;
}

const JobCard: React.FC<JobCardProps> = ({ job, isBookmarked = false, onBookmarkToggle, userRole }) => {
  const {
    id,
    title,
    companyName,
    companyLogo,
    location,
    jobType,
    experienceLevel,
    salaryMin,
    salaryMax,
    createdAt,
  } = job;

  const typeLabels: Record<string, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    REMOTE: 'Remote',
    INTERNSHIP: 'Internship',
  };

  const levelLabels: Record<string, string> = {
    ENTRY: 'Entry level',
    MID: 'Mid level',
    SENIOR: 'Senior level',
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Salary undisclosed';
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    }
    return min ? `From $${(min / 1000).toFixed(0)}k` : `Up to $${(max! / 1000).toFixed(0)}k`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm hover-card flex flex-col gap-4 relative">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Company Logo badge */}
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${getLogoColor(companyName)}`}>
            {companyLogo || companyName.charAt(0)}
          </div>
          {/* Title and Company name */}
          <div>
            <Link href={`/jobs/${id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-snug line-clamp-1">{title}</h3>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">{companyName}</p>
          </div>
        </div>

        {/* Bookmark Icon for Seeker */}
        {userRole === 'JOB_SEEKER' && onBookmarkToggle && (
          <button
            onClick={() => onBookmarkToggle(id)}
            className={`p-2 rounded-full border transition-all ${
              isBookmarked
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400'
                : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Meta Indicators */}
      <div className="flex flex-wrap gap-y-2 gap-x-4 py-1 text-slate-500 dark:text-slate-400 text-xs border-t border-b border-slate-50 dark:border-slate-700/50">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />
          <span>{typeLabels[jobType] || jobType}</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5" />
          <span>{formatSalary(salaryMin, salaryMax)}</span>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex justify-between items-center mt-auto pt-1">
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
            {levelLabels[experienceLevel] || experienceLevel}
          </span>
          <Link
            href={`/jobs/${id}`}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group hover:underline"
          >
            Details
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
