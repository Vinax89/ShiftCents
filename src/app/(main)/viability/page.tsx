'use client'
import { useState } from 'react'
import { engine } from '@/lib/engine'
import { ensureEngineInit } from '@/lib/engine-init'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ViabilityPage() {
  const [zip, setZip] = useState('90210');
  const [gross, setGross] = useState(52000);
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setOut(null);
    try {
        await ensureEngineInit()
        const e = await engine();
        const result = await e.income_viability({
            year: new Date().getFullYear(),
            zip,
            grossAnnual: gross,
            household: { adults: 1, children: 0 },
        });
        setOut(result);
    } catch(error) {
        console.error("Viability estimation failed:", error);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Income Viability Forecaster</h1>
        <p className="text-muted-foreground">
          Estimate your disposable income after taxes and cost-of-living.
        </p>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Enter Your Information</CardTitle>
            <CardDescription>All calculations are estimates based on regional averages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input id="zip" placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gross">Gross Annual Income</Label>
            <Input id="gross" type="number" value={gross} onChange={(e) => setGross(+e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={run} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Estimate
            </Button>
        </CardFooter>
      </Card>
      
      {out && (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Estimated Viability</CardTitle>
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
