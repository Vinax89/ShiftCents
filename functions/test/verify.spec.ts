import { describe, it, expect } from 'vitest'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import { runVerify } from '../src/tax/verify.function'
import { vi } from 'vitest'

// Mock Firestore before other imports
vi.mock('firebase-admin/firestore', async () => {
  const actual = await vi.importActual('firebase-admin/firestore');
  const getFirestore = () => ({
    doc: (path: string) => ({
      get: async () => {
        if (path.includes('system/taxRules')) {
          return {
            exists: true,
            data: () => ({
              year: 2025,
              federal: {
                tables: [{ filing: 'single', bands: [[11000, 0.1], [44725, 0.12], [95375, 0.22], [Infinity, 0.24]] }]
              },
              states: [],
              localities: []
            }),
          };
        }
        return { exists: false, data: () => null };
      },
    }),
    collection: (path: string) => ({
      get: async () => {
        if (path.includes('system/taxSamples')) {
           return {
            empty: false,
            docs: [
              {
                id: '1',
                data: () => ({ kind: 'federal', code: 'FED', filing: 'single', wagesAnnual: 52000, expectedAnnual: 6748 }),
              },
            ],
          };
        }
        return { empty: true, docs: [] };
      },
    }),
  });
  return { ...actual, getFirestore };
});

vi.mock('firebase-admin/app', () => ({
  getApps: () => ['mock-app'],
  initializeApp: () => 'mock-app'
}));


it('runs verify against Firestore examples (if present)', async () => {
  const year = new Date().getFullYear()
  const db = getFirestore();
  const compiledSnap = await db.doc(`system/taxRules/${year}/compiled`).get()
  if (!compiledSnap.exists()) { console.warn('compiled corpus missing, skipping'); return }
  const examplesSnap = await db.collection(`system/taxSamples/${year}/cases`).get()
  if (examplesSnap.empty) { console.warn('no examples, skipping'); return }
  const compiled: any = compiledSnap.data()
  const cases = examplesSnap.docs.map(d=> ({ id: d.id, ...d.data() }))
  const { failed } = await runVerify(compiled, cases, 1)
  expect(failed.length).toBe(0)
})
