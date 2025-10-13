"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function PurchaseCredits() {
  const [quantity, setQuantity] = useState("50")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)

  const pricePerCredit = 49
  const totalPrice = Number.parseInt(quantity) * pricePerCredit

  const handlePurchase = async () => {
    setIsProcessing(true)
    console.log("[v0] Processing credit purchase:", { quantity, paymentMethod, totalPrice })

    // TODO: Implement actual payment processing
    setTimeout(() => {
      setIsProcessing(false)
      alert(`Successfully purchased ${quantity} credits!`)
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Credits</CardTitle>
        <CardDescription>Buy interview credits for your institution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="quantity">Number of Credits</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
          />
          <p className="text-sm text-muted-foreground">Minimum purchase: 10 credits</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price per credit:</span>
            <span className="font-medium">${pricePerCredit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-medium">{quantity}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="font-semibold">Total:</span>
            <span className="text-xl font-bold">${totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Payment Method</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="font-normal cursor-pointer">
                Credit/Debit Card
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bank" id="bank" />
              <Label htmlFor="bank" className="font-normal cursor-pointer">
                Bank Transfer
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="invoice" id="invoice" />
              <Label htmlFor="invoice" className="font-normal cursor-pointer">
                Invoice (Net 30)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handlePurchase}
          disabled={isProcessing || Number.parseInt(quantity) < 10}
          className="w-full"
          size="lg"
        >
          {isProcessing ? "Processing..." : `Purchase ${quantity} Credits for $${totalPrice.toLocaleString()}`}
        </Button>
      </CardContent>
    </Card>
  )
}
