import React from 'react';

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="mx-4 mt-2 animate-slideDown" role="alert" aria-live="polite">
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
        {/* Error icon */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Message */}
        <p className="flex-1 text-sm text-red-300 leading-relaxed">
          {message}
        </p>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-red-500/10 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
            aria-label="Dismiss error"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorBanner;