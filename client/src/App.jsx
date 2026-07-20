import React, { useState } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import LeadPanel from './components/LeadPanel';
import { useChat } from './hooks/useChat';

function App() {
  const {
    messages,
    lead,
    isLoading,
    error,
    clearError,
    sendMessage,
    resetConversation,
  } = useChat();

  const [showLeadPanel, setShowLeadPanel] = useState(false);

  const handleToggleLeadPanel = () => {
    setShowLeadPanel((prev) => !prev);
  };

  const handleNewConversation = () => {
    resetConversation();
    setShowLeadPanel(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0">
        <Header
          onToggleLeadPanel={handleToggleLeadPanel}
          showLeadPanel={showLeadPanel}
          onNewConversation={handleNewConversation}
          hasMessages={messages.length > 0}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat area — left side */}
        <div className={`
          flex-1 flex flex-col min-w-0
          ${showLeadPanel ? 'hidden md:flex' : 'flex'}
        `}>
          <ChatWindow
            messages={messages}
            isTyping={isLoading}
            onSendMessage={sendMessage}
            error={error}
            onDismissError={clearError}
          />
        </div>

        {/* Lead panel — right side */}
        <div className={`
          w-full md:w-[380px] lg:w-[420px] border-l border-gray-700/50 bg-gray-900/95
          ${showLeadPanel ? 'fixed inset-0 z-40 md:relative md:inset-auto' : 'hidden md:block'}
        `}>
          {/* Mobile close button */}
          {showLeadPanel && (
            <div className="md:hidden absolute top-3 right-3 z-50">
              <button
                onClick={handleToggleLeadPanel}
                className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Show lead panel content only when we have lead data */}
          {lead ? (
            <LeadPanel lead={lead} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-14 h-14 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">
                No Lead Data Yet
              </h3>
              <p className="text-xs text-gray-600">
                Start a conversation to see lead information here.
              </p>
            </div>
          )}
        </div>

        {/* Mobile overlay when lead panel is open */}
        {showLeadPanel && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={handleToggleLeadPanel}
          />
        )}
      </div>
    </div>
  );
}

export default App;