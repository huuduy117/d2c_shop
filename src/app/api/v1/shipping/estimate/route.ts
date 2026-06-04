import { db } from "@/lib/db/client";
import { productVariants, inventory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  successJsonResponse,
  errorJsonResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { estimateShippingSchema } from "@/lib/validations/shipping";
import {
  calculateShippingFee,
  calculateEstimatedDelivery,
} from "@/lib/shipping/utils";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = estimateShippingSchema.parse(body);

    // Mock: tính phí ship dựa trên weight và distance
    // Trong thực tế, sẽ gọi GHN API với to_district_id, to_ward_code, etc.
    const weight = validated.weight || 500; // default 500g
    const distance = validated.to_district_id * 0.5; // mock: district_id * 0.5 km

    const shippingFee = calculateShippingFee(weight, distance);
    const estimatedDelivery = calculateEstimatedDelivery(distance);

    return successJsonResponse({
      shipping_fee: shippingFee,
      estimated_delivery: estimatedDelivery.toISOString().split("T")[0],
      service_type: "standard",
      provider: "ghn",
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

    console.error("Error estimating shipping:", error);
    return internalErrorResponse();
  }
}
