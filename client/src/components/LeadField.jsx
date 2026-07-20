import React from 'react';

function LeadField({ label, value, icon, highlight }) {
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
      highlight && hasValue
        ? 'bg-emerald-500/5 border border-emerald-500/10'
        : 'bg-gray-800/30 border border-gray-700/30'
    }`}>
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        hasValue
          ? 'bg-blue-500/10 text-blue-400'
          : 'bg-gray-700/30 text-gray-500'
      }`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-0.5">
          {label}
        </p>
        {hasValue ? (
          <p className="text-sm font-medium text-gray-100 truncate">
            {value}
          </p>
        ) : (
          <p className="text-sm text-gray-600 italic">
            Not provided
          </p>
        )}
      </div>
    </div>
  );
}

export default LeadField;