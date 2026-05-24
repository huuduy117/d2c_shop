import { z } from "zod";

// ── Payments ───────────────────────────────────────────────
export const createPaymentSchema = z.object({
  order_id: z.string().uuid(),
  payment_method: z.enum(["vnpay", "momo", "cod"]),
});

export const vnpayCallbackSchema = z.object({
  vnp_Amount: z.string(),
  vnp_BankCode: z.string(),
  vnp_BankTranNo: z.string(),
  vnp_CardType: z.string(),
  vnp_OrderInfo: z.string(),
  vnp_PayDate: z.string(),
  vnp_ResponseCode: z.string(),
  vnp_TmnCode: z.string(),
  vnp_TransactionNo: z.string(),
  vnp_TransactionStatus: z.string(),
  vnp_TxnRef: z.string(),
  vnp_SecureHash: z.string(),
});

export const momoCallbackSchema = z.object({
  partnerCode: z.string(),
  orderId: z.string(),
  requestId: z.string(),
  amount: z.number(),
  orderInfo: z.string(),
  orderType: z.string(),
  transId: z.number(),
  resultCode: z.number(),
  message: z.string(),
  payType: z.string(),
  responseTime: z.number(),
  extraData: z.string(),
  signature: z.string(),
});

export type CreatePayment = z.infer<typeof createPaymentSchema>;
export type VNPayCallback = z.infer<typeof vnpayCallbackSchema>;
export type MoMoCallback = z.infer<typeof momoCallbackSchema>;
