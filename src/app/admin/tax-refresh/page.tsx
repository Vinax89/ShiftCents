'use client'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useState } from 'react'

function getClient(){
  const cfg = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID }
  if (!cfg.apiKey) {
    console.error("Firebase config is missing from environment variables.");
    return null;
  }
  const app = getApps().length ? getApp() : initializeApp(cfg)
  return getFunctions(app)
}

export default function TaxRefresh(){
  const [status,setStatus] = useState<string>('Idle')
  const [busy,setBusy] = useState(false)
  async function run(){
    try{
      setBusy(true); setStatus('Refreshing…')
      const functions = getClient()
      if (!functions) {
        setStatus('Error: Firebase not configured.');
        setBusy(false);
        return;
      }
      const fn = httpsCallable(functions, 'refreshTaxCorpusNow')
      const res: any = await fn({ year: new Date().getFullYear() })
      setStatus(`Done: year=${res.data.year}`)
    }catch(e:any){ setStatus('Error: '+(e?.message||'unknown')) } finally{ setBusy(false) }
  }
  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-semibold">Tax Corpus — One‑Click Update</h1>
      <p className="text-sm opacity-80">Fetch official sources, parse, and compile into Firestore for the current year.</p>
      <button disabled={busy} onClick={run} className="border rounded px-4 py-2">{busy?'Working…':'Refresh Now'}</button>
      <div className="text-sm">{status}</div>
    </div>
  )
}
