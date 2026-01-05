import Navbar from '../../components/Navbar'
import AgentProfileEditor from '../../components/AgentProfileEditor'

export default function AgentProfile(){
  return (
    <>
      <Navbar />
      <main className="container">
        <h1>Agent Profile</h1>
        <AgentProfileEditor />
      </main>
    </>
  )
}
