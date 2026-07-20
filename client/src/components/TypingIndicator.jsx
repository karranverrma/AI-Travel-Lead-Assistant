import React from 'react';

function TypingIndicator() {
  return (
    <div className="flex justify-start message-enter">
      <div className="flex gap-3 max-w-[85%]">
        {/* AI Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-medium text-white">
          AI
        </div>

        {/* Typing dots */}
        <div className="px-4 py-3 rounded-2xl bg-gray-800/80 border border-gray-700/50 rounded-tl-md">
          <div className="flex items-center gap-1.5">
            <span className="typing-dot w-2 h-2 rounded-full bg-gray-400"></span>
            <span className="typing-dot w-2 h-2 rounded-full bg-gray-400"></span>
            <span className="typing-dot w-2 h-2 rounded-full bg-gray-400"></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;