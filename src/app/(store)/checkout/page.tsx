"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckoutSteps } from "@/components/store/CheckoutSteps";
import { AddressStep } from "@/components/store/AddressStep";
import { ShippingStep } from "@/components/store/ShippingStep";
import { PaymentStep } from "@/components/store/PaymentStep";
import { OrderSummary } from "@/components/store/OrderSummary";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store/cart";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getTotalPrice, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("vnpay");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [buyerAddress, setBuyerAddress] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/login?redirect=/checkout");
    }
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [session, items]);

  useEffect(() => {
    if (selectedAddress) {
      fetchAddressDetails();
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (selectedBranch && buyerAddress) {
      calculateShippingFee();
    }
  }, [selectedBranch, buyerAddress]);

  const fetchAddressDetails = async () => {
    try {
      const res = await fetch(`/api/v1/addresses/${selectedAddress}`);
      const data = await res.json();
      if (data.success) {
        setBuyerAddress(data.data);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const calculateShippingFee = async () => {
    try {
      const res = await fetch("/api/v1/shipping/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: selectedBranch,
          buyer_district: buyerAddress.district,
          buyer_city: buyerAddress.city,
          items: items.map((item) => ({
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShippingFee(data.data.fee);
      }
    } catch (error) {
      console.error("Error calculating shipping fee:", error);
    }
  };

  const validateVoucher = async () => {
    if (!voucherCode.trim()) return;

    setVoucherError("");
    setVoucherDiscount(0);

    try {
      const res = await fetch("/api/v1/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherCode,
          subtotal: getTotalPrice(),
        }),
      });

      const data = await res.json();

      if (data.success && data.data.valid) {
        setVoucherDiscount(data.data.discount);
      } else {
        setVoucherError(data.data.error || "Mã giảm giá không hợp lệ");
      }
    } catch (error) {
      setVoucherError("Lỗi khi xác thực mã giảm giá");
    }
  };

  const handleCreateOrder = async () => {
    setSubmitting(true);

    try {
      const orderRes = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_id: selectedAddress,
          branch_id: selectedBranch,
          payment_method: paymentMethod,
          items: items.map((item) => ({
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            price: item.price,
          })),
          voucher_code: voucherCode || undefined,
          shipping_fee: shippingFee,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        alert("Lỗi tạo đơn hàng: " + orderData.message);
        setSubmitting(false);
        return;
      }

      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/orders/${orderData.data.id}`);
        return;
      }

      const paymentRes = await fetch("/api/v1/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderData.data.id }),
      });

      const paymentData = await paymentRes.json();

      if (paymentData.success && paymentData.data.payment_url) {
        clearCart();
        window.location.href = paymentData.data.payment_url;
      } else {
        alert("Lỗi tạo thanh toán");
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Lỗi khi tạo đơn hàng");
      setSubmitting(false);
    }
  };

  const subtotal = getTotalPrice();
  const total = subtotal + shippingFee - voucherDiscount;

  if (!session || items.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Thanh toán</h1>

      <CheckoutSteps currentStep={currentStep} />

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          {currentStep === 1 && (
            <AddressStep
              selectedAddress={selectedAddress}
              onAddressChange={setSelectedAddress}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <ShippingStep
              selectedBranch={selectedBranch}
              shippingFee={shippingFee}
              buyerAddress={buyerAddress}
              onBranchChange={setSelectedBranch}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <PaymentStep
              paymentMethod={paymentMethod}
              voucherCode={voucherCode}
              voucherDiscount={voucherDiscount}
              voucherError={voucherError}
              onPaymentMethodChange={setPaymentMethod}
              onVoucherCodeChange={setVoucherCode}
              onValidateVoucher={validateVoucher}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Xác nhận đơn hàng
                </h2>
                <p className="text-slate-600">
                  Vui lòng kiểm tra lại thông tin đơn hàng trước khi xác nhận.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1"
                >
                  Quay lại
                </Button>
                <Button
                  onClick={handleCreateOrder}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-96">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shippingFee={shippingFee}
            discount={voucherDiscount}
            total={total}
            voucherCode={voucherCode}
          />
        </div>
      </div>
    </div>
  );
}
