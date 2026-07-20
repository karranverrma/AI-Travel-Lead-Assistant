const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

let aiClient = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Validate API key exists
    if (!apiKey) {
      const error = new Error(
        'GEMINI_API_KEY is not set in environment variables. ' +
        'Please add it to your .env file.'
      );
      logger.error('Gemini client initialization failed', { error: error.message });
      throw error;
    }
    
    // Validate API key is not a placeholder
    const placeholderPatterns = [
      'your-gemini-api-key',
      'your-api-key',
      'placeholder',
      'xxx',
      'TODO',
      'FIXME',
    ];
    
    const isPlaceholder = placeholderPatterns.some(pattern => 
      apiKey.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isPlaceholder) {
      const error = new Error(
        `GEMINI_API_KEY appears to be a placeholder value: "${apiKey.substring(0, 20)}...". ` +
        'Please replace it with a real API key from https://aistudio.google.com/app/apikey'
      );
      logger.error('Gemini client initialization failed - placeholder detected', { 
        error: error.message,
        apiKeyLength: apiKey.length,
      });
      throw error;
    }
    
    // Validate API key format (accept various Google AI Studio key formats)
    // Keys can start with AIza, AQ., or other prefixes depending on the project
    if (apiKey.length < 20) {
      const error = new Error(
        `GEMINI_API_KEY appears too short (${apiKey.length} characters). ` +
        'Please check that you copied the complete key from https://aistudio.google.com/app/apikey'
      );
      logger.error('Gemini client initialization failed - key too short', { 
        error: error.message,
        apiKeyLength: apiKey.length,
      });
      throw error;
    }
    
    // Log that we're initializing (without exposing the full key)
    logger.info('Initializing Gemini client', {
      provider: 'Google AI Studio',
      model: getModelName(),
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
    });
    
    try {
      aiClient = new GoogleGenAI({ apiKey });
      logger.info('Gemini client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Gemini client', { error: error.message });
      throw error;
    }
  }
  return aiClient;
}

function getModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

function isConfigured() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) return false;
  
  // Check for placeholders
  const placeholderPatterns = [
    'your-gemini-api-key',
    'your-api-key',
    'placeholder',
    'xxx',
    'TODO',
    'FIXME',
  ];
  
  const isPlaceholder = placeholderPatterns.some(pattern => 
    apiKey.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isPlaceholder) return false;
  
  // Check minimum length (Google AI Studio keys are typically 20+ characters)
  if (apiKey.length < 20) return false;
  
  return true;
}

module.exports = { getGeminiClient, getModelName, isConfigured };
