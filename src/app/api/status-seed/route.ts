import seed from '@/data/status-seed.json'

export async function GET(){ 
    return new Response(JSON.stringify(seed), { 
        headers: { 'content-type':'application/json' } 
    }) 
}
