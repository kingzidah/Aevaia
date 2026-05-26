"use client";

import React, { createContext, useContext, useState } from "react";

interface CreditCtx {
  credits:       number;
  deductCredits: (amount: number) => void;
}

const CreditContext = createContext<CreditCtx>({
  credits:       1000,
  deductCredits: () => {},
});

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState(1000);

  const deductCredits = (amount: number) =>
    setCredits(prev => Math.max(0, prev - amount));

  return (
    <CreditContext.Provider value={{ credits, deductCredits }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits(): CreditCtx {
  return useContext(CreditContext);
}
