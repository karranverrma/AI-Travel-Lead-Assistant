const { getSupabaseClient, isSupabaseConfigured } = require('../config/supabase');
const logger = require('../utils/logger');

// ─── Lead Field Schema ──────────────────────────────────────
const LEAD_FIELDS = [
  { name: 'destination',       type: 'string', label: 'Destination' },
  { name: 'departureCity',     type: 'string', label: 'Departure City' },
  { name: 'travelDate',        type: 'string', label: 'Travel Date' },
  { name: 'travellers',        type: 'number', label: 'Travellers' },
  { name: 'budget',            type: 'string', label: 'Budget' },
  { name: 'duration',          type: 'string', label: 'Duration' },
  { name: 'tripType',          type: 'string', label: 'Trip Type' },
  { name: 'specialRequirements', type: 'string', label: 'Special Requirements' },
  { name: 'customerName',      type: 'string', label: 'Customer Name' },
  { name: 'phone',             type: 'string', label: 'Phone' },
  { name: 'email',             type: 'string', label: 'Email' },
];

const MERGE_STRATEGIES = {
  destination: 'replace',
  departureCity: 'replace',
  travelDate: 'replace',
  travellers: 'replace',
  budget: 'replace',
  duration: 'replace',
  tripType: 'replace',
  specialRequirements: 'append',
  customerName: 'replace',
  phone: 'replace',
  email: 'replace',
};

// ─── Field Validators ───────────────────────────────────────
const validators = {
  destination: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    const normalized = value.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').replace(/\s*,\s*/g, ', ');
    return { valid: true, normalized };
  },
  departureCity: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    const normalized = value.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return { valid: true, normalized };
  },
  travelDate: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    return { valid: true, normalized: value.trim() };
  },
  travellers: (value) => {
    let num = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(num) || num < 1) return { valid: false, normalized: null };
    return { valid: true, normalized: Math.floor(num) };
  },
  budget: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    let normalized = value.trim();
    if (!normalized.startsWith('$')) normalized = '$' + normalized;
    normalized = normalized.replace(/\s*-\s*/g, ' - ').replace(/\s*to\s*/g, ' - ');
    return { valid: true, normalized };
  },
  duration: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    let normalized = value.trim().toLowerCase();
    const match = normalized.match(/(\d+)\s*(days?|nights?|weeks?|months?)/);
    if (match) {
      const num = match[1], unit = match[2];
      if (unit.startsWith('night')) normalized = `${num} nights`;
      else if (unit.startsWith('week')) normalized = `${num} weeks`;
      else normalized = `${num} days`;
    }
    return { valid: true, normalized };
  },
  tripType: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    const tripTypeMap = {
      'family': 'Family Vacation', 'family vacation': 'Family Vacation',
      'romantic': 'Romantic Getaway', 'romantic getaway': 'Romantic Getaway', 'honeymoon': 'Romantic Getaway',
      'adventure': 'Adventure Trip', 'adventure trip': 'Adventure Trip',
      'business': 'Business Trip', 'business trip': 'Business Trip',
      'luxury': 'Luxury Travel', 'luxury travel': 'Luxury Travel',
      'beach': 'Beach Vacation', 'beach vacation': 'Beach Vacation',
      'cultural': 'Cultural Trip', 'cultural trip': 'Cultural Trip',
      'solo': 'Solo Travel', 'solo travel': 'Solo Travel',
      'road trip': 'Road Trip', 'roadtrip': 'Road Trip',
      'backpacking': 'Backpacking',
    };
    const matched = tripTypeMap[value.trim().toLowerCase()];
    return { valid: true, normalized: matched || value.trim() };
  },
  specialRequirements: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    return { valid: true, normalized: value.trim() };
  },
  customerName: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    const normalized = value.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    if (normalized.length < 2) return { valid: false, normalized: null };
    return { valid: true, normalized };
  },
  phone: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7) return { valid: false, normalized: null };
    return { valid: true, normalized: value.trim() };
  },
  email: (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return { valid: false, normalized: null };
    const normalized = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      logger.debug('Email validation failed', { email: normalized });
      return { valid: false, normalized: null };
    }
    return { valid: true, normalized };
  },
};

