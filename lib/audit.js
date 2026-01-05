import { promises as fs } from 'fs'
import path from 'path'

const AUDIT_FILE = path.join(process.cwd(), 'data', 'auditLog.json')
const MAX_ENTRIES = 500

async function readAudit(){
  const raw = await fs.readFile(AUDIT_FILE, 'utf8').catch(()=> '[]')
  try{
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  }catch{
    return []
  }
}

async function writeAudit(entries){
  await fs.mkdir(path.dirname(AUDIT_FILE), { recursive: true })
  await fs.writeFile(AUDIT_FILE, JSON.stringify(entries, null, 2))
}

export async function appendAudit(entry){
  const safeEntry = {
    id: `a_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    actorEmail: String(entry?.actorEmail || '').trim().toLowerCase() || null,
    action: String(entry?.action || '').trim() || 'UNKNOWN',
    targetType: String(entry?.targetType || '').trim() || null,
    targetId: entry?.targetId != null ? String(entry.targetId) : null,
    data: entry?.data && typeof entry.data === 'object' ? entry.data : null
  }

  const entries = await readAudit()
  entries.unshift(safeEntry)
  if(entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES
  await writeAudit(entries)

  return safeEntry
}

export async function readAuditLatest(limit = 100){
  const n = Number(limit)
  const capped = Number.isFinite(n) ? Math.max(1, Math.min(200, Math.floor(n))) : 100
  const entries = await readAudit()
  return entries.slice(0, capped)
}
