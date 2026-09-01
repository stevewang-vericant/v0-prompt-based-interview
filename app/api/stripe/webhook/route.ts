import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { markInterviewPaymentPaid, markInterviewPaymentStatus } from "@/lib/interview-payment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET is not configured")
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
  }

  const body = await req.text()

  try {
    const stripe = getStripe()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object
        if (session.payment_status === "paid") {
          await markInterviewPaymentPaid({ checkoutSession: session })
        }
        break
      }
      case "checkout.session.expired": {
        await markInterviewPaymentStatus(event.data.object.id, "expired")
        break
      }
      case "checkout.session.async_payment_failed": {
        await markInterviewPaymentStatus(event.data.object.id, "failed")
        break
      }
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Stripe webhook] Failed to process event:", error)
    return NextResponse.json({ error: "Invalid Stripe webhook" }, { status: 400 })
  }
}
