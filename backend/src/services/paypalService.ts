import { AppError } from "../middleware/errorHandler.js";

export async function createPayPalOrder(_params: {
  userId: string;
  amount: string;
  currency?: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  throw new AppError("PayPal checkout is disabled", 410);
}

export async function capturePayPalOrder(_orderId: string) {
  throw new AppError("PayPal capture is disabled", 410);
}
