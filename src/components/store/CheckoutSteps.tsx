interface CheckoutStepsProps {
  currentStep: number;
}

const steps = [
  { id: 1, name: "Địa chỉ" },
  { id: 2, name: "Vận chuyển" },
  { id: 3, name: "Thanh toán" },
  { id: 4, name: "Xác nhận" },
];

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                  currentStep >= step.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {step.id}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? "text-slate-900" : "text-slate-500"
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 flex-1 ${
                  currentStep > step.id ? "bg-slate-900" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