// ─── Core Merge Logic ──────────────────────────────────────
function mergeLeadData(existing, extracted) {
  if (!extracted || typeof extracted !== 'object') {
    return { lead: { ...existing }, changes: [] };
  }

  const merged = { ...existing };
  const changes = [];

  for (const [field, rawValue] of Object.entries(extracted)) {
    if (!LEAD_FIELDS.some(f => f.name === field)) continue;
    if (rawValue === null || rawValue === undefined || rawValue === '') continue;

    const validator = validators[field];
    if (!validator) {
      if (rawValue !== null && rawValue !== undefined) {
        const oldValue = merged[field];
        merged[field] = rawValue;
        if (oldValue !== rawValue) changes.push({ field, from: oldValue, to: rawValue });
      }
      continue;
    }

    const { valid, normalized } = validator(rawValue);
    if (!valid || normalized === null || normalized === undefined) continue;

    const strategy = MERGE_STRATEGIES[field] || 'replace';
    const oldValue = merged[field];

    switch (strategy) {
      case 'append':
        if (oldValue) {
          const oldLower = oldValue.toLowerCase();
          const newLower = String(normalized).toLowerCase();
          if (!oldLower.includes(newLower)) {
            merged[field] = `${oldValue}; ${normalized}`;
            changes.push({ field, from: oldValue, to: merged[field], strategy: 'append' });
          }
        } else {
          merged[field] = normalized;
          changes.push({ field, from: null, to: normalized, strategy: 'set' });
        }
        break;
      case 'replace':
      default:
        if (oldValue !== normalized) {
          merged[field] = normalized;
          changes.push({ field, from: oldValue, to: normalized, strategy: oldValue === null || oldValue === undefined ? 'set' : 'update' });
        }
        break;
    }
  }

  return { lead: merged, changes };
}

// ─── Helpers ───────────────────────────────────────────────
function getFieldLabel(fieldName) {
  const field = LEAD_FIELDS.find(f => f.name === fieldName);
  return field ? field.label : fieldName;
}

function getFieldType(fieldName) {
  const field = LEAD_FIELDS.find(f => f.name === fieldName);
  return field ? field.type : 'string';
}

function createEmptyLead() {
  return {
    destination: null, departureCity: null, travelDate: null, travellers: null,
    budget: null, duration: null, tripType: null, specialRequirements: null,
    customerName: null, phone: null, email: null,
    leadScore: 0, confidence: 'Low', qualificationStatus: 'Exploring', summary: null,
  };
}

// ─── Supabase Database Operations ──────────────────────────

/**
 * Save a qualified lead to Supabase.
 * Only saves when qualification_status is 'Qualified'.
 * Uses conversation_id as unique constraint to prevent duplicates.
 *
 * @param {Object} lead - The lead object to save
 * @returns {{ success: boolean, leadId?: string, error?: string }}
 */
