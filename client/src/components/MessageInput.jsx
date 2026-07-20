import React, { useState, useCallback } from 'react';

function MessageInput({ onSend, disabled }) {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  }, [input, disabled, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-sm px-4 py-3">
      <div className="flex items-end gap-2">
        {/* Input */}
        <div className="flex-1 relative">
          <label htmlFor="message-input" className="sr-only">
            Type your message
          </label>
          <input
            id="message-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled}
            autoComplete="off"
            className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-describedby="input-hint"
          />
          {/* Character count for long messages */}
          {input.length > 200 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
              {input.length}
            </span>
          )}
          <span id="input-hint" className="sr-only">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          aria-label="Send message"
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/20 disabled:shadow-none"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}

export default MessageInput;
