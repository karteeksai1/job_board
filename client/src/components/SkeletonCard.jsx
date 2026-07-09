import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {/* Logo Placeholder */}
        <div className="w-12 h-12 rounded-lg shimmer shrink-0"></div>
        {/* Title and Company */}
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded shimmer"></div>
          <div className="h-4 w-1/2 rounded shimmer"></div>
        </div>
      </div>

      {/* Meta Indicators */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 py-1 border-t border-b border-slate-50 dark:border-slate-700/50">
        <div className="h-4 w-24 rounded shimmer"></div>
        <div className="h-4 w-20 rounded shimmer"></div>
        <div className="h-4 w-28 rounded shimmer"></div>
      </div>

      {/* Bottom Row */}
      <div className="flex justify-between items-center mt-2">
        <div className="h-4 w-16 rounded shimmer"></div>
        <div className="h-8 w-24 rounded-lg shimmer"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
