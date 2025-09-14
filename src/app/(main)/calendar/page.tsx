'use client';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Briefcase, Receipt, CircleDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calendarEvents, CalendarEvent } from '@/lib/data';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  add,
  isToday,
} from 'date-fns';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth),
    end: endOfWeek(lastDayOfMonth),
  });

  const eventsByDate = useMemo(() => {
    return calendarEvents.reduce((acc: { [key: string]: CalendarEvent[] }, event) => {
      const dateKey = event.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});
  }, []);

  const nextMonth = () => setCurrentDate(add(currentDate, { months: 1 }));
  const prevMonth = () => setCurrentDate(add(currentDate, { months: -1 }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline">
          {format(currentDate, 'MMMM yyyy')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-5 gap-px border-t border-l">
          {daysInMonth.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                'relative border-b border-r p-2 text-sm h-32 flex flex-col',
                isSameMonth(day, currentDate)
                  ? 'bg-background'
                  : 'bg-muted/50 text-muted-foreground'
              )}
            >
              <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={cn(
                  'font-semibold',
                  isToday(day) && 'flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground'
                )}
              >
                {format(day, 'd')}
              </time>
              <div className="mt-1 flex-grow overflow-y-auto space-y-1">
                {(eventsByDate[format(day, 'yyyy-MM-dd')] || []).map((event, i) => (
                    <div key={i} className={cn(
                        'text-xs p-1 rounded-md flex items-center gap-1',
                        event.kind === 'shift' && 'bg-blue-100 text-blue-800',
                        event.kind === 'bill' && 'bg-red-100 text-red-800',
                        event.kind === 'payday' && 'bg-green-100 text-green-800',
                    )}>
                        {event.kind === 'shift' && <Briefcase className="h-3 w-3 shrink-0" />}
                        {event.kind === 'bill' && <Receipt className="h-3 w-3 shrink-0" />}
                        {event.kind === 'payday' && <CircleDollarSign className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{event.payload.title || event.payload.name}</span>
                    </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
