import React from 'react';
import { Sprout, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-slate-800 bg-[#0c1322]/80 backdrop-blur-sm my-6">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-black/40 relative">
        <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-md"></div>
        <div className="relative text-2xl sm:text-3xl">
          {icon || <Sprout className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />}
        </div>
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2 font-game tracking-wide">
        {title}
      </h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
