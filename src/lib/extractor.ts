
// ─── DEFENSIVE REGEX DEFINITION ──────────────────────────────────────────────
// Breakdown of the expression:
//  \b             : Word boundary to prevent matching accidental substrings
//  (TRK|SHP|ID)   : Capture group matching standard logistics tracking prefixes
//  [-_]?          : Optional separator (hyphen, underscore, or none)
//  \d{4,6}        : Matches between 4 and 6 sequential digits
//  ([-_][A-Z]{2,3})? : Optional capture group for regional suffixes (e.g., -INT, -EU)
//  \b             : Closing word boundary
//  g              : Global flag to find all occurrences within the text
//  i              : Case-insensitive flag to guard against human input variance
export const LOGISTICS_TRACKING_REGEX = /\b(TRK|SHP|ID)[-_]?\d{4,6}([-_][A-Z]{2,3})?\b/gi;

export interface ExtractionResult {
  trackingId: string | null;
  cleanedText: string;
}

/**
 * Parses unstructured input text, extracts the primary tracking identifier,
 * and normalizes it to standard uppercase format.
 *
 * @param rawText - The raw unstructured log or email string
 * @returns An object containing the extracted ID and a trimmed copy of the text
 */
export function extractTrackingId(rawText: string): ExtractionResult {
  if (!rawText) {
    return { trackingId: null, cleanedText: '' };
  }

  // Defensive cleaning: remove excessive trailing/leading whitespaces or newlines
  const normalizedText = rawText.replace(/\s+/g, ' ').trim();

  // Reset regex execution state index (vital when reusing regex with global 'g' flag)
  LOGISTICS_TRACKING_REGEX.lastIndex = 0;

  const match = normalizedText.match(LOGISTICS_TRACKING_REGEX);

  // If a match is found, take the first one and standardize it to uppercase
  const trackingId = match && match.length > 0 ? match[0].toUpperCase() : null;

  return {
    trackingId,
    cleanedText: normalizedText,
  };
}