// Mock VNPay service - for testing without real API keys
// In production, replace with actual VNPay API calls

export interface VNPayPaymentParams {
  order_id: string;
  order_code: string;
  amount: number;
  return_url: string;
}

export interface VNPayCallbackParams {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

// Mock: Generate VNPay payment URL
export function createVNPayPaymentUrl(params: VNPayPaymentParams): string {
  const baseUrl = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

  // Mock: In production, create proper HMAC-SHA512 signature
  const mockSignature = "MOCK_VNPAY_SIGNATURE";

  const queryParams = new URLSearchParams({
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || "MOCK_TMN",
    vnp_Amount: String(params.amount * 100), // VNPay uses smallest unit
    vnp_CreateDate: new Date().toISOString().replace(/[-:]/g, "").slice(0, 14),
    vnp_CurrCode: "VND",
    vnp_IpAddr: "127.0.0.1",
    vnp_Locale: "vn",
    vnp_OrderInfo: `Thanh toan don hang ${params.order_code}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: params.return_url,
    vnp_TxnRef: params.order_id,
    vnp_SecureHash: mockSignature,
  });

  return `${baseUrl}?${queryParams.toString()}`;
}

// Mock: Verify VNPay callback signature
export function verifyVNPayCallback(params: VNPayCallbackParams): boolean {
  // Mock: In production, verify HMAC-SHA512 with vnp_SecureHash
  // For now, just check if required fields exist
  return !!(
    params.vnp_TxnRef &&
    params.vnp_ResponseCode &&
    params.vnp_SecureHash
  );
}

// Check if payment was successful
export function isVNPayPaymentSuccess(params: VNPayCallbackParams): boolean {
  return params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";
}

// Extract order ID from callback
export function getOrderIdFromVNPay(params: VNPayCallbackParams): string {
  return params.vnp_TxnRef;
}
