import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import { sendWelcomeEmail } from '../../../lib/email'
import { promises as fs } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    // Credentials provider for local email/password login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
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
        return { id: user.id, name: user.name, email: user.email }
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
    async signIn({ user }){
      // Ensure we always have an email so listings can be tied to an agent.
      // If an auth provider doesn't supply email, block sign-in.
      return !!(user?.email && String(user.email).trim())
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
      if(user){ token.id = user.id }
      return token
    },
    async session({ session, token }){
      if(token?.id){ session.user.id = token.id }
      return session
    }
  },
  events: {
    async signIn(message){
      // message = { user, account, profile, isNewUser }
      try{
        const email = message.user?.email
        if(email){
          await sendWelcomeEmail(email, message.user?.name || email, process.env.BUSINESS_NAME || 'Business')
        }
      }catch(e){
        console.error('Failed to send welcome email', e)
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
