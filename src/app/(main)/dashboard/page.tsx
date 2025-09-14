import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowUpRight, Calendar, Goal, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Welcome Back
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s a summary of your finances.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Next Shift
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>From your linked calendar</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="text-2xl font-bold font-headline">Tomorrow, 8:00 AM</div>
            <p className="text-xs text-muted-foreground">Morning shift at The Cafe</p>
          </CardContent>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/calendar">View Calendar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Upcoming Bill
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>Rent is due soon</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="text-2xl font-bold font-headline">$1,200.00</div>
            <p className="text-xs text-muted-foreground">Due in 3 days</p>
          </CardContent>
           <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/calendar">View Bills</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Goal Progress
              <Goal className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>Vacation Fund</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-2">
            <div className="text-2xl font-bold font-headline">$750 / $2,000</div>
            <Progress value={(750 / 2000) * 100} />
          </CardContent>
           <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/goals">View Goals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
