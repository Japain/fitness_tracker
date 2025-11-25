/**
 * User entity - represents an authenticated user
 */
export interface User {
  id: string;                  // UUID
  email: string;               // From OAuth provider
  displayName: string;         // From OAuth provider
  profilePictureUrl?: string;  // From OAuth provider
  createdAt: Date;
  updatedAt: Date;
}
