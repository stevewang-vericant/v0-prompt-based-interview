import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard as CreditCircle } from "lucide-react"

interface CreditBalanceProps {
  balance: number
}

export function CreditBalance({ balance }: CreditBalanceProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCircle className="h-5 w-5 text-primary" />
          <CardTitle>Credit Balance</CardTitle>
        </div>
        <CardDescription>Your current available interview credits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{balance}</span>
            <span className="text-muted-foreground">credits available</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Each credit allows one student to complete a full interview assessment. Credits are priced at $49 per
            interview.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
