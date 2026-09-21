import { notFound } from "next/navigation"

export default function StudentLoginPrototypeDisabled() {
  // The production student flow uses a school interview link and, for
  // student-pay schools, email verification. The old mock-password page must
  // never be exposed as an authentication surface.
  notFound()
}
