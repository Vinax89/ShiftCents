import type { Registry } from './schemas'

// Replace the URLs with official sources for your deployment year.
// Examples (fill with real links from IRS/state/city sites):
export const registry2025: Registry = {
  year: 2025,
  federal: {
    percentage: { kind: 'pdf', url: 'https://www.irs.gov/pub/irs-pdf/p15t.pdf', note: 'IRS Pub 15-T Percentage Method tables' },
  },
  states: {
    CA: { percentage: { kind: 'xlsx', url: 'https://www.ftb.ca.gov/.../withholding-tables-2025.xlsx' } },
    NY: { percentage: { kind: 'pdf', url: 'https://www.tax.ny.gov/.../ny-withholding-2025.pdf' } },
    PA: { percentage: { kind: 'csv', url: 'https://www.revenue.pa.gov/.../withholding-2025.csv' } },
    // Add all states here (use two-letter codes)
  },
  localities: {
    NYC: { percentage: { kind: 'pdf', url: 'https://www.tax.ny.gov/.../nyc-resident-tax-2025.pdf', note: 'NYC resident tax rates' } },
    PHL: { fixed: { kind: 'fixed', residentRate: 0.0379, nonResidentRate: 0.0344, note: 'Philadelphia Wage Tax (example rates; replace with official)' } },
    STL: { fixed: { kind: 'fixed', rate: 0.01, note: 'St. Louis Earnings Tax (1%)' } },
  },
}
