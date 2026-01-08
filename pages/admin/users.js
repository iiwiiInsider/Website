import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '../../components/Navbar'
import Link from 'next/link'

export default function UserManagement(){
  const { data: session, status } = useSession()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    if(status === 'authenticated' && session?.user?.email === 'admin@local.test'){
      loadUsers()
    }
  }, [status, session])

  const loadUsers = async () => {
    try{
      const res = await fetch('/api/admin/user-management')
      
      if(res.ok){
        const data = await res.json()
        setUsers(data.users || [])
      }
    }catch(e){
      console.error('Failed to load users:', e)
    }finally{
      setLoading(false)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try{
      const res = await fetch('/api/admin/user-management', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId, role: newRole })
      })

      if(res.ok){
        loadUsers()
      }else{
        alert('Failed to update user role')
      }
    }catch(e){
      alert('Failed to update user role')
    }
  }

  const deleteUser = async (userId) => {
    if(!confirm('Are you sure you want to delete this user?')) return

    try{
      const res = await fetch('/api/admin/user-management', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId })
      })

      if(res.ok){
        loadUsers()
      }else{
        alert('Failed to delete user')
      }
    }catch(e){
      alert('Failed to delete user')
    }
  }

  if(status === 'loading' || loading){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card"><h3>Loading…</h3></div>
        </div>
      </div>
    )
  }

  if(status === 'unauthenticated' || session?.user?.email !== 'admin@local.test'){
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="card">
            <h3>Admin only</h3>
            <p>You must be signed in as admin to view this page.</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = !filter || 
      user.email?.toLowerCase().includes(filter.toLowerCase()) ||
      user.name?.toLowerCase().includes(filter.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const roleStats = {
    total: users.length,
    buyers: users.filter(u => u.role === 'buyer').length,
    admins: users.filter(u => u.role === 'admin').length
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <h2 style={{marginTop:0}}>User Management</h2>
            <Link href="/admin"><button className="btn btn-ghost">Back to Admin</button></Link>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:16,marginTop:16}}>
            <div style={{padding:16,background:'rgba(160,32,240,0.08)',borderRadius:8,border:'1px solid rgba(160,32,240,0.2)'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Total Users</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>{roleStats.total}</div>
            </div>
            <div style={{padding:16,background:'rgba(0,255,255,0.08)',borderRadius:8,border:'1px solid rgba(0,255,255,0.2)'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Buyers</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>{roleStats.buyers}</div>
            </div>
            <div style={{padding:16,background:'rgba(255,0,0,0.08)',borderRadius:8,border:'1px solid rgba(255,0,0,0.2)'}}>
              <div style={{fontSize:14,color:'var(--muted)'}}>Admins</div>
              <div style={{fontSize:32,fontWeight:700,marginTop:4}}>{roleStats.admins}</div>
            </div>
          </div>

          <div style={{marginTop:20,display:'flex',gap:12,flexWrap:'wrap'}}>
            <input
              className="input"
              placeholder="Search by email or name..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{flex:1,minWidth:200,marginTop:0}}
            />
            <select 
              className="input" 
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{minWidth:150,marginTop:0}}
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyers</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div style={{marginTop:20,overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--border)'}}>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Name</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Email</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Role</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Joined</th>
                  <th style={{padding:'12px 8px',textAlign:'left',fontWeight:700}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{borderBottom:'1px solid var(--border-soft)'}}>
                    <td style={{padding:'10px 8px',fontSize:13,fontWeight:600}}>{user.name || '-'}</td>
                    <td style={{padding:'10px 8px',fontSize:13}}>{user.email}</td>
                    <td style={{padding:'10px 8px'}}>
                      {user.id === 'admin-local' ? (
                        <span style={{
                          padding:'4px 12px',
                          borderRadius:4,
                          background:'rgba(255,0,0,0.1)',
                          border:'1px solid rgba(255,0,0,0.3)',
                          fontSize:11,
                          fontWeight:600,
                          textTransform:'uppercase'
                        }}>
                          Admin
                        </span>
                      ) : (
                        <select 
                          value={user.role || 'buyer'}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          style={{
                            padding:'4px 8px',
                            borderRadius:4,
                            border:'1px solid var(--border)',
                            background:'var(--surface)',
                            fontSize:12,
                            color:'var(--text)',
                            textTransform:'capitalize'
                          }}
                        >
                          <option value="buyer">Buyer</option>
                        </select>
                      )}
                    </td>
                    <td style={{padding:'10px 8px',fontSize:12,color:'var(--muted)'}}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td style={{padding:'10px 8px'}}>
                      {user.id !== 'admin-local' && (
                        <button 
                          className="btn btn-danger" 
                          onClick={() => deleteUser(user.id)}
                          style={{fontSize:12,padding:'6px 12px'}}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div style={{padding:32,textAlign:'center',color:'var(--muted)'}}>
                No users found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
