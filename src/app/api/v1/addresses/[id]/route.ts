import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthOptions";
import {
  successJsonResponse,
  unauthorizedResponse,
  internalErrorResponse,
  validationErrorResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";
import { getAddressById, updateAddress, deleteAddress } from "@/lib/db/queries";
import { updateAddressSchema } from "@/lib/validations/addresses";
import { ZodError } from "zod";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const address = await getAddressById(id, session.user.id);
    if (!address) {
      return notFoundResponse();
    }

    const body = await request.json();
    const validated = updateAddressSchema.parse(body);

    const result = await updateAddress(id, session.user.id, validated);
    return successJsonResponse(result[0]);
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

    console.error("Error updating address:", error);
    return internalErrorResponse();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const address = await getAddressById(id, session.user.id);
    if (!address) {
      return notFoundResponse();
    }

    await deleteAddress(id, session.user.id);
    return successJsonResponse({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return internalErrorResponse();
  }
}
