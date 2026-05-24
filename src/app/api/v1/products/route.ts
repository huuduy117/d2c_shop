import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db/queries";
import {
  successJsonResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { productListQuerySchema } from "@/lib/validations/products";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const queryData = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") || null,
      category_id: searchParams.get("category_id") || null,
      sort: searchParams.get("sort") || "newest",
    };

    const validated = productListQuerySchema.parse(queryData);

    const result = await getProducts({
      page: validated.page,
      limit: validated.limit,
      search: validated.search || undefined,
      category_id: validated.category_id || undefined,
      sort: validated.sort,
    });

    return successJsonResponse(result.items, 200, {
      page: result.page,
      total: result.total,
      limit: result.limit,
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

    console.error("Error fetching products:", error);
    return internalErrorResponse();
  }
}
