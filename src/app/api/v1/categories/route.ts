import { NextResponse } from "next/server";
import { getCategories } from "@/lib/db/queries";
import { successJsonResponse, internalErrorResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const categories = await getCategories();

    return successJsonResponse(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return internalErrorResponse();
  }
}
