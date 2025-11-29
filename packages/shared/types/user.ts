/**
 * User entity - represents an authenticated user
 */
export interface User {
  id: string;                  // UUID
  googleId: string;            // OAuth provider ID
  email: string;               // From OAuth provider
  displayName: string;         // From OAuth provider
  profilePictureUrl?: string;  // From OAuth provider
  preferredWeightUnit: 'lbs' | 'kg';  // User's preferred weight unit
  createdAt: Date;
  updatedAt: Date;
}
