import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
const root = process.cwd()
const SRC = join(root, 'src')
const offenders = []
function walk(dir){
  for(const e of readdirSync(dir,{withFileTypes:true})){
    const p = join(dir,e.name)
    if(e.isDirectory()){ if(!['node_modules','.next','.git'].includes(e.name)) walk(p) }
    else if(/\.(ts|tsx|js|jsx)$/.test(p)){
      const code = readFileSync(p,'utf8')
      if(/from\s+['\"]firebase\//.test(code) && !/src\/lib\/(firebase|messaging)\.(ts|tsx|js)/.test(p)) offenders.push(p)
    }
  }
}
walk(SRC)
if(offenders.length){ console.error('\n❌ Non-canonical firebase imports:\n' + offenders.map(x=>' - '+x.replace(root+'/','')).join('\n')); process.exit(1) }
console.log('✅ Firebase imports clean')
