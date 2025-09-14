export type Goal = {
  id: number;
  name: string;
  target: number;
  current: number;
  description: string;
};

export const goals: Goal[] = [
  {
    id: 1,
    name: 'Vacation Fund',
    target: 2000,
    current: 750,
    description: 'Trip to the mountains in December.',
  },
  {
    id: 2,
    name: 'New Laptop',
    target: 1500,
    current: 1100,
    description: 'For work and personal projects.',
  },
  {
    id: 3,
    name: 'Emergency Fund',
    target: 5000,
    current: 4800,
    description: '3-6 months of living expenses.',
  },
  {
    id: 4,
    name: 'Concert Tickets',
    target: 300,
    current: 120,
    description: 'For the summer music festival.',
  },
];

export type CalendarEvent = {
  date: string;
  kind: 'shift' | 'bill' | 'payday';
  payload: {
    title?: string;
    start?: string;
    end?: string;
    name?: string;
    amount?: number;
    period?: string;
  };
};

// Generate some mock calendar data for the current month
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();

export const calendarEvents: CalendarEvent[] = [
  {
    date: new Date(year, month, 3).toISOString().split('T')[0],
    kind: 'shift',
    payload: { title: 'Morning Shift', start: '08:00', end: '16:00' },
  },
  {
    date: new Date(year, month, 5).toISOString().split('T')[0],
    kind: 'bill',
    payload: { name: 'Rent', amount: 1200 },
  },
    {
    date: new Date(year, month, 7).toISOString().split('T')[0],
    kind: 'shift',
    payload: { title: 'Night Shift', start: '22:00', end: '06:00' },
  },
  {
    date: new Date(year, month, 10).toISOString().split('T')[0],
    kind: 'shift',
    payload: { title: 'Morning Shift', start: '08:00', end: '16:00' },
  },
  {
    date: new Date(year, month, 15).toISOString().split('T')[0],
    kind: 'payday',
    payload: { period: 'biweekly', amount: 1850 },
  },
  {
    date: new Date(year, month, 17).toISOString().split('T')[0],
    kind: 'bill',
    payload: { name: 'Electric Bill', amount: 85 },
  },
    {
    date: new Date(year, month, 22).toISOString().split('T')[0],
    kind: 'shift',
    payload: { title: 'Evening Shift', start: '16:00', end: '00:00' },
  },
    {
    date: new Date(year, month, 25).toISOString().split('T')[0],
    kind: 'bill',
    payload: { name: 'Car Payment', amount: 350 },
  },
  {
    date: new Date(year, month, 30).toISOString().split('T')[0],
    kind: 'payday',
    payload: { period: 'biweekly', amount: 1850 },
  },
];
