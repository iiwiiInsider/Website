import { getServerSession } from 'next-auth/next'
import { promises as fs } from 'fs'
import path from 'path'
import { authOptions } from '../auth/[...nextauth]'
import { appendAudit } from '../../../lib/audit'

const TASKS_FILE = path.join(process.cwd(), 'data', 'agentTasks.json')

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase())
}

async function readTasks(){
  const raw = await fs.readFile(TASKS_FILE, 'utf8').catch(()=> '[]')
  try{
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  }catch{
    return []
  }
}

async function writeTasks(tasks){
  await fs.mkdir(path.dirname(TASKS_FILE), { recursive: true })
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2))
}

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions)
  const actorEmail = String(session?.user?.email || '').trim().toLowerCase()
  if(!actorEmail) return res.status(401).json({ error: 'Unauthorized' })
  if(!isValidEmail(actorEmail)) return res.status(400).json({ error: 'Valid user email required' })

  if(req.method === 'GET'){
    const tasks = await readTasks()
    const mine = tasks.filter(t => String(t?.assignedToEmail || '').trim().toLowerCase() === actorEmail)
    // newest first
    mine.sort((a,b)=> String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))
    return res.status(200).json({ ok: true, tasks: mine })
  }

  if(req.method === 'POST'){
    const {
      assignedToEmail,
      title,
      fields,
      dueDate,
      timeZone,
      priority
    } = req.body || {}

    const assigned = String(assignedToEmail || actorEmail).trim().toLowerCase()
    if(assigned !== actorEmail){
      // In this demo, agents can only assign tasks to themselves.
      return res.status(403).json({ error: 'You can only create tasks assigned to your own account' })
    }
    if(!isValidEmail(assigned)) return res.status(400).json({ error: 'Valid assignedToEmail required' })

    const safeTitle = String(title || '').trim()
    if(!safeTitle) return res.status(400).json({ error: 'Title required' })
    if(safeTitle.length > 80) return res.status(400).json({ error: 'Title must be 80 characters or less' })

    const safeFields = fields && typeof fields === 'object' && !Array.isArray(fields) ? fields : {}

    const safePriority = String(priority || 'normal').trim().toLowerCase()
    const allowedPriorities = ['low','normal','high','urgent']
    const pr = allowedPriorities.includes(safePriority) ? safePriority : 'normal'

    const safeDue = dueDate ? String(dueDate).slice(0, 40) : null
    const safeTz = timeZone ? String(timeZone).slice(0, 80) : null

    const tasks = await readTasks()
    const id = `task_${Date.now()}_${Math.random().toString(16).slice(2)}`

    const task = {
      id,
      assignedToEmail: assigned,
      createdByEmail: actorEmail,
      status: 'required',
      title: safeTitle,
      priority: pr,
      timeZone: safeTz,
      dueDate: safeDue,
      fields: safeFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    tasks.push(task)
    await writeTasks(tasks)

    await appendAudit({
      actorEmail,
      action: 'AGENT_TASK_CREATE',
      targetType: 'agent-task',
      targetId: id,
      data: {
        assignedToEmail: assigned,
        title: safeTitle,
        priority: pr
      }
    }).catch(()=>null)

    return res.status(200).json({ ok: true, task })
  }

  if(req.method === 'PATCH'){
    const { id, status } = req.body || {}
    const taskId = String(id || '').trim()
    if(!taskId) return res.status(400).json({ error: 'id required' })

    const safeStatus = String(status || '').trim().toLowerCase()
    const allowed = ['required','done']
    if(!allowed.includes(safeStatus)) return res.status(400).json({ error: 'status must be required or done' })

    const tasks = await readTasks()
    const idx = tasks.findIndex(t => String(t?.id) === taskId)
    if(idx === -1) return res.status(404).json({ error: 'Task not found' })

    const task = tasks[idx] || {}
    const assigned = String(task?.assignedToEmail || '').trim().toLowerCase()
    if(assigned !== actorEmail) return res.status(403).json({ error: 'Forbidden' })

    tasks[idx] = { ...task, status: safeStatus, updatedAt: new Date().toISOString() }
    await writeTasks(tasks)

    await appendAudit({
      actorEmail,
      action: 'AGENT_TASK_STATUS',
      targetType: 'agent-task',
      targetId: taskId,
      data: { status: safeStatus }
    }).catch(()=>null)

    return res.status(200).json({ ok: true, task: tasks[idx] })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
