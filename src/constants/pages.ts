/**
 * Application Page Names
 * These constants ensure consistency between sidebar navigation and role permissions
 */

export const PAGE_NAMES = {
    DASHBOARD: 'Dashboard',
    USER_MANAGEMENT: 'User Management',
    ROLE_MASTER: 'Role Master',
    MACHINE_MASTER: 'Machine Master',
    CHAT: 'Chat',
    NOTIFICATIONS: 'Notifications',
} as const;

// Array of all page names for role management
export const AVAILABLE_PAGES = Object.values(PAGE_NAMES);

// Type for page names
export type PageName = typeof PAGE_NAMES[keyof typeof PAGE_NAMES];