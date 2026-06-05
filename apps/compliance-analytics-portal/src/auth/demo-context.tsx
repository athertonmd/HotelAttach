import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole } from './roles';
import { ROLE_PERMISSIONS } from './roles';
import { DEMO_USERS, type DemoUser } from './demo-users';

interface DemoContextValue {
  user: DemoUser;
  setUser: (user: DemoUser) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  tmcId: string | null;
  tmcName: string | null;
  corporateId: string | null;
  corporateName: string | null;
  setTmcId: (id: string | null) => void;
  setCorporateId: (id: string | null) => void;
  permissions: (typeof ROLE_PERMISSIONS)[UserRole];
}

const DemoContext = createContext<DemoContextValue | null>(null);

const STORAGE_KEY = 'hci-demo-user-id';

function getStoredUserId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEMO_USERS[0].id;
  } catch {
    return DEMO_USERS[0].id;
  }
}

function findUser(id: string): DemoUser {
  return DEMO_USERS.find((u) => u.id === id) ?? DEMO_USERS[0];
}

export function DemoProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUserState] = useState<DemoUser>(() => findUser(getStoredUserId()));
  const [tmcId, setTmcIdState] = useState<string | null>(user.tmcId);
  const [corporateId, setCorporateIdState] = useState<string | null>(user.corporateId);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, user.id);
    } catch {
      /* localStorage unavailable */
    }
    // Auto-lock scope when user changes
    setTmcIdState(user.tmcId);
    setCorporateIdState(user.corporateId);
  }, [user]);

  const setUser = (newUser: DemoUser): void => {
    setUserState(newUser);
  };

  const setRole = (role: UserRole): void => {
    const matchingUser = DEMO_USERS.find((u) => u.role === role);
    if (matchingUser) {
      setUserState(matchingUser);
    }
  };

  const setTmcId = (id: string | null): void => {
    if (ROLE_PERMISSIONS[user.role].showTmcSelector) {
      setTmcIdState(id);
      setCorporateIdState(null); // Reset corporate when TMC changes
    }
  };

  const setCorporateId = (id: string | null): void => {
    if (ROLE_PERMISSIONS[user.role].showCorporateSelector) {
      setCorporateIdState(id);
    }
  };

  // Derive TMC name from current context
  const tmcName = user.tmcName ?? (tmcId ? 'Selected TMC' : null);
  const corporateName = user.corporateName ?? (corporateId ? 'Selected Corporate' : null);

  return (
    <DemoContext.Provider
      value={{
        user,
        setUser,
        role: user.role,
        setRole,
        tmcId,
        tmcName,
        corporateId,
        corporateName,
        setTmcId,
        setCorporateId,
        permissions: ROLE_PERMISSIONS[user.role],
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
