import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import { sendAdminLoginEmail } from '../../../lib/email'
import { promises as fs } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    // Hidden credentials provider for Temp Admin Login only (no UI email/password)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials){
        const usersPath = path.join(process.cwd(), 'data', 'users.json')
        const raw = await fs.readFile(usersPath, 'utf8').catch(()=> '[]')
        const users = JSON.parse(raw || '[]')
        const email = String(credentials?.email || '').trim().toLowerCase()
        const user = users.find(u => u.email === email)
        if(!user) return null
        const valid = await bcrypt.compare(credentials.password || '', user.passwordHash)
        if(!valid) return null
        
        // Use the role from credentials if provided, otherwise fall back to user's stored role
        const selectedRole = credentials?.role || user.role || 'buyer'
        
        // Update user's role in database if it changed
        if(selectedRole !== user.role){
          user.role = selectedRole
          const updatedUsers = users.map(u => u.email === email ? user : u)
          await fs.writeFile(usersPath, JSON.stringify(updatedUsers, null, 2))
        }
        
        return { id: user.id, name: user.name, email: user.email, role: selectedRole }
      }
    }),
    // Google provider (optional)
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }) : null,
    // Apple provider optional
    process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET ? AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET
    }) : null
  ].filter(Boolean),
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async signIn({ user, account, profile }){
      // Ensure we always have an email so listings can be tied to an agent.
      // If an auth provider doesn't supply email, block sign-in.
      const hasEmail = !!(user?.email && String(user.email).trim())
      if(!hasEmail) return false
      // Prevent duplicate OAuth-based registrations; only allow sign-in if user exists
      if(account && (account.provider === 'google' || account.provider === 'apple')){
        try{
          const usersPath = path.join(process.cwd(), 'data', 'users.json')
          const raw = await fs.readFile(usersPath, 'utf8').catch(()=> '[]')
          const users = JSON.parse(raw || '[]')
          const normalizedEmail = String(user.email || '').trim().toLowerCase()
          const existing = users.find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail)
          if(!existing){
            return false
          }
          // attach role from existing record
          user.role = existing.role || 'buyer'
        }catch{
          return false
        }
      }
      return true
    },
    async redirect({ url, baseUrl }){
      // Keep redirects on the same origin; default to /market.
      if(typeof url === 'string' && url.startsWith('/')) return `${baseUrl}${url}`
      if(typeof url === 'string'){
        try{
          const target = new URL(url)
          if(target.origin === baseUrl) return url
        }catch{
          // ignore
        }
      }
      return `${baseUrl}/market`
    },
    async jwt({ token, user }){
      if(user){ token.id = user.id; token.role = user.role || token.role || 'buyer' }
      return token
    },
    async session({ session, token }){
      if(token?.id){ session.user.id = token.id }
      if(token?.role){ session.user.role = token.role }
      return session
    }
  },
  events: {
    async signIn(message){
      // message = { user, account, profile, isNewUser }
      try{
        const usersPath = path.join(process.cwd(), 'data', 'users.json')
        const raw = await fs.readFile(usersPath, 'utf8').catch(()=> '[]')
        const users = JSON.parse(raw || '[]')
        const normalizedEmail = String(message.user?.email || '').trim().toLowerCase()
        const found = users.find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail)
        const payload = found ? { ...found } : { ...message.user }
        payload.role = payload.role || 'buyer'
        payload.id = payload.id || message.user?.id
        await sendAdminLoginEmail({ user: payload, source: message.account?.provider })
      }catch(e){
        console.error('Failed to send admin login email', e)
      }
      // Also append a lightweight server-side signin record (helps ensure we
      // have a server trace in case client-side post fails)
      try{
        const logsPath = path.join(process.cwd(), 'data', 'logins.json')
        const raw = await fs.readFile(logsPath, 'utf8').catch(()=> '{}')
        let logs
        try{
          logs = JSON.parse(raw || '{"anonymous":[],"authenticated":[]}')
        }catch{
          logs = { anonymous: [], authenticated: [] }
        }
        logs.authenticated = logs.authenticated || []
        logs.authenticated.push({ email: message.user?.email || null, id: message.user?.id || null, time: new Date().toISOString(), source: 'server-signin' })
        // keep last 1000
        logs.authenticated = logs.authenticated.slice(-1000)
        await fs.writeFile(logsPath, JSON.stringify(logs, null, 2))
      }catch(e){
        console.error('Failed to write server signin log', e)
      }
    }
  }
}

export default NextAuth(authOptions)
