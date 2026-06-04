import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthOptions";
import {
  successJsonResponse,
  unauthorizedResponse,
  errorJsonResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { validateVoucherSchema } from "@/lib/validations/vouchers";
import { validateVoucher } from "@/lib/vouchers/validation";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validated = validateVoucherSchema.parse(body);

    const result = await validateVoucher(
      validated.code,
      session.user.id,
      validated.subtotal,
    );

    if (!result.valid) {
      return errorJsonResponse(result.error || "Invalid voucher", 400);
    }

    return successJsonResponse({
      valid: true,
      discount: result.discount,
      code: validated.code,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      return validationErrorResponse(errors);
    }

    console.error("Error validating voucher:", error);
    return internalErrorResponse();
  }
}
