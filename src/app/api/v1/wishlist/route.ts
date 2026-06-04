import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthOptions";
import {
  successJsonResponse,
  unauthorizedResponse,
  internalErrorResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";
import {
  getUserWishlists,
  isProductInWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/db/queries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const wishlist = await getUserWishlists(session.user.id);
    return successJsonResponse(wishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
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
    const { product_id } = body;

    if (!product_id) {
      return internalErrorResponse();
    }

    const exists = await isProductInWishlist(session.user.id, product_id);
    if (exists) {
      return successJsonResponse({ success: true, message: "Already in wishlist" });
    }

    const result = await addToWishlist(session.user.id, product_id);
    return successJsonResponse(result[0], 201);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return internalErrorResponse();
  }
}
