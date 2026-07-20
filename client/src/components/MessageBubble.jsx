import React, { useMemo } from 'react';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  const formattedTime = useMemo(() => {
    if (!message.timestamp) return '';
    return message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.timestamp]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-enter`}>
      <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
            : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
        }`} aria-hidden="true">
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Message content */}
        <div className="flex flex-col gap-1">
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600/20 border border-blue-500/20 text-blue-50 rounded-tr-md'
              : 'bg-gray-800/80 border border-gray-700/50 text-gray-100 rounded-tl-md'
          }`}>
            {message.content}
          </div>

          {/* Timestamp */}
          <time className={`text-[10px] text-gray-500 px-1 ${isUser ? 'text-right' : 'text-left'}`} dateTime={message.timestamp?.toISOString()}>
            {formattedTime}
          </time>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
