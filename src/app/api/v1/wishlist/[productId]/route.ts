import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthOptions";
import {
  successJsonResponse,
  unauthorizedResponse,
  internalErrorResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";
import { isProductInWishlist, removeFromWishlist } from "@/lib/db/queries";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { productId } = await params;

    const exists = await isProductInWishlist(session.user.id, productId);
    if (!exists) {
      return notFoundResponse();
    }

    await removeFromWishlist(session.user.id, productId);
    return successJsonResponse({ success: true });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return internalErrorResponse();
  }
}
