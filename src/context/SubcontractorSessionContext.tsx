import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { UserSignature } from '../types/signature';
import { SubcontractorCompanyProfile } from '../types/company';

interface SubcontractorSessionContextValue {
  /** The logged-in subcontractor's company, or null before login. */
  company: SubcontractorCompanyProfile | null;
  /** Setting null ends the session (logout), which also forgets the signature. */
  setCompany: (company: SubcontractorCompanyProfile | null) => void;
  /** The signature made when registering (name, initials and their images), or null if there's none. */
  signature: UserSignature | null;
  setSignature: (signature: UserSignature | null) => void;
}

const SubcontractorSessionContext = createContext<SubcontractorSessionContextValue | undefined>(undefined);

/** Keeps the company details returned by the subcontractor login, and the user's signature, for the signed-in screens. */
export function SubcontractorSessionProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [company, setCompanyState] = useState<SubcontractorCompanyProfile | null>(null);
  const [signature, setSignature] = useState<UserSignature | null>(null);

  const setCompany = useCallback((next: SubcontractorCompanyProfile | null) => {
    setCompanyState(next);
    if (!next) {
      setSignature(null);
    }
  }, []);

  const value = useMemo(
    () => ({ company, setCompany, signature, setSignature }),
    [company, setCompany, signature],
  );
  return <SubcontractorSessionContext.Provider value={value}>{children}</SubcontractorSessionContext.Provider>;
}

export function useSubcontractorSession(): SubcontractorSessionContextValue {
  const context = useContext(SubcontractorSessionContext);
  if (!context) {
    throw new Error('useSubcontractorSession must be used within a SubcontractorSessionProvider');
  }
  return context;
}
