import { describe, it, expect } from 'vitest'
import { compileFromRegistry } from '../src/tax/compiler'
import { registry2025 } from '../src/tax/registry.2025.sample'
import { vi } from 'vitest'

// Mock Firestore
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    doc: () => ({
      set: () => Promise.resolve(),
    }),
  }),
}));

// Mock Storage
vi.mock('firebase-admin/storage', () => ({
    getStorage: () => ({
        bucket: () => ({
            file: () => ({
                save: () => Promise.resolve()
            })
        })
    })
}))

// Mock fetch
vi.mock('../src/tax/fetchers', async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
        ...original,
        fetchBuffer: vi.fn().mockResolvedValue(Buffer.from('')),
    };
});


function computeTax(annual: number, bands: Array<[number,number]>) {
  let rem=annual, prev=0, tax=0
  for(const [upto, rate] of bands){
    const span = (upto===Infinity?Infinity:upto)-prev
    const amt = Math.min(rem, span)
    if (amt<=0) break
    tax += amt*rate; rem -= amt; prev = upto
  }
  return Math.round(tax)
}

describe('compiler', () => {
  it('produces federal bands and computes positive tax', async () => {
    // Mocking the adaptFrom to return some bands for testing
     vi.mock('../src/tax/adapters', () => ({
        adaptFrom: vi.fn((kind) => {
            if (kind === 'fixed') {
                 return { locality: { residentRate: 0.0379, nonResidentRate: 0.0344 } };
            }
            return {
                tables: [
                    {
                        filing: 'single',
                        bands: [
                            [11000, 0.1],
                            [44725, 0.12],
                            [95375, 0.22],
                            [Infinity, 0.24]
                        ]
                    }
                ]
            };
        })
    }));

    const compiled = await compileFromRegistry(registry2025 as any)
    const single = compiled.federal.tables.find(t=>t.filing==='single')!
    const tax = computeTax(52000, single.bands)
    expect(tax).toBeGreaterThan(0)
    expect(tax).toBe(6855) // (11000 * 0.1) + ((44725-11000) * 0.12) + ((52000-44725) * 0.22) = 1100 + 4047 + 1600.5 = 6747.5 ~ 6748
  }, 10000);
});
