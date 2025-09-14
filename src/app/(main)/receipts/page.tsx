'use client';
import { hardware } from '@/lib/hardware';
import { useState, useRef, useEffect } from 'react';
import { receiptAutoLabeling } from '@/ai/flows/receipt-auto-labeling';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { PhotoFile } from '@/lib/hardware/types';

interface Receipt {
  id: number;
  uri: string;
  merchant: string;
  amount: string;
  date: string;
  category?: string;
  confidence?: number;
  imageHint?: string;
}

const initialReceipts: Receipt[] = [
    { id: 1, uri: PlaceHolderImages[0].imageUrl, merchant: 'Grocery Mart', amount: '45.67', date: '2024-07-20', imageHint: PlaceHolderImages[0].imageHint},
    { id: 2, uri: PlaceHolderImages[1].imageUrl, merchant: 'The Coffee Spot', amount: '8.50', date: '2024-07-19', imageHint: PlaceHolderImages[1].imageHint},
];

export default function ReceiptPage() {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  async function processPhoto(photo: PhotoFile) {
    toast({ title: 'Receipt captured!', description: 'Analyzing with AI...' });
    
    // Mock data for AI call
    const mockData = {
        merchant: 'Mock Merchant',
        amountCents: Math.floor(Math.random() * 10000),
        dateISO: new Date().toISOString(),
        merchantHistory: receipts.map(r => ({ merchant: r.merchant, categoryId: r.category || 'uncategorized' }))
    };

    try {
        const result = await receiptAutoLabeling(mockData);
        hardware.vibrate('medium');
        const newReceipt: Receipt = {
            id: receipts.length + 1,
            uri: photo.uri,
            merchant: mockData.merchant,
            amount: (mockData.amountCents / 100).toFixed(2),
            date: mockData.dateISO.split('T')[0],
            category: result.categoryId || 'Uncategorized',
            confidence: result.confidence
        };
        setReceipts(prev => [newReceipt, ...prev]);

        toast({
            title: 'Receipt Labeled!',
            description: `Category: ${newReceipt.category} (Confidence: ${Math.round((newReceipt.confidence || 0) * 100)}%)`,
        });

    } catch(error) {
        console.error("AI labeling failed:", error);
        toast({ title: 'AI Labeling Failed', variant: 'destructive' });
    } finally {
        setBusy(false);
    }
  }


  async function captureAndLabel() {
    setBusy(true);
    hardware.vibrate('light');

    if ((globalThis as any).Capacitor) {
      const photo = await hardware.cameraCapture({ quality: 80 });
      if (!photo) {
        toast({ title: 'Capture cancelled', variant: 'destructive' });
        setBusy(false);
        return;
      }
      await processPhoto(photo);
    } else {
      // Web implementation
      fileInputRef.current?.click();
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processPhoto({ uri: e.target.result as string, mime: file.type });
        } else {
          toast({ title: 'Could not read file', variant: 'destructive' });
          setBusy(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setBusy(false); // No file selected
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">
            Keep track of your spending.
          </p>
        </div>
        <Button onClick={captureAndLabel} disabled={busy} size="lg" className="hidden md:flex">
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          Scan Receipt
        </Button>
      </div>
      
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={busy}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {receipts.map(receipt => (
          <Card key={receipt.id}>
            <CardHeader>
              <Image src={receipt.uri} alt={`Receipt from ${receipt.merchant}`} width={400} height={600} className="rounded-t-lg aspect-[2/3] object-cover" data-ai-hint={receipt.imageHint} />
            </CardHeader>
            <CardContent>
                <CardTitle>{receipt.merchant}</CardTitle>
                <p className="text-2xl font-bold font-headline">${receipt.amount}</p>
                <p className="text-sm text-muted-foreground">{receipt.date}</p>
                {receipt.category && (
                    <p className="text-sm mt-2">
                        Category: <span className="font-semibold">{receipt.category}</span>
                        {receipt.confidence && <span className="text-muted-foreground"> ({Math.round(receipt.confidence*100)}%)</span>}
                    </p>
                )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
