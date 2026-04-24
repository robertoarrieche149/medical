import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import './AppLayout.css'

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="app-content animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
