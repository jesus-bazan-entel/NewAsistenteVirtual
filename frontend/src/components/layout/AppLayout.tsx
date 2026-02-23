import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-entel-dark">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0f0f14] to-[#1a1a24]" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-entel-orange/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-entel-amber/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <div
        className={`
          transition-all duration-300 min-h-screen flex flex-col
          ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}
        `}
      >
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        {/* Page content */}
        <main className="flex-1 p-6 relative z-10">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.08] py-4 px-6 bg-[#0f0f14]">
          <div className="flex items-center justify-between text-sm text-white/40 font-sans">
            <span>
              Copyright &copy; 2024{' '}
              <a
                href="http://bestsol.pe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-entel-orange hover:underline"
              >
                BESTSOL
              </a>
              . Todos los derechos reservados
            </span>
            <span>Entel VoIP Monitor v5.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
