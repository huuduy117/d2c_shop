// Mock MoMo service - for testing without real API keys
// In production, replace with actual MoMo API calls

export interface MoMoPaymentParams {
  order_id: string;
  order_code: string;
  amount: number;
  redirect_url: string;
  ipn_url: string;
}

export interface MoMoCallbackParams {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

// Mock: Create MoMo payment request
export async function createMoMoPayment(
  params: MoMoPaymentParams,
): Promise<{ payUrl: string; requestId: string }> {
  const requestId = `MOMO_${Date.now()}`;

  // Mock: In production, call MoMo API with proper HMAC-SHA256 signature
  const mockPayUrl = `https://test-payment.momo.vn/v2/gateway/pay?orderId=${params.order_id}&amount=${params.amount}&requestId=${requestId}`;

  return {
    payUrl: mockPayUrl,
    requestId,
  };
}

// Mock: Verify MoMo callback signature
export function verifyMoMoCallback(params: MoMoCallbackParams): boolean {
  // Mock: In production, verify HMAC-SHA256 with signature
  // For now, just check if required fields exist
  return !!(
    params.orderId &&
    params.resultCode !== undefined &&
    params.signature
  );
}

// Check if payment was successful
export function isMoMoPaymentSuccess(params: MoMoCallbackParams): boolean {
  return params.resultCode === 0;
}

// Extract order ID from callback
export function getOrderIdFromMoMo(params: MoMoCallbackParams): string {
  return params.orderId;
}
