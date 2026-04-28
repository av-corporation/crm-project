import { UserProfile } from '../types/crm';

/**
 * SAFE PATCH: Helper function to resolve readable names from user IDs.
 * Uses a global window.usersList for cross-component access if available.
 */
export const getUserName = (userId: string | undefined, users?: UserProfile[], currentUserProfile?: UserProfile | null): string => {
  if (!userId || userId === 'unassigned') return 'Unassigned';
  
  // Use provided users list, or fallback to global window.usersList
  const usersList = (users && users.length > 0) ? users : (window as any).usersList;
  const user = usersList?.find((u: any) => (u.uid || u.id) === userId);

  if (user) {
    const name = user.fullName || user.name || user.username || user.email;
    if (name) return name;
  }

  // Fallback for current user profile if provided
  if (currentUserProfile && (currentUserProfile.uid === userId || (currentUserProfile as any).id === userId)) {
    const name = currentUserProfile.fullName || currentUserProfile.name || currentUserProfile.username || currentUserProfile.email;
    if (name) return name;
    return 'You';
  }

  // If we have a global list but didn't find the user, it might be because the list is stale
  // We return a placeholder instead of the raw ID to satisfy the requirement
  return 'Loading...'; 
};

export const getUserAvatar = (userId: string | undefined, users?: UserProfile[], currentUserProfile?: UserProfile | null): string => {
  if (!userId || userId === 'unassigned') return '?';
  
  const usersList = (users && users.length > 0) ? users : (window as any).usersList;
  const user = usersList?.find((u: any) => (u.uid || u.id) === userId);
  
  if (user) {
    const name = user.name || user.username || user.email || '?';
    return name.charAt(0).toUpperCase();
  }

  if (currentUserProfile && currentUserProfile.uid === userId) {
    const name = currentUserProfile.name || currentUserProfile.username || currentUserProfile.email || '?';
    return name.charAt(0).toUpperCase();
  }
  
  return '?';
};
