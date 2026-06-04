"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Address {
  id: string;
  receiver_name: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  is_default: boolean;
}

interface AddressStepProps {
  selectedAddress: string;
  onAddressChange: (addressId: string) => void;
  onNext: () => void;
}

export function AddressStep({
  selectedAddress,
  onAddressChange,
  onNext,
}: AddressStepProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    receiver_name: "",
    phone: "",
    address: "",
    district: "",
    city: "",
    is_default: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/v1/addresses");
      const data = await res.json();

      if (data.success) {
        setAddresses(data.data);
        if (data.data.length > 0 && !selectedAddress) {
          const defaultAddr = data.data.find((a: Address) => a.is_default);
          onAddressChange(defaultAddr?.id || data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/v1/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        await fetchAddresses();
        onAddressChange(data.data.id);
        setShowForm(false);
        setFormData({
          receiver_name: "",
          phone: "",
          address: "",
          district: "",
          city: "",
          is_default: false,
        });
      }
    } catch (error) {
      console.error("Error creating address:", error);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-500">Đang tải địa chỉ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Địa chỉ giao hàng</h2>
            <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Hủy" : "Thêm địa chỉ mới"}
            </Button>
          </div>

          {showForm ? (
            <form onSubmit={handleCreateAddress} className="space-y-4">
              <div>
                <Label>Tên người nhận</Label>
                <Input
                  required
                  value={formData.receiver_name}
                  onChange={(e) =>
                    setFormData({ ...formData, receiver_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Địa chỉ</Label>
                <Input
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Quận/Huyện</Label>
                  <Input
                    required
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Tỉnh/Thành phố</Label>
                  <Input
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) =>
                    setFormData({ ...formData, is_default: e.target.checked })
                  }
                />
                <Label htmlFor="is_default">Đặt làm địa chỉ mặc định</Label>
              </div>
              <Button type="submit" className="w-full">
                Tạo địa chỉ
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <p className="text-center text-slate-500">
                  Chưa có địa chỉ. Vui lòng thêm địa chỉ giao hàng.
                </p>
              ) : (
                addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => onAddressChange(address.id)}
                    className={`block w-full rounded-lg border p-4 text-left transition ${
                      selectedAddress === address.id
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {address.receiver_name}
                          </p>
                          {address.is_default && (
                            <Badge variant="success">Mặc định</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {address.phone}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {address.address}, {address.district}, {address.city}
                        </p>
                      </div>
                      {selectedAddress === address.id && (
                        <Badge variant="success">Đã chọn</Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={onNext}
        disabled={!selectedAddress}
        className="w-full"
      >
        Tiếp tục
      </Button>
    </div>
  );
}
