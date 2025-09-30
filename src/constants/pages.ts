/**
 * Application Page Names
 * These constants ensure consistency between sidebar navigation and role permissions
 */

export const PAGE_NAMES = {
    DASHBOARD: 'Dashboard',
    USER_MANAGEMENT: 'User Management',
    FABRIC_STRUCTURE: 'Fabric Structure',
    LOCATION_MASTER: 'Location Master',
    YARNTYPE_MASTER: 'Yarn Type',
    ROLE_MASTER: 'Role Master',
    MACHINE_MASTER: 'Machine Master',
    SALES_ORDERS: 'Sales Orders',
    CHAT: 'Chat',
    NOTIFICATIONS: 'Notifications',
    PRODUCTION_ALLOTMENT: 'Production Allotment',
    STORAGE_CAPTURE: 'Storage Capture',
    TAPE_COLOR_MASTER: 'Tape Color',
    SHIFT_MASTER: 'Shift Master',
} as const;

// Array of all page names for role management
export const AVAILABLE_PAGES = Object.values(PAGE_NAMES);

// Type for page names
export type PageName = typeof PAGE_NAMES[keyof typeof PAGE_NAMES];