import React from 'react';
import LeadField from './LeadField';

// SVG Icon components for each field
const Icons = {
  destination: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  departure: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  date: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  travellers: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  budget: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  duration: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  tripType: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  requirements: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  name: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  email: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

function ScoreGauge({ score }) {
  const getColor = () => {
    if (score >= 80) return 'from-emerald-500 to-green-400';
    if (score >= 60) return 'from-blue-500 to-cyan-400';
    if (score >= 40) return 'from-amber-500 to-orange-400';
    return 'from-gray-500 to-gray-400';
  };

  const getLabel = () => {
    if (score >= 80) return 'Hot Lead';
    if (score >= 60) return 'Qualified';
    if (score >= 40) return 'Interested';
    return 'Exploring';
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
          Lead Score
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          score >= 60
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : score >= 40
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-gray-700/30 text-gray-400 border border-gray-600/30'
        }`}>
          {getLabel()}
        </span>
      </div>

      {/* Score bar */}
      <div className="relative h-3 bg-gray-700/50 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
        {/* Glow effect */}
        <div
          className={`absolute top-0 right-0 h-full w-6 bg-gradient-to-r ${getColor()} blur-sm opacity-50`}
          style={{ width: `${Math.min(score + 10, 100)}%`, right: `${100 - score}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-[10px] text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

function LeadPanel({ lead }) {
  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-700/50">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Lead Information
        </h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {/* Score Section */}
        <ScoreGauge score={lead.leadScore} />

        {/* Travel Details Section */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2 px-1">
            Travel Details
          </p>
          <div className="space-y-2">
            <LeadField label="Destination" value={lead.destination} icon={Icons.destination} highlight />
            <LeadField label="Departure City" value={lead.departureCity} icon={Icons.departure} highlight />
            <LeadField label="Travel Date" value={lead.travelDate} icon={Icons.date} highlight />
            <LeadField label="Travellers" value={lead.travellers} icon={Icons.travellers} highlight />
            <LeadField label="Budget" value={lead.budget} icon={Icons.budget} highlight />
            <LeadField label="Duration" value={lead.duration} icon={Icons.duration} highlight />
            <LeadField label="Trip Type" value={lead.tripType} icon={Icons.tripType} highlight />
            <LeadField label="Special Requirements" value={lead.specialRequirements} icon={Icons.requirements} />
          </div>
        </div>

        {/* Contact Details Section */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2 px-1">
            Contact Information
          </p>
          <div className="space-y-2">
            <LeadField label="Customer Name" value={lead.customerName} icon={Icons.name} />
            <LeadField label="Phone" value={lead.phone} icon={Icons.phone} />
            <LeadField label="Email" value={lead.email} icon={Icons.email} />
          </div>
        </div>

        {/* Status Section */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2 px-1">
            Status
          </p>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Confidence</span>
              <span className={`text-xs font-medium ${
                lead.confidence === 'High' ? 'text-emerald-400' :
                lead.confidence === 'Medium' ? 'text-amber-400' : 'text-gray-400'
              }`}>
                {lead.confidence}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Status</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                lead.qualificationStatus === 'Qualified'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : lead.qualificationStatus === 'In Progress'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-gray-700/30 text-gray-400 border border-gray-600/30'
              }`}>
                {lead.qualificationStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2 px-1">
            Summary
          </p>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
            <p className="text-xs text-gray-300 leading-relaxed">
              {lead.summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeadPanel;