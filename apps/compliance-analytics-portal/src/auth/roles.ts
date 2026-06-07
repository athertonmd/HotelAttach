export type UserRole =
  | 'platform_admin'
  | 'tmc_admin'
  | 'tmc_user'
  | 'corporate_admin'
  | 'corporate_user';

export interface RolePermissions {
  dashboards: string[];
  canManageEscalations: boolean;
  canManageUsers: boolean;
  creatableRoles: UserRole[];
  showTmcSelector: boolean;
  showCorporateSelector: boolean;
  scope: 'platform' | 'tmc' | 'corporate';
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  platform_admin: {
    dashboards: [
      '/analytics/opportunities',
      '/analytics/duty-of-care',
      '/analytics/engagement',
      '/analytics/escalations',
      '/analytics/behaviour',
      '/analytics/hotel-attachment',
    ],
    canManageEscalations: true,
    canManageUsers: true,
    creatableRoles: ['tmc_admin', 'tmc_user', 'corporate_admin', 'corporate_user'],
    showTmcSelector: true,
    showCorporateSelector: true,
    scope: 'platform',
  },
  tmc_admin: {
    dashboards: [
      '/analytics/opportunities',
      '/analytics/duty-of-care',
      '/analytics/engagement',
      '/analytics/escalations',
      '/analytics/behaviour',
      '/analytics/hotel-attachment',
    ],
    canManageEscalations: true,
    canManageUsers: true,
    creatableRoles: ['tmc_user', 'corporate_admin', 'corporate_user'],
    showTmcSelector: false,
    showCorporateSelector: true,
    scope: 'tmc',
  },
  tmc_user: {
    dashboards: [
      '/analytics/opportunities',
      '/analytics/duty-of-care',
      '/analytics/engagement',
      '/analytics/escalations',
      '/analytics/behaviour',
      '/analytics/hotel-attachment',
    ],
    canManageEscalations: false,
    canManageUsers: false,
    creatableRoles: [],
    showTmcSelector: false,
    showCorporateSelector: false,
    scope: 'tmc',
  },
  corporate_admin: {
    dashboards: ['/analytics/opportunities', '/analytics/duty-of-care', '/analytics/engagement'],
    canManageEscalations: false,
    canManageUsers: true,
    creatableRoles: ['corporate_user'],
    showTmcSelector: false,
    showCorporateSelector: false,
    scope: 'corporate',
  },
  corporate_user: {
    dashboards: ['/analytics/opportunities', '/analytics/duty-of-care'],
    canManageEscalations: false,
    canManageUsers: false,
    creatableRoles: [],
    showTmcSelector: false,
    showCorporateSelector: false,
    scope: 'corporate',
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: 'Platform Admin',
  tmc_admin: 'TMC Admin',
  tmc_user: 'TMC User',
  corporate_admin: 'Corporate Admin',
  corporate_user: 'Corporate User',
};
