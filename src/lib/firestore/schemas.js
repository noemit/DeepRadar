/**
 * Firestore data schema definitions and validation helpers
 */

/**
 * User profile schema
 * @typedef {Object} UserProfile
 * @property {string} displayName
 * @property {string} email
 * @property {Object} voiceProfile
 * @property {string[]} voiceProfile.toneHints
 * @property {string[]} voiceProfile.samplePhrases
 */

/**
 * Radar profile schema
 * @typedef {Object} RadarProfile
 * @property {string} role
 * @property {string} industry
 * @property {string} productFocus
 * @property {string} audience
 * @property {string[]} geography
 * @property {string[]} priorities
 * @property {string[]} avoid
 */

/**
 * Query plan schema
 * @typedef {Object} QueryPlan
 * @property {string[]} queries - Base search queries
 * @property {string[]} finalQueries - Precomputed queries ready for execution (capped at 15)
 * @property {string[]} sourcesHint - Preferred source types
 * @property {string} lastLLMPrompt - Last prompt used to generate plan
 */

/**
 * Radar document schema
 * @typedef {Object} Radar
 * @property {string} ownerId - Firebase user ID
 * @property {string} title
 * @property {Object} profile - RadarProfile
 * @property {string} mermaidDiagram - Mermaid diagram code
 * @property {Object} queryPlan - QueryPlan
 * @property {Object} settings
 * @property {boolean} settings.defaultFreshRun
 * @property {number} settings.maxResultsPerQuery
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * Report section item schema
 * @typedef {Object} ReportItem
 * @property {string} headline
 * @property {string} url
 * @property {string} source
 * @property {string} snippet
 * @property {string[]} tags
 * @property {string} [image] - Optional image URL
 */

/**
 * Report section schema
 * @typedef {Object} ReportSection
 * @property {string} title
 * @property {ReportItem[]} items
 */

/**
 * Report document schema
 * @typedef {Object} Report
 * @property {Date} createdAt
 * @property {Object} freshnessWindow
 * @property {string} freshnessWindow.fromISO
 * @property {string} freshnessWindow.toISO
 * @property {Object} inputs
 * @property {string} inputs.queryPlanHash
 * @property {string} inputs.apiVersion
 * @property {ReportSection[]} sections
 * @property {string} summary
 * @property {Object} metrics
 * @property {number} metrics.totalSources
 * @property {number} metrics.uniqueDomains
 */

/**
 * Interaction document schema
 * @typedef {Object} Interaction
 * @property {string} userId
 * @property {string} radarId
 * @property {string} type - "share" | "click" | "edit"
 * @property {Object} payload
 * @property {Date} createdAt
 */

/**
 * Validate radar profile
 * @param {Object} profile
 * @returns {boolean}
 */
export const validateRadarProfile = (profile) => {
  return (
    profile &&
    typeof profile.role === "string" &&
    typeof profile.industry === "string" &&
    typeof profile.audience === "string" &&
    Array.isArray(profile.geography) &&
    Array.isArray(profile.priorities)
  );
};

/**
 * Create default radar settings
 * @returns {Object}
 */
export const createDefaultRadarSettings = () => ({
  defaultFreshRun: false,
  maxResultsPerQuery: 10,
});

/**
 * Create default query plan
 * @returns {QueryPlan}
 */
export const createDefaultQueryPlan = () => ({
  queries: [],
  finalQueries: [],
  sourcesHint: [],
  lastLLMPrompt: "",
});
