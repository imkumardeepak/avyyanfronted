/**
 * Complete API Types for Avyaan Knitfab Backend
 * Based on the official API documentation
 * Exact match with all DTO specifications
 */

// ============================================
// AUTHENTICATION DTOs (AvyyanBackend.DTOs.Auth)
// ============================================

export interface LoginRequestDto {
    email: string;          // Required, email format
    password: string;       // Required
    rememberMe?: boolean;   // Optional, default: false
}

export interface LoginResponseDto {
    token: string;          // JWT token
    refreshToken: string;
    expiresAt: string;      // ISO 8601 datetime
    user: AuthUserDto;
    roles: string[];
    pageAccesses: AuthPageAccessDto[];
}

export interface RegisterRequestDto {
    firstName: string;      // Required, max 100 chars
    lastName: string;       // Required, max 100 chars
    email: string;          // Required, email format, max 255 chars
    password: string;       // Required, min 6 chars
    confirmPassword: string;// Required, must match password
    phoneNumber?: string;   // Optional, max 20 chars
}

export interface ChangePasswordRequestDto {
    currentPassword: string;  // Required
    newPassword: string;      // Required, min 6 chars
    confirmPassword: string;  // Required, must match newPassword
}

export interface ResetPasswordRequestDto {
    email: string;           // Required, email format
}

export interface AuthUserDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    lastLoginAt?: string;    // Optional datetime
    createdAt: string;       // ISO 8601 datetime
    roleName: string;
}

export interface AuthPageAccessDto {
    id: number;
    roleId: number;
    pageName: string;
    isView: boolean;
    isAdd: boolean;
    isEdit: boolean;
    isDelete: boolean;
}

// ============================================
// USER DTOs (AvyyanBackend.DTOs.User)
// ============================================

export interface UserProfileResponseDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt?: string;
    roleName: string;
    isActive: boolean;
}

export interface UpdateUserProfileRequestDto {
    firstName: string;      // Required, max 100 chars
    lastName: string;       // Required, max 100 chars
    email: string;          // Required, email format, max 255 chars
    phoneNumber?: string;   // Optional, max 20 chars
}

export interface AdminUserResponseDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt?: string;
    roleName: string;
    isActive: boolean;
}

export interface CreateUserRequestDto {
    firstName: string;      // Required, max 100 chars
    lastName: string;       // Required, max 100 chars
    email: string;          // Required, email format, max 255 chars
    password: string;       // Required, min 6 chars
    phoneNumber?: string;   // Optional, max 20 chars
    roleName: string;       // Required
    isActive?: boolean;     // Optional, default: true
}

export interface UpdateUserRequestDto {
    firstName: string;      // Required, max 100 chars
    lastName: string;       // Required, max 100 chars
    email: string;          // Required, email format, max 255 chars
    phoneNumber?: string;   // Optional, max 20 chars
    roleName: string;       // Required
    isActive?: boolean;     // Optional, default: true
}

export interface UserPermissionsResponseDto {
    userId: number;
    roleName: string;
    pageAccesses: UserPageAccessDto[];
}

export interface UserPageAccessDto {
    id: number;
    roleId: number;
    pageName: string;
    isView: boolean;
    isAdd: boolean;
    isEdit: boolean;
    isDelete: boolean;
}

// ============================================
// ROLE DTOs (AvyyanBackend.DTOs.Role)
// ============================================

export interface RoleResponseDto {
    id: number;
    roleName: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    pageAccesses: RolePageAccessDto[];
}

export interface CreateRoleRequestDto {
    name: string;           // Required, max 100 chars
    description?: string;   // Optional, max 500 chars
    isActive?: boolean;     // Optional, default: true
}

export interface UpdateRoleRequestDto {
    name: string;           // Required, max 100 chars
    description?: string;   // Optional, max 500 chars
    isActive?: boolean;     // Optional, default: true
    pageAccesses?: UpdatePageAccessRequestDto[]; // Optional, page access permissions
}

