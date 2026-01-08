import { promises as fs } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { calculateRevenueBreakdown, TRANSACTION_STATUS } from '../../../lib/revenue'
import { appendAudit } from '../../../lib/audit'

const TRANSACTIONS_FILE = path.join(process.cwd(), 'data', 'transactions.json')

async function readTransactions() {
  const raw = await fs.readFile(TRANSACTIONS_FILE, 'utf8').catch(() => '[]')
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeTransactions(transactions) {
  await fs.mkdir(path.dirname(TRANSACTIONS_FILE), { recursive: true })
  await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2))
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const email = String(session?.user?.email || '').trim().toLowerCase()
  
  if (!email) return res.status(401).json({ error: 'Unauthorized' })

  // GET: List transactions for user or admin
  if (req.method === 'GET') {
    try {
      const transactions = await readTransactions()
      const isAdmin = email === 'admin@local.test'
      
      let filtered = isAdmin 
        ? transactions 
        : transactions.filter(t => t.agentEmail === email || t.buyerEmail === email)
      
      // Filter by status if provided
      const { status } = req.query
      if (status) {
        filtered = filtered.filter(t => t.status === status)
      }
      
      // Sort by date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      return res.status(200).json({ ok: true, transactions: filtered })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load transactions' })
    }
  }

  // POST: Create new transaction
  if (req.method === 'POST') {
    try {
      const { propertyId, listingPrice, buyerEmail, agentEmail, description } = req.body || {}
      
      if (!propertyId || !listingPrice || !agentEmail) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const breakdown = calculateRevenueBreakdown(Number(listingPrice))
      
      const transaction = {
        id: `txn_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        propertyId: String(propertyId),
        listingPrice: Number(listingPrice),
        breakdown,
        agentEmail: String(agentEmail).toLowerCase(),
        buyerEmail: buyerEmail ? String(buyerEmail).toLowerCase() : null,
        description: String(description || '').slice(0, 200),
        status: TRANSACTION_STATUS.COMPLETED,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      }

      const transactions = await readTransactions()
      transactions.push(transaction)
      await writeTransactions(transactions)

      await appendAudit({
        actorEmail: email,
        action: 'TRANSACTION_CREATED',
        targetType: 'transaction',
        targetId: transaction.id,
        data: {
          propertyId,
          listingPrice,
          agentEmail,
          breakdown
        }
      })

      return res.status(201).json({ ok: true, transaction })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to create transaction' })
    }
  }

  // PUT: Update transaction status
  if (req.method === 'PUT') {
    try {
      const { transactionId, status } = req.body || {}
      const isAdmin = email === 'admin@local.test'
      
      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin only' })
      }

      const transactions = await readTransactions()
      const transaction = transactions.find(t => t.id === transactionId)
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' })
      }

      transaction.status = status
      transaction.updatedAt = new Date().toISOString()
      
      await writeTransactions(transactions)

      await appendAudit({
        actorEmail: email,
        action: 'TRANSACTION_UPDATED',
        targetType: 'transaction',
        targetId: transactionId,
        data: { status }
      })

      return res.status(200).json({ ok: true, transaction })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update transaction' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
