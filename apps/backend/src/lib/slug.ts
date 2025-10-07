/**
 * Slug utility functions for generating URL-friendly slugs from strings
 */

/**
 * Convert a string to a URL-friendly slug
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  if (!text) return '';

  return text
    // Convert to lowercase
    .toLowerCase()
    // Remove special characters except spaces, hyphens, and underscores
    .replace(/[^\w\s-]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .trim()
    // Ensure it starts and ends with alphanumeric character
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending a number if the slug already exists
 * @param baseSlug The base slug to make unique
 * @param existingSlugs Array of existing slugs to check against
 * @returns A unique slug
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

/**
 * Generate a slug from a title and make it unique within a community context
 * @param title The title to convert to a slug
 * @param communityId The community ID to check uniqueness against
 * @param checkExisting Function to check if a slug already exists in the database
 * @returns A unique slug for the community
 */
export async function generateUniqueCommunitySlug(
  title: string,
  communityId: string,
  checkExisting: (slug: string, communityId: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = generateSlug(title);

  if (!(await checkExisting(baseSlug, communityId))) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (await checkExisting(uniqueSlug, communityId)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}