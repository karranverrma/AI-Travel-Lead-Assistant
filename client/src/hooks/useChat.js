import { useState, useRef, useCallback } from 'react';
import { sendMessage, ApiError } from '../services/api';

export function useChat(initialMessages = []) {
  const [messages, setMessages] = useState(initialMessages);
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref to track the conversation ID — persists across renders
  const conversationIdRef = useRef(null);

  // Clear any displayed error
  const clearError = useCallback(() => setError(null), []);

  // Send a message to the backend
  const handleSendMessage = useCallback(async (content) => {
    // Clear previous errors
    setError(null);

    const trimmed = content.trim();
    if (!trimmed) return;

    // Generate a temp ID for optimistic UI update
    const tempId = `temp-${Date.now()}`;

    // Add user message immediately (optimistic)
    const userMessage = {
      id: tempId,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call the backend
      const result = await sendMessage(
        conversationIdRef.current,
        trimmed
      );

      // Store the conversation ID for subsequent messages
      conversationIdRef.current = result.conversationId;

      // Update lead state from response
      setLead(result.lead);

      // Add AI response message
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      // Handle different error types
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError(err.message);
        } else if (err.status === 0) {
          // Network or timeout error
          setError(err.message);
        } else {
          setError(`Something went wrong: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      // Remove the user message that failed
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== tempId)
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset conversation
  const resetConversation = useCallback(() => {
    conversationIdRef.current = null;
    setMessages([]);
    setLead(null);
    setError(null);
  }, []);

  return {
    messages,
    lead,
    isLoading,
    error,
    clearError,
    sendMessage: handleSendMessage,
    resetConversation,
  };
}