import { Routes, Route } from 'react-router-dom'
// Pages
import AuthPage      from './pages/AuthPage'
import TeamGame      from './pages/team/TeamGame'
import TeamResults   from './pages/team/TeamResults'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminGames    from './pages/admin/AdminGames'
import AdminGameEdit from './pages/admin/AdminGameEdit'

export default function App() {
  return (
    <Routes>
      <Route path="/"               element={<AuthPage />} />
      <Route path="/game"           element={<TeamGame />} />
      <Route path="/results"        element={<TeamResults />} />
      <Route path="/admin"          element={<AdminDashboard />} />
      <Route path="/admin/games"    element={<AdminGames />} />
      <Route path="/admin/games/:id" element={<AdminGameEdit />} />
    </Routes>
  )
}
