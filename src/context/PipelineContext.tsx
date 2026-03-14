"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Opportunity } from "@/data/opportunities";

export interface PipelineItem {
  opportunity: Opportunity;
  addedAt: string;
  currentStep: number; // 0-4 (Intake, Compliance, Pricing, Draft, Review)
  compliancePercent: number;
  pricingTotal: number;
  pricingTarget: number;
  draftProgress: {
    technical: number;
    pricing: number;
    compliance: number;
    finalReady: boolean;
  };
}

interface PipelineContextType {
  pipelineItems: PipelineItem[];
  addToPipeline: (opportunity: Opportunity) => void;
  removeFromPipeline: (id: string) => void;
  isInPipeline: (id: string) => boolean;
  count: number;
}

const PipelineContext = createContext<PipelineContextType>({
  pipelineItems: [],
  addToPipeline: () => {},
  removeFromPipeline: () => {},
  isInPipeline: () => false,
  count: 0,
});

function generatePipelineData(opp: Opportunity): PipelineItem {
  const steps = [0, 1, 2, 3, 4];
  const step = steps[Math.floor(Math.random() * 4) + 1]; // at least step 1
  return {
    opportunity: opp,
    addedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    currentStep: step,
    compliancePercent: Math.floor(Math.random() * 40) + 60,
    pricingTotal: Math.floor(Math.random() * 80000) + 50000,
    pricingTarget: 125000,
    draftProgress: {
      technical: Math.floor(Math.random() * 30) + 70,
      pricing: Math.floor(Math.random() * 20) + 80,
      compliance: 100,
      finalReady: step >= 4,
    },
  };
}

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);

  const addToPipeline = useCallback((opportunity: Opportunity) => {
    setPipelineItems((prev) => {
      if (prev.some((p) => p.opportunity.id === opportunity.id)) return prev;
      return [generatePipelineData(opportunity), ...prev];
    });
  }, []);

  const removeFromPipeline = useCallback((id: string) => {
    setPipelineItems((prev) => prev.filter((p) => p.opportunity.id !== id));
  }, []);

  const isInPipeline = useCallback(
    (id: string) => pipelineItems.some((p) => p.opportunity.id === id),
    [pipelineItems]
  );

  return (
    <PipelineContext.Provider
      value={{
        pipelineItems,
        addToPipeline,
        removeFromPipeline,
        isInPipeline,
        count: pipelineItems.length,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  return useContext(PipelineContext);
}
