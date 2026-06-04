"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VariantOption {
  id: string;
  name: string;
  values: {
    id: string;
    name: string;
    available: boolean;
  }[];
}

interface SelectedVariant {
  [optionId: string]: string; // option_id -> value_id
}

interface VariantSelectorProps {
  variants: VariantOption[];
  selectedVariant: SelectedVariant;
  onVariantChange: (selectedVariant: SelectedVariant) => void;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
}: VariantSelectorProps) {
  const [selections, setSelections] = useState<SelectedVariant>(selectedVariant);

  const handleOptionSelect = (optionId: string, valueId: string) => {
    const newSelections = { ...selections, [optionId]: valueId };
    setSelections(newSelections);
    onVariantChange(newSelections);
  };

  return (
    <div className="space-y-6">
      {variants.map((option) => (
        <div key={option.id}>
          <h4 className="mb-3 text-sm font-medium text-slate-900">
            {option.name}
          </h4>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selections[option.id] === value.id;
              return (
                <Button
                  key={value.id}
                  variant={isSelected ? "primary" : "secondary"}
                  disabled={!value.available}
                  onClick={() => handleOptionSelect(option.id, value.id)}
                  className="relative"
                >
                  {value.name}
                  {!value.available && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Button>
              );
            })}
          </div>
          {option.values.some((v) => !v.available) && (
            <p className="mt-2 text-xs text-slate-500">
              ○ = Hết hàng
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
