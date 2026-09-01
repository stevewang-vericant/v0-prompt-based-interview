export const BILLING_MODE_CREDITS = "credits"
export const BILLING_MODE_STUDENT_PAY = "student_pay"

export type BillingMode = typeof BILLING_MODE_CREDITS | typeof BILLING_MODE_STUDENT_PAY

export const DEFAULT_STUDENT_INTERVIEW_PRICE_CENTS = 4900
export const DEFAULT_STUDENT_INTERVIEW_CURRENCY = "usd"

export const STUDENT_INTERVIEW_PRICE_CENTS_KEY = "student_interview_price_cents"
export const STUDENT_INTERVIEW_CURRENCY_KEY = "student_interview_currency"

export function isStudentPayMode(mode: string | null | undefined): boolean {
  return mode === BILLING_MODE_STUDENT_PAY
}

export function normalizeBillingMode(mode: string | null | undefined): BillingMode {
  return mode === BILLING_MODE_STUDENT_PAY ? BILLING_MODE_STUDENT_PAY : BILLING_MODE_CREDITS
}

export type PaidStudentInfo = {
  email: string
  name: string
  gender?: string | null
  currentGrade?: string | null
  residencyCity?: string | null
  residenceCountry: string
  needFinancialAid?: boolean | null
  usesCbo: boolean | null
  cboOrganization?: string | null
}

export function parsePaidStudentInfo(value: unknown): PaidStudentInfo | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const email = typeof record.email === "string" ? record.email : ""
  const name = typeof record.name === "string" ? record.name : ""
  if (!email || !name) {
    return null
  }

  return {
    email,
    name,
    gender: typeof record.gender === "string" ? record.gender : null,
    currentGrade: typeof record.currentGrade === "string" ? record.currentGrade : null,
    residencyCity: typeof record.residencyCity === "string" ? record.residencyCity : null,
    residenceCountry: typeof record.residenceCountry === "string" ? record.residenceCountry : "Unknown",
    needFinancialAid: typeof record.needFinancialAid === "boolean" ? record.needFinancialAid : null,
    usesCbo: typeof record.usesCbo === "boolean" ? record.usesCbo : null,
    cboOrganization: typeof record.cboOrganization === "string" ? record.cboOrganization : null,
  }
}
