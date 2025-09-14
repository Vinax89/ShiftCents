'use client';
import { hardware } from '@/lib/hardware';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { goals } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function GoalsPage() {
  const { toast } = useToast();

  const handleQuickFund = (goalName: string) => {
    hardware.vibrate('light');
    toast({
      title: 'Quick Fund',
      description: `Funding added to ${goalName}.`,
    });
  };

  return (
    <div>
       <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Your Goals</h1>
        <p className="text-muted-foreground">
          Track your progress and stay motivated.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Card key={goal.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{goal.name}</CardTitle>
              <CardDescription>{goal.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold font-headline">
                  ${goal.current.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  / ${goal.target.toLocaleString()}
                </span>
              </div>
              <Progress value={(goal.current / goal.target) * 100} />
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleQuickFund(goal.name)}
              >
                Quick-fund (demo)
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
