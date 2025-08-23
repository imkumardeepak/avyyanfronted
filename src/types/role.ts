export interface Role {
  id: number;
  roleName: string;
  description: string;
}

export interface PageAccess {
  id: number;
  pageName: string;
  path: string;
  isRead: boolean;
  isWrite: boolean;
  isDelete: boolean;
}