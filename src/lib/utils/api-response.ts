import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  meta?: {
    page?: number;
    total?: number;
    limit?: number;
  };
}

export function successResponse<T>(
  data: T,
  meta?: { page?: number; total?: number; limit?: number },
): ApiResponse<T> {
  return {
    data,
    error: null,
    ...(meta && { meta }),
  };
}

export function errorResponse(error: string): ApiResponse {
  return {
    data: null,
    error,
  };
}

export function jsonResponse<T>(
  response: ApiResponse<T>,
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(response, { status });
}

export function successJsonResponse<T>(
  data: T,
  status: number = 200,
  meta?: { page?: number; total?: number; limit?: number },
): NextResponse<ApiResponse<T>> {
  return jsonResponse(successResponse(data, meta), status);
}

export function errorJsonResponse(
  error: string,
  status: number = 400,
): NextResponse<ApiResponse> {
  return jsonResponse(errorResponse(error), status);
}

export function validationErrorResponse(
  errors: Record<string, string[]>,
): NextResponse<ApiResponse> {
  const errorMessage = Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
    .join("; ");
  return errorJsonResponse(errorMessage, 422);
}

export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return errorJsonResponse("Unauthorized", 401);
}

export function forbiddenResponse(): NextResponse<ApiResponse> {
  return errorJsonResponse("Forbidden", 403);
}

export function notFoundResponse(): NextResponse<ApiResponse> {
  return errorJsonResponse("Not found", 404);
}

export function conflictResponse(message: string): NextResponse<ApiResponse> {
  return errorJsonResponse(message, 409);
}

export function internalErrorResponse(): NextResponse<ApiResponse> {
  return errorJsonResponse("Internal server error", 500);
}
