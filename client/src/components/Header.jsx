import React from 'react';

function Header({ onToggleLeadPanel, showLeadPanel, onNewConversation, hasMessages }) {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 px-4 sm:px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-white truncate">
            AI Travel Assistant
          </h1>
          <p className="text-xs text-gray-400 truncate">
            Plan your perfect trip
          </p>
        </div>

        {/* New conversation button */}
        {hasMessages && (
          <button
            onClick={onNewConversation}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-200 transition-all text-xs font-medium"
            title="Start a new conversation"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        )}

        {/* Lead panel toggle — visible on mobile */}
        <button
          onClick={onToggleLeadPanel}
          className="md:hidden w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-all"
          aria-label={showLeadPanel ? 'Close lead panel' : 'Open lead panel'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        {/* Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-medium text-emerald-400">Online</span>
        </div>
      </div>
    </header>
  );
}

export default Header;