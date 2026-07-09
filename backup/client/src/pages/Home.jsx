import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import SkeletonCard from '../components/SkeletonCard';
import { Search, MapPin, SlidersHorizontal, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const { user, authFetch } = useAuth();
  
  // State for jobs and pagination
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  
  // Bookmarks state (for Job Seekers)
  const [seekerBookmarks, setSeekerBookmarks] = useState([]);

  // Filters State
  const [search, setSearch] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [selectedExperienceLevels, setSelectedExperienceLevels] = useState([]);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  // Active query parameters (to avoid fetching on every keystroke)
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    location: '',
    jobType: '',
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    sortBy: 'newest',
    page: 1,
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch jobs list
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (activeFilters.search) queryParams.append('search', activeFilters.search);
      if (activeFilters.location) queryParams.append('location', activeFilters.location);
      if (activeFilters.jobType) queryParams.append('jobType', activeFilters.jobType);
      if (activeFilters.experienceLevel) queryParams.append('experienceLevel', activeFilters.experienceLevel);
      if (activeFilters.salaryMin) queryParams.append('salaryMin', activeFilters.salaryMin);
      if (activeFilters.salaryMax) queryParams.append('salaryMax', activeFilters.salaryMax);
      queryParams.append('sortBy', activeFilters.sortBy);
      queryParams.append('page', activeFilters.page);
      queryParams.append('limit', 6); // 6 jobs per page

      const res = await fetch(`/api/jobs?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      
      const data = await res.json();
      setJobs(data.jobs);
      setTotalPages(data.pagination.totalPages);
      setTotalJobs(data.pagination.total);
    } catch (err) {
      console.error(err);
      toast.error('Could not load job listings');
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  // Fetch bookmarks if logged in as seeker
  const fetchBookmarks = useCallback(async () => {
    if (!user || user.role !== 'JOB_SEEKER') return;
    try {
      const res = await authFetch('/api/seeker/dashboard');
      if (res.ok) {
        const data = await res.json();
        setSeekerBookmarks(data.bookmarks.map(b => b.job.id));
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  }, [user, authFetch]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async (jobId) => {
    if (!user) {
      toast.error('Please log in to bookmark jobs');
      return;
    }
    try {
      const res = await authFetch(`/api/seeker/bookmarks/${jobId}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bookmarked) {
          setSeekerBookmarks(prev => [...prev, jobId]);
          toast.success(data.message);
        } else {
          setSeekerBookmarks(prev => prev.filter(id => id !== jobId));
          toast.success(data.message);
        }
      } else {
        toast.error('Failed to update bookmark');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error toggling bookmark');
    }
  };

  // Trigger search / Apply filters
  const applyFilters = () => {
    setActiveFilters({
      search,
      location: locationInput,
      jobType: selectedJobTypes.join(','),
      experienceLevel: selectedExperienceLevels.join(','),
      salaryMin,
      salaryMax,
      sortBy,
      page: 1, // Reset to first page on filter search
    });
    setPage(1);
    setShowMobileFilters(false);
  };

  // Reset filters
  const clearFilters = () => {
    setSearch('');
    setLocationInput('');
    setSelectedJobTypes([]);
    setSelectedExperienceLevels([]);
    setSalaryMin('');
    setSalaryMax('');
    setSortBy('newest');
    setPage(1);

    setActiveFilters({
      search: '',
      location: '',
      jobType: '',
      experienceLevel: '',
      salaryMin: '',
      salaryMax: '',
      sortBy: 'newest',
      page: 1,
    });
    toast.success('Filters cleared');
  };

  // Handle Multi-select checkbox filters
  const handleJobTypeChange = (type) => {
    setSelectedJobTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleExperienceChange = (level) => {
    setSelectedExperienceLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  // Handle Page Change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    setActiveFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero section */}
      <div className="text-center py-10 mb-8 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Find your dream job <span className="text-indigo-600 dark:text-indigo-400">today</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg font-medium">
          Discover thousands of job postings across engineering, design, marketing, and sales from leading companies.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/80 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
        {/* Keyword Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search job titles, keywords, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
          />
        </div>

        {/* Location Search */}
        <div className="relative w-full md:w-64">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="City, State, or 'Remote'"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={applyFilters}
            className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            Search
          </button>
          
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-700/30 dark:border-slate-700 dark:text-slate-300 rounded-xl"
            aria-label="Open Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-64 shrink-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm sticky top-24">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-50 dark:border-slate-700/50">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-6">
            {/* Job Types */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Job Type</h3>
              <div className="space-y-2.5">
                {[
                  { value: 'FULL_TIME', label: 'Full-time' },
                  { value: 'PART_TIME', label: 'Part-time' },
                  { value: 'REMOTE', label: 'Remote' },
                  { value: 'INTERNSHIP', label: 'Internship' },
                ].map((type) => (
                  <label key={type.value} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedJobTypes.includes(type.value)}
                      onChange={() => handleJobTypeChange(type.value)}
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience Levels */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Experience Level</h3>
              <div className="space-y-2.5">
                {[
                  { value: 'ENTRY', label: 'Entry Level' },
                  { value: 'MID', label: 'Mid Level' },
                  { value: 'SENIOR', label: 'Senior Level' },
                ].map((level) => (
                  <label key={level.value} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedExperienceLevels.includes(level.value)}
                      onChange={() => handleExperienceChange(level.value)}
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                    />
                    <span>{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Annual Salary ($)</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-slate-400 self-center">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Apply filters action */}
            <button
              onClick={applyFilters}
              className="w-full py-2.5 bg-slate-950 dark:bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Listings Display */}
        <main className="flex-1">
          {/* Header statistics and sort order */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {loading ? (
                'Loading jobs...'
              ) : (
                <>
                  Showing <span className="text-slate-800 dark:text-white font-semibold">{totalJobs}</span> jobs
                </>
              )}
            </span>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setActiveFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }));
                  setPage(1);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              >
                <option value="newest">Newest</option>
                <option value="salary_high_low">Highest Salary</option>
              </select>
            </div>
          </div>

          {/* Job cards stack */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isBookmarked={seekerBookmarks.includes(job.id)}
                    onBookmarkToggle={handleBookmarkToggle}
                    userRole={user?.role}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 font-semibold text-sm rounded-lg border transition-all ${
                          page === pageNum
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">No jobs match your search</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto text-sm">
                We couldn't find any job listings matching your filters. Try clearing some selections or searching for different keywords.
              </p>
              <button
                onClick={clearFilters}
                className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Collapsible Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-xs bg-white dark:bg-slate-800 flex flex-col p-6 shadow-xl relative animate-in slide-in-from-right duration-250">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-50 dark:border-slate-700">
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-indigo-600"
                >
                  Reset All
                </button>
              </div>

              {/* Mobile filter form */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {/* Job Types */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Job Type</h3>
                  <div className="space-y-2.5">
                    {[
                      { value: 'FULL_TIME', label: 'Full-time' },
                      { value: 'PART_TIME', label: 'Part-time' },
                      { value: 'REMOTE', label: 'Remote' },
                      { value: 'INTERNSHIP', label: 'Internship' },
                    ].map((type) => (
                      <label key={type.value} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={selectedJobTypes.includes(type.value)}
                          onChange={() => handleJobTypeChange(type.value)}
                          className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                        />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Levels */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Experience Level</h3>
                  <div className="space-y-2.5">
                    {[
                      { value: 'ENTRY', label: 'Entry Level' },
                      { value: 'MID', label: 'Mid Level' },
                      { value: 'SENIOR', label: 'Senior Level' },
                    ].map((level) => (
                      <label key={level.value} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={selectedExperienceLevels.includes(level.value)}
                          onChange={() => handleExperienceChange(level.value)}
                          className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                        />
                        <span>{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Salary Range */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Annual Salary ($)</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 text-sm"
                    />
                    <span className="text-slate-400 self-center">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
                <button
                  onClick={applyFilters}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
