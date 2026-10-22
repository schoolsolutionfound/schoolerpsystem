/**
 * Type declarations for react-native-razorpay (the npm package ships none).
 */

declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    /** Tenant public key id (rzp_test_... / rzp_live_...). */
    key: string;
    /** Amount in integer paise — ALWAYS from the server order. */
    amount: number;
    currency?: string;
    name?: string;
    description?: string;
    /** Server-created gateway order id. */
    order_id: string;
    prefill?: {
      contact?: string;
      email?: string;
      name?: string;
    };
    notes?: Record<string, string>;
    theme?: { color?: string };
    /** Checkout timeout in seconds. */
    timeout?: number;
    modal?: { ondismiss?: () => void };
    [key: string]: unknown;
  }

  export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayErrorResponse {
    code?: string;
    description?: string;
    error?: {
      code?: string;
      description?: string;
      source?: string;
      step?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    };
    metadata?: Record<string, unknown>;
  }

  const Razorpay: {
    open(options: RazorpayOptions): Promise<RazorpaySuccessResponse>;
    onExternalWalletSelection(callback: (data: unknown) => void): void;
  };

  export default Razorpay;
}
