import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';
import ErrorBanner from './ErrorBanner';

function ChatWindow({ messages, isTyping, onSendMessage, error, onDismissError }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-1">
              Start a Conversation
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Send a message to begin planning your next trip. Tell me your dream destination!
            </p>
          </div>
        )}

        {messages.length > 0 && messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Error banner */}
        {error && <ErrorBanner message={error} onDismiss={onDismissError} />}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Invisible anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <MessageInput onSend={onSendMessage} disabled={isTyping} />
    </div>
  );
}

export default ChatWindow;