// Add this interface for page access updates
export interface UpdatePageAccessRequestDto {
    roleId: number;
    pageName: string;
    isView: boolean;
    isAdd: boolean;
    isEdit: boolean;
    isDelete: boolean;
}

export interface RolePageAccessDto {
    id: number;
    pageName: string;
    isView: boolean;
    isAdd: boolean;
    isEdit: boolean;
    isDelete: boolean;
}

export interface PageAccessResponseDto {
    id: number;
    roleId: number;
    roleName: string;
    pageName: string;
    isView: boolean;
    isAdd: boolean;
    isEdit: boolean;
    isDelete: boolean;
    createdAt: string;
    updatedAt?: string;
}

// ============================================
// MACHINE DTOs (AvyyanBackend.DTOs.Machine)
// ============================================

export interface MachineResponseDto {
    id: number;
    machineName: string;
    dia: number;
    gg: number;
    needle: number;
    feeder: number;
    rpm: number;
    constat?: number;
    efficiency: number;
    description?: string;
    createdAt: string;
    updatedAt?: string;
    isActive: boolean;
}

export interface CreateMachineRequestDto {
    machineName: string;    // Required, max 200 chars
    dia: number;            // Required, > 0
    gg: number;             // Required, > 0
    needle: number;         // Required, > 0
    feeder: number;         // Required, > 0
    rpm: number;            // Required, > 0
    constat?: number;       // Optional, >= 0
    efficiency: number;     // Required, 0.01-100
    description?: string;   // Optional, max 500 chars
}

export interface UpdateMachineRequestDto {
    machineName: string;    // Required, max 200 chars
    dia: number;            // Required, > 0
    gg: number;             // Required, > 0
    needle: number;         // Required, > 0
    feeder: number;         // Required, > 0
    rpm: number;            // Required, > 0
    constat?: number;       // Optional, >= 0
    efficiency: number;     // Required, 0.01-100
    description?: string;   // Optional, max 500 chars
    isActive?: boolean;     // Optional, default: true
}

export interface MachineSearchRequestDto {
    machineName?: string;   // Optional, max 200 chars
    dia?: number;          // Optional, > 0
    isActive?: boolean;    // Optional
}

export interface BulkCreateMachineRequestDto {
    machines: CreateMachineRequestDto[]; // Required, min 1 item
}

// ============================================
// WEBSOCKET DTOs (AvyyanBackend.DTOs.WebSocket)
// ============================================

export interface WebSocketConnectionRequestDto {
    employeeId: string;     // Required
    connectionId?: string;  // Optional
    timestamp?: string;     // Optional, default: current UTC
}

export interface ChatMessageDto {
    id: string;
    senderId: string;
    receiverId: string;
    message: string;
    timestamp: string;      // Default: current UTC
    isRead: boolean;        // Default: false
}

export interface NotificationDto {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    timestamp: string;      // Default: current UTC
    isRead: boolean;        // Default: false
}

export interface WebSocketResponseDto {
    type: string;
    data: any;              // Generic object
    timestamp: string;      // Default: current UTC
    success: boolean;       // Default: true
}

// ============================================
// COMMON DTOs (AvyyanBackend.DTOs.Common)
// ============================================

export interface ApiResponseDto<T> {
    success: boolean;       // Default: true
    message: string;
    data?: T;              // Generic type
    timestamp: string;     // Default: current UTC
    errors: string[];
}

export interface PaginatedResponseDto<T> {
    items: T[];
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;  // Computed
    hasPreviousPage: boolean; // Computed
}

export interface MessageResponseDto {
    message: string;
    timestamp: string;     // Default: current UTC
    success: boolean;      // Default: true
}

export interface ErrorResponseDto {
    error: string;
    details?: string;      // Optional
    timestamp: string;     // Default: current UTC
    statusCode: number;
}

export interface BaseAuditDto {
    createdAt: string;
    updatedAt?: string;    // Optional
    isActive: boolean;     // Default: true
}

