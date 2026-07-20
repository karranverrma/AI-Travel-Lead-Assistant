const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Custom error class for API errors
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Timeout wrapper — abort request after 15 seconds
async function fetchWithTimeout(resource, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 0, null);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Send a chat message to the backend
// Returns: { reply, lead, conversationId }
export async function sendMessage(conversationId, message) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new ApiError('Message is required', 400, null);
  }

  const body = { message: message.trim() };
  if (conversationId) {
    body.conversationId = conversationId;
  }

  let response;
  try {
    response = await fetchWithTimeout(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    // Network failure (no connection, DNS failure, etc.)
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Unable to reach the server. Please check your connection and try again.',
      0,
      null
    );
  }

  // Try to parse JSON regardless of status code
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      'Received an invalid response from the server.',
      response.status,
      null
    );
  }

  // Handle non-2xx responses
  if (!response.ok) {
    const errorMessage =
      data?.error?.message || `Server error (${response.status})`;
    throw new ApiError(errorMessage, response.status, data);
  }

  // Validate response has required fields
  if (!data.reply || !data.lead) {
    throw new ApiError(
      'Received an incomplete response from the server.',
      response.status,
      data
    );
  }

  return {
    reply: data.reply,
    lead: data.lead,
    conversationId: data.conversationId,
  };
}

export { ApiError };