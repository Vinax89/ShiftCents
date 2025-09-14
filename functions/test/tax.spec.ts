import { describe, it, expect } from 'vitest'
import { compileAndWrite } from '../src/tax/compiler'
import { Corpus } from '../src/tax/schema'

function calcTax(annual: number, bands: Array<[number, number]>){
  let remaining = annual; let prev = 0; let total = 0
  for (const [upto, rate] of bands){
    const cap = Math.min(remaining, upto === Infinity ? Infinity : (upto - prev))
    if (cap <= 0) break
    total += cap * rate
    remaining -= cap
    prev = upto
  }
  return Math.round(total)
}

describe('tax compiler', () => {
  it('compiles and computes sample federal single ~$52k', async () => {
    const corpus = Corpus.parse({
      year: 2025,
      federal: (await import('../src/tax/sources/federal.sample.json')).default,
      states: [(await import('../src/tax/sources/ca.sample.json')).default],
    })
    const compiled = await compileAndWrite(corpus)
    const fedSingle = compiled.federal.find((t:any)=>t.filing==='single')
    const annual = 52000
    const tax = calcTax(annual, fedSingle.bands)
    expect(tax).toBeGreaterThan(0)
  })
})
