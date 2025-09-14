import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { engine } from './engine'
import { db } from './firebase'

let inited=false
export async function ensureEngineInit(year = new Date().getFullYear()){
  if (inited || !db) return;
  // Load compiled tax corpus; pass to WASM init if available
  try {
    const snap = await getDoc(doc(db, `system/taxRules/${year}/compiled`))
    const corpus = snap.exists() ? snap.data() : null
    const e = await engine()
    if (e && typeof e.init_engine === 'function') { await e.init_engine({ taxCorpus: corpus }) }
  } finally { inited = true }
}
