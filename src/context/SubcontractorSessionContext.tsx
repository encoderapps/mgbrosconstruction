import React, { createContext, useContext, useMemo, useState } from 'react';
import { SubcontractorCompanyProfile } from '../types/company';

interface SubcontractorSessionContextValue {
  /** The logged-in subcontractor's company, or null before login. */
  company: SubcontractorCompanyProfile | null;
  setCompany: (company: SubcontractorCompanyProfile | null) => void;
}

const SubcontractorSessionContext = createContext<SubcontractorSessionContextValue | undefined>(undefined);

/** Keeps the company details returned by the subcontractor login for the signed-in screens. */
export function SubcontractorSessionProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [company, setCompany] = useState<SubcontractorCompanyProfile | null>(null);
  const value = useMemo(() => ({ company, setCompany }), [company]);
  return <SubcontractorSessionContext.Provider value={value}>{children}</SubcontractorSessionContext.Provider>;
}

export function useSubcontractorSession(): SubcontractorSessionContextValue {
  const context = useContext(SubcontractorSessionContext);
  if (!context) {
    throw new Error('useSubcontractorSession must be used within a SubcontractorSessionProvider');
  }
  return context;
}
