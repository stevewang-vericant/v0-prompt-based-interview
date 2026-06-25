import { Prisma } from "@prisma/client"
import { AuthError } from "./auth-guards"

const DEFAULT_FALLBACK = "Something went wrong. Please try again."

/**
 * Converts an arbitrary thrown value into a message that is safe to return to
 * the client.
 *
 * - Auth errors keep their (intentionally generic) message.
 * - Prisma errors are NEVER exposed — they can contain table/column names,
 *   constraint details, or connection info. The caller is expected to log the
 *   real error server-side for debugging.
 * - Other `Error` instances are assumed to be deliberate, human-readable
 *   validation/business errors thrown by our own code, so their message is
 *   passed through.
 * - Anything else falls back to a generic message.
 */
export function toClientError(error: unknown, fallback: string = DEFAULT_FALLBACK): string {
  if (error instanceof AuthError) {
    return error.message
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return fallback
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
