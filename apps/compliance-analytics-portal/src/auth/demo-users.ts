import type { UserRole } from './roles';

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tmcId: string | null;
  tmcName: string | null;
  corporateId: string | null;
  corporateName: string | null;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-001',
    email: 'mike.atherton@manticpoint.com',
    name: 'Mike Atherton',
    role: 'platform_admin',
    tmcId: null,
    tmcName: null,
    corporateId: null,
    corporateName: null,
  },
  {
    id: 'user-002',
    email: 'MikeTMC@TMC.com',
    name: 'Mike (TMC Admin)',
    role: 'tmc_admin',
    tmcId: 'acme-tmc-001',
    tmcName: 'Acme Travel Management',
    corporateId: null,
    corporateName: null,
  },
  {
    id: 'user-003',
    email: 'MikeTMCuser@TMC.com',
    name: 'Mike (TMC User)',
    role: 'tmc_user',
    tmcId: 'acme-tmc-001',
    tmcName: 'Acme Travel Management',
    corporateId: null,
    corporateName: null,
  },
  {
    id: 'user-004',
    email: 'MikeCorp@Corp.com',
    name: 'Mike (Corp Admin)',
    role: 'corporate_admin',
    tmcId: 'acme-tmc-001',
    tmcName: 'Acme Travel Management',
    corporateId: 'globalcorp-001',
    corporateName: 'GlobalCorp Inc.',
  },
  {
    id: 'user-005',
    email: 'MikeCorpUser@Corp.com',
    name: 'Mike (Corp User)',
    role: 'corporate_user',
    tmcId: 'acme-tmc-001',
    tmcName: 'Acme Travel Management',
    corporateId: 'globalcorp-001',
    corporateName: 'GlobalCorp Inc.',
  },
];

export const DEMO_TMCS = [
  { id: 'acme-tmc-001', name: 'Acme Travel Management' },
  { id: 'beta-tmc-002', name: 'Beta Travel Solutions' },
  { id: 'gamma-tmc-003', name: 'Gamma Corporate Travel' },
];

export const DEMO_CORPORATES: Record<string, { id: string; name: string }[]> = {
  'acme-tmc-001': [
    { id: 'globalcorp-001', name: 'GlobalCorp Inc.' },
    { id: 'megatech-002', name: 'MegaTech Ltd' },
    { id: 'financefirst-003', name: 'FinanceFirst Group' },
  ],
  'beta-tmc-002': [
    { id: 'startech-004', name: 'StarTech Corp' },
    { id: 'bluechip-005', name: 'BlueChip Industries' },
  ],
  'gamma-tmc-003': [{ id: 'rapidgrow-006', name: 'RapidGrow Ltd' }],
};
