import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthOptions";
import {
  successJsonResponse,
  errorJsonResponse,
  unauthorizedResponse,
  internalErrorResponse,
  validationErrorResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/lib/db/queries";
import { createAddressSchema, updateAddressSchema } from "@/lib/validations/addresses";
import { ZodError } from "zod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const userAddresses = await getUserAddresses(session.user.id);
    return successJsonResponse(userAddresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return internalErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validated = createAddressSchema.parse(body);

    const result = await createAddress(session.user.id, validated);
    return successJsonResponse(result[0], 201);
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

    console.error("Error creating address:", error);
    return internalErrorResponse();
  }
}
