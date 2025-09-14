// Lazy loader for the Rust→WASM engine. Falls back to stubs until built.
type Engine = {
  synth_calendar: Function
  tax_burden: Function
  label_suggest: Function
  income_viability: Function
}

let mod: Engine | null = null

export async function engine(): Promise<Engine> {
  if (mod) return mod
  try {
    // The path below expects `wasm-pack build --out-dir engine/pkg` and the Next project rooted at repo root.
    // Adjust if your layout differs.
    // @ts-ignore
    mod = await import('../../engine/pkg/finance_core')
    return mod
  } catch {
    // Safe stubs for immediate compile/run
    mod = {
      synth_calendar: () => [],
      tax_burden: (i: any) => ({ totalAnnual: 0, components: {}, effectiveRate: 0, perPaycheck: 0, input: i }),
      label_suggest: () => ({ confidence: 0 }),
      income_viability: (i: any) => ({ taxesAnnual: 0, colAnnual: 0, netAnnual: i.grossAnnual, disposableAnnual: i.grossAnnual, disposableMonthly: i.grossAnnual / 12, status: 'surplus' }),
    }
    return mod
  }
}