export interface ValidationErrorResponse {
    success: false;
    message: "Validation failed";
    data: null;
    timestamp: string;
    errors: string[];
}

// ============================================
// FABRIC STRUCTURE DTOs (AvyyanBackend.DTOs.FabricStructure)
// ============================================

export interface FabricStructureResponseDto {
    id: number;
    fabricstr: string;
    standardeffencny: number;
    createdAt: string;
    updatedAt?: string;
    isActive: boolean;
}

export interface CreateFabricStructureRequestDto {
    fabricstr: string;
    standardeffencny: number;
}

export interface UpdateFabricStructureRequestDto {
    fabricstr: string;
    standardeffencny: number;
    isActive: boolean;
}

export interface FabricStructureSearchRequestDto {
    fabricstr?: string;
    isActive?: boolean;
}

// ============================================
// LEGACY COMPATIBILITY TYPES
// ============================================

// For backward compatibility with existing code
export interface LoginDto extends LoginRequestDto { }
export interface RegisterDto extends RegisterRequestDto { }
export interface ChangePasswordDto extends ChangePasswordRequestDto { }
export interface ResetPasswordDto extends ResetPasswordRequestDto { }
export interface UserDto extends AuthUserDto { }
export interface CreateUserDto extends CreateUserRequestDto { }
export interface UpdateUserDto extends UpdateUserRequestDto { }
export interface RoleDto extends RoleResponseDto { }
export interface CreateRoleDto extends CreateRoleRequestDto { }
export interface UpdateRoleDto extends UpdateRoleRequestDto { }
export interface PageAccessDto extends AuthPageAccessDto { }
export interface ApiResponse<T> extends ApiResponseDto<T> { }
export interface ErrorResponse extends ErrorResponseDto { }
export interface MessageResponse extends MessageResponseDto { }
export interface PaginatedResponse<T> extends PaginatedResponseDto<T> { }

// ============================================
// TYPE ALIASES FOR COMPONENT COMPATIBILITY
// ============================================

export type User = AdminUserResponseDto;
export type Role = RoleResponseDto;
export type PageAccess = PageAccessResponseDto;
export type Machine = MachineResponseDto;
export type CreateUser = CreateUserRequestDto;
export type UpdateUser = UpdateUserRequestDto;
export type CreateRole = CreateRoleRequestDto;
export type UpdateRole = UpdateRoleRequestDto;
export type CreateMachine = CreateMachineRequestDto;
export type UpdateMachine = UpdateMachineRequestDto;

// ============================================
// ENUMS AND CONSTANTS
// ============================================

// User Status Values
export const UserStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
} as const;

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

// Permission Type Values
export const PermissionType = {
    VIEW: 'view',
    ADD: 'add',
    EDIT: 'edit',
    DELETE: 'delete'
} as const;

export type PermissionTypeType = typeof PermissionType[keyof typeof PermissionType];

export const VALIDATION_RULES = {
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    PASSWORD_MIN_LENGTH: 6,
    PHONE_MAX_LENGTH: 20,
    DESCRIPTION_MAX_LENGTH: 500,
    MACHINE_NAME_MAX_LENGTH: 200,
    ROLE_NAME_MAX_LENGTH: 100,
    EFFICIENCY_MIN: 0.01,
    EFFICIENCY_MAX: 100
} as const;

// ============================================
// FORM DATA TYPES FOR COMPONENTS
// ============================================

export interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
}

export interface UserFormData {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    roleName: string;
    isActive: boolean;
    password?: string;
}

export interface RoleFormData {
    name: string;
    description: string;
    isActive: boolean;
    pageAccesses: {
        pageName: string;
        isView: boolean;
        isAdd: boolean;
        isEdit: boolean;
        isDelete: boolean;
    }[];
}

export interface MachineFormData {
    machineName: string;
    dia: number;
    gg: number;
    needle: number;
    feeder: number;
    rpm: number;
    constat?: number;
    efficiency: number;
    description?: string;
    isActive: boolean;
}