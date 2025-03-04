/**
 * Utility functions for generating and handling slugs
 * 
 * These functions work without requiring database changes and provide
 * robust slug handling for the application.
 */

/**
 * Generate a URL-friendly slug from a string
 * - Converts to lowercase
 * - Replaces all non-alphanumeric characters with hyphens
 * - Removes consecutive hyphens
 * - Removes leading and trailing hyphens
 * 
 * @param text The string to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  // Special handling for common problematic characters
  const normalized = text
    .replace(/'/g, '')     // Remove apostrophes completely
    .replace(/&/g, 'and')  // Replace & with 'and'
    .replace(/\+/g, 'plus') // Replace + with 'plus'
  
  return normalized
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');      // Remove leading and trailing hyphens
}

/**
 * Get all possible slug variations for a given text
 * This helps with matching different slug formats without database changes
 * 
 * @param text The text to generate slug variations from
 * @returns An array of possible slug variations
 */
export function getSlugVariations(text: string): string[] {
  if (!text) return [];
  
  const normalizedText = text.toLowerCase().trim();
  const standardSlug = generateSlug(normalizedText);
  
  // Handle apostrophes specially
  const withoutApostrophes = normalizedText.replace(/'/g, '');
  const apostropheVariations = [
    withoutApostrophes.replace(/\s+/g, '-'),
    withoutApostrophes.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
  ];
  
  return [
    standardSlug,                                  // Standard slug
    normalizedText.replace(/\s+/g, '-'),           // Simple spaces to hyphens
    normalizedText.replace(/\s+/g, '.'),           // Spaces to dots
    normalizedText.replace(/[^a-z0-9]/g, ''),      // Alphanumeric only
    standardSlug.replace(/-/g, '.'),               // Hyphens to dots
    standardSlug + '-',                            // With trailing hyphen
    ...apostropheVariations,                        // Variations without apostrophes
  ].filter(Boolean);  // Remove any empty strings
}

/**
 * Check if two slugs match, considering various formats
 * This function is used to compare URL slugs with game slugs
 * without requiring database changes
 * 
 * @param slug1 First slug to compare
 * @param slug2 Second slug to compare
 * @returns True if the slugs match in any format
 */
export function slugsMatch(slug1: string, slug2: string): boolean {
  if (!slug1 || !slug2) return false;
  
  // Normalize inputs
  const s1 = slug1.toLowerCase().trim();
  const s2 = slug2.toLowerCase().trim();
  
  // Direct match check
  if (s1 === s2) return true;
  
  // Special handling for apostrophes
  const s1WithoutApostrophe = s1.replace(/'/g, '');
  const s2WithoutApostrophe = s2.replace(/'/g, '');
  
  if (s1WithoutApostrophe === s2WithoutApostrophe) return true;
  
  // Generate all possible variations
  const variations1 = getSlugVariations(s1);
  const variations2 = getSlugVariations(s2);
  
  // Add direct variations for apostrophes
  variations1.push(s1WithoutApostrophe);
  variations2.push(s2WithoutApostrophe);
  
  // Check if any variation of slug1 matches any variation of slug2
  if (variations1.some(v1 => variations2.some(v2 => v1 === v2))) {
    return true;
  }
  
  // Check if one is contained within the other
  if (s1.includes(s2) || s2.includes(s1) || 
      s1WithoutApostrophe.includes(s2WithoutApostrophe) || 
      s2WithoutApostrophe.includes(s1WithoutApostrophe)) {
    return true;
  }
  
  // Check if the first part matches (before any special characters)
  const firstPart1 = s1.split(/[^a-z0-9]/).filter(Boolean)[0];
  const firstPart2 = s2.split(/[^a-z0-9]/).filter(Boolean)[0];
  
  if (firstPart1 && firstPart2 && firstPart1.length > 2 && firstPart2.length > 2) {
    return firstPart1 === firstPart2;
  }
  
  return false;
}
