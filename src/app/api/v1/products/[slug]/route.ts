import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/db/queries";
import {
  successJsonResponse,
  internalErrorResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const product = await getProductBySlug(slug);

    if (!product) {
      return notFoundResponse();
    }

    return successJsonResponse(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return internalErrorResponse();
  }
}
