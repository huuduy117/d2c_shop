import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthOptions";
import {
  successJsonResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/utils/api-response";
import { getOrderById } from "@/lib/db/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Get order with buyer validation
    const order = await getOrderById(id, session.user.id);

    if (!order) {
      return notFoundResponse();
    }

    return successJsonResponse(order);
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return internalErrorResponse();
  }
}
