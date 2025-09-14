import type { Registry } from './schemas'

export const registry2025: Registry = {
  year: 2025,
  federal: {
    percentage: { kind: 'pdf', tableType: 'percentage', url: 'https://www.irs.gov/pub/irs-pdf/p15t.pdf', note: 'IRS 15‑T Percentage Method (annual or derived)' },
    wageBracket_weekly:   { kind: 'pdf', tableType: 'wageBracket', schedule: 'weekly',   url: 'https://www.irs.gov/pub/irs-pdf/p15t.pdf' },
    wageBracket_biweekly: { kind: 'pdf', tableType: 'wageBracket', schedule: 'biweekly', url: 'https://www.irs.gov/pub/irs-pdf/p15t.pdf' },
    wageBracket_semimonthly: { kind: 'pdf', tableType: 'wageBracket', schedule: 'semimonthly', url: 'https://www.irs.gov/pub/irs-pdf/p15t.pdf' },
    wageBracket_monthly:  { kind: 'pdf', tableType: 'wageBracket', schedule: 'monthly',  url: 'https://www.irs.gov/pub/irs-pdf/p15t.pdf' },
  },
  states: {
    CA: {
      percentage: { kind: 'xlsx', tableType: 'percentage', url: 'https://example.ca.gov/withholding-2025.xlsx', sheet: 'Single' },
      wageBracket_biweekly: { kind: 'xlsx', tableType: 'wageBracket', schedule: 'biweekly', url: 'https://example.ca.gov/wage-bracket-2025.xlsx', sheet: 'Single' }
    },
    NY: {
      percentage: { kind: 'pdf', tableType: 'percentage', url: 'https://example.ny.gov/withholding-2025.pdf' }
    }
  },
  localities: {
    NYC: { percentage: { kind: 'pdf', tableType: 'percentage', url: 'https://example.nyc.gov/nyc-tax-2025.pdf' } },
    PHL: { fixed: { kind: 'fixed', tableType: 'fixed', residentRate: 0.0379, nonResidentRate: 0.0344 } },
    STL: { fixed: { kind: 'fixed', tableType: 'fixed', rate: 0.01 } },
  },
}
