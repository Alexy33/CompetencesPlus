export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unprocessable"
  | "internal";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  unprocessable: 422,
  internal: 500,
};

export interface ApiErrorDetail {

  path: string;
  message: string;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: ApiErrorDetail[];

  constructor(code: ApiErrorCode, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details?.length ? { details: this.details } : {}),
      },
    };
  }

  static badRequest(message: string, details?: ApiErrorDetail[]) {
    return new ApiError("bad_request", message, details);
  }
  static unauthorized(message = "Authentification requise.") {
    return new ApiError("unauthorized", message);
  }
  static forbidden(message = "Vous n'avez pas les droits necessaires.") {
    return new ApiError("forbidden", message);
  }
  static notFound(message = "Ressource introuvable.") {
    return new ApiError("not_found", message);
  }
  static conflict(message: string) {
    return new ApiError("conflict", message);
  }
  static unprocessable(message: string, details?: ApiErrorDetail[]) {
    return new ApiError("unprocessable", message, details);
  }
}
