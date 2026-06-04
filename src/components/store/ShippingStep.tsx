"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Branch {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
}

interface ShippingStepProps {
  selectedBranch: string;
  shippingFee: number;
  onBranchChange: (branchId: string) => void;
  onNext: () => void;
  onBack: () => void;
  buyerAddress?: {
    district: string;
    city: string;
  };
}

export function ShippingStep({
  selectedBranch,
  shippingFee,
  onBranchChange,
  onNext,
  onBack,
  buyerAddress,
}: ShippingStepProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearestBranches();
  }, [buyerAddress]);

  const fetchNearestBranches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (buyerAddress?.district) {
        params.append("district", buyerAddress.district);
      }
      if (buyerAddress?.city) {
        params.append("city", buyerAddress.city);
      }

      const res = await fetch(`/api/v1/shipping/nearest-branch?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        setBranches(data.data);
        if (!selectedBranch) {
          onBranchChange(data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Chọn chi nhánh giao hàng
          </h2>
          {loading ? (
            <p className="text-slate-500">Đang tìm chi nhánh gần nhất...</p>
          ) : (
            <div className="space-y-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => onBranchChange(branch.id)}
                  className={`block w-full rounded-lg border p-4 text-left transition ${
                    selectedBranch === branch.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{branch.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{branch.address}</p>
                      <p className="text-sm text-slate-600">
                        {branch.district}, {branch.city}
                      </p>
                    </div>
                    {selectedBranch === branch.id && (
                      <Badge variant="success">Đã chọn</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Phí vận chuyển</h2>
          <div className="flex items-center justify-between">
            <p className="text-slate-600">Phí giao hàng:</p>
            <p className="text-xl font-bold text-slate-900">
              {shippingFee > 0
                ? `${shippingFee.toLocaleString("vi-VN")} đ`
                : "Miễn phí"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Quay lại
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedBranch}
          className="flex-1"
        >
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
