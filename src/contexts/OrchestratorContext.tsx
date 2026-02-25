'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePageOrchestrator } from '@/hooks/usePageOrchestrator';

const OrchestratorContext = createContext<ReturnType<
  typeof usePageOrchestrator
> | null>(null);

export function OrchestratorProvider({ children }: { children: ReactNode }) {
  const state = usePageOrchestrator();

  return (
    <OrchestratorContext.Provider value={state}>
      {children}
    </OrchestratorContext.Provider>
  );
}

export function useOrchestrator() {
  const context = useContext(OrchestratorContext);
  if (!context) {
    throw new Error(
      'useOrchestrator must be used within an OrchestratorProvider',
    );
  }
  return context;
}
