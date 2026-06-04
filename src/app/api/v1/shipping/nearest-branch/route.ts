import { db } from "@/lib/db/client";
import { branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  successJsonResponse,
  errorJsonResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { nearestBranchSchema } from "@/lib/validations/shipping";
import { findNearestBranch } from "@/lib/shipping/utils";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = nearestBranchSchema.parse(body);

    const activeBranches = await db.query.branches.findMany({
      where: eq(branches.is_active, true),
    });

    if (activeBranches.length === 0) {
      return errorJsonResponse("No active branches available", 400);
    }

    const nearest = findNearestBranch(
      validated.latitude,
      validated.longitude,
      activeBranches,
    );

    if (!nearest) {
      return errorJsonResponse("Could not find nearest branch", 400);
    }

    return successJsonResponse({
      branch_id: nearest.id,
      name: nearest.name,
      address: nearest.address,
      city: nearest.city,
      distance_km: Math.round(nearest.distance * 10) / 10,
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

    console.error("Error finding nearest branch:", error);
    return internalErrorResponse();
  }
}