async function saveLeadToDatabase(lead) {
  // Only save qualified leads
  if (lead.qualificationStatus !== 'Qualified') {
    logger.debug('Lead not qualified, skipping database save', {
      qualificationStatus: lead.qualificationStatus,
      score: lead.leadScore,
    });
    return { success: false, skipped: true, reason: 'Lead not qualified' };
  }

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    logger.warn('Supabase not configured, skipping database save');
    return { success: false, skipped: true, reason: 'Supabase not configured' };
  }

  try {
    const supabase = getSupabaseClient();

    // Build the database record
    // Map camelCase lead fields to snake_case database columns
    const dbRecord = {
      conversation_id: lead.conversationId,
      destination: lead.destination,
      departure_city: lead.departureCity,
      travel_date: lead.travelDate,
      travellers: lead.travellers,
      budget: lead.budget,
      duration: lead.duration,
      trip_type: lead.tripType,
      special_requirements: lead.specialRequirements,
      customer_name: lead.customerName,
      phone: lead.phone,
      email: lead.email,
      lead_score: lead.leadScore,
      confidence: lead.confidence,
      qualification_status: lead.qualificationStatus,
      summary: lead.summary,
      buying_intent: lead.buyingIntent || 'low',
    };

    logger.info('Saving qualified lead to database', {
      conversationId: lead.conversationId,
      score: lead.leadScore,
      destination: lead.destination,
    });

    // INSERT with ON CONFLICT DO NOTHING to prevent duplicate conversation inserts
    // This uses the UNIQUE constraint on conversation_id
    const { data, error } = await supabase
      .from('leads')
      .insert(dbRecord)
      .select('id')
      .single();

    if (error) {
      // Handle duplicate key error (conversation_id already exists)
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        logger.warn('Duplicate lead insert prevented', {
          conversationId: lead.conversationId,
        });
        return { success: false, skipped: true, reason: 'Duplicate conversation_id' };
      }

      logger.error('Failed to save lead to database', {
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return { success: false, error: error.message };
    }

    logger.info('Lead saved successfully', {
      leadId: data.id,
      conversationId: lead.conversationId,
    });

    return { success: true, leadId: data.id };
  } catch (error) {
    logger.error('Exception saving lead to database', {
      error: error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing lead in the database.
 * Used when a lead is updated after initial qualification.
 *
 * @param {string} conversationId - The conversation ID to find the lead
 * @param {Object} updates - Fields to update
 * @returns {{ success: boolean, error?: string }}
 */
async function updateLeadInDatabase(conversationId, updates) {
  if (!isSupabaseConfigured()) {
    return { success: false, skipped: true, reason: 'Supabase not configured' };
  }

  try {
    const supabase = getSupabaseClient();

    // Map camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.destination) dbUpdates.destination = updates.destination;
    if (updates.departureCity) dbUpdates.departure_city = updates.departureCity;
    if (updates.travelDate) dbUpdates.travel_date = updates.travelDate;
    if (updates.travellers) dbUpdates.travellers = updates.travellers;
    if (updates.budget) dbUpdates.budget = updates.budget;
    if (updates.duration) dbUpdates.duration = updates.duration;
    if (updates.tripType) dbUpdates.trip_type = updates.tripType;
    if (updates.specialRequirements) dbUpdates.special_requirements = updates.specialRequirements;
    if (updates.customerName) dbUpdates.customer_name = updates.customerName;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.email) dbUpdates.email = updates.email;
    if (updates.leadScore) dbUpdates.lead_score = updates.leadScore;
    if (updates.confidence) dbUpdates.confidence = updates.confidence;
    if (updates.qualificationStatus) dbUpdates.qualification_status = updates.qualificationStatus;
    if (updates.summary) dbUpdates.summary = updates.summary;
    if (updates.buyingIntent) dbUpdates.buying_intent = updates.buyingIntent;

    // updated_at is auto-updated by trigger

    const { data, error } = await supabase
      .from('leads')
      .update(dbUpdates)
      .eq('conversation_id', conversationId)
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to update lead in database', {
        error: error.message,
        conversationId,
      });
      return { success: false, error: error.message };
    }

    logger.info('Lead updated in database', {
      leadId: data.id,
      conversationId,
    });

    return { success: true, leadId: data.id };
  } catch (error) {
    logger.error('Exception updating lead in database', {
      error: error.message,
      conversationId,
    });
    return { success: false, error: error.message };
  }
}

module.exports = {
  LEAD_FIELDS,
  MERGE_STRATEGIES,
  getFieldLabel,
  getFieldType,
  mergeLeadData,
  createEmptyLead,
  saveLeadToDatabase,
  updateLeadInDatabase,
};