'use client'
import { useState } from 'react'
import { engine } from '@/lib/engine'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TaxesPage() {
  const [zip, setZip] = useState('90210');
  const [wages, setWages] = useState(52000);
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setOut(null);
    try {
      const e = await engine();
      const result = await e.tax_burden({
        year: new Date().getFullYear(),
        zip,
        filing: 'single',
        wagesAnnual: wages,
      });
      setOut(result);
    } catch (error) {
      console.error("Tax calculation failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Tax Burden Calculator</h1>
        <p className="text-muted-foreground">
          Estimate your annual and per-paycheck tax burden.
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Enter Your Information</CardTitle>
            <CardDescription>All calculations are estimates. Consult a tax professional for advice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input id="zip" placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wages">Annual Wages</Label>
            <Input id="wages" type="number" value={wages} onChange={(e) => setWages(+e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={run} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Calculate
            </Button>
        </CardFooter>
      </Card>

      {out && (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Estimated Tax Burden</CardTitle>
            </CardHeader>
            <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm font-code overflow-x-auto">
                    {JSON.stringify(out, null, 2)}
                </pre>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
