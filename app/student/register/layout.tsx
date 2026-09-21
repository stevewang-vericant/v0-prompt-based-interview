import { notFound } from "next/navigation"

export default function StudentRegistrationPrototypeDisabled() {
  // Invitation-based student account registration was only a prototype and
  // did not validate or consume invitation tokens. Keep it unreachable until
  // a real server-backed registration flow is implemented.
  notFound()
}
