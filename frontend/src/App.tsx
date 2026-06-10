import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage        from './pages/AuthPage'
import AdminLogin      from './pages/admin/AdminLogin'
import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminGames      from './pages/admin/AdminGames'
import AdminGameEdit   from './pages/admin/AdminGameEdit'
import Lobby           from './pages/team/Lobby'
import TeamGame        from './pages/team/TeamGame'
import TeamResults     from './pages/team/TeamResults'
import Waiting         from './pages/team/Waiting'

export default function App() {
  return (
    <Routes>
      <Route path="/agt"           element={<AuthPage />} />
      <Route path="/agt/lobby"     element={<Lobby />} />
      <Route path="/agt/waiting"   element={<Waiting />} />
      <Route path="/agt/game"      element={<TeamGame />} />
      <Route path="/agt/results"   element={<TeamResults />} />

      <Route path="/agt/adm"             element={<AdminLogin />} />
      <Route path="/agt/adm/dashboard"   element={<AdminDashboard />} />
      <Route path="/agt/adm/games"       element={<AdminGames />} />
      <Route path="/agt/adm/games/:id"   element={<AdminGameEdit />} />

      <Route path="/"  element={<Navigate to="/agt" replace />} />
      <Route path="*"  element={<Navigate to="/agt" replace />} />
    </Routes>
  )
}
