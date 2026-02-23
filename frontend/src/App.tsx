import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Usuarios from './pages/config/Usuarios'
import Perfiles from './pages/config/Perfiles'
import LdapConfig from './pages/config/LdapConfig'
import Tecnologias from './pages/avanzada/Tecnologias'
import Operadores from './pages/avanzada/Operadores'
import Equipos from './pages/avanzada/Equipos'
import NumerosExternos from './pages/avanzada/NumerosExternos'
import ConfigAsterisk from './pages/avanzada/ConfigAsterisk'
import Matrices from './pages/pruebas/Matrices'
import MatrizDetalle from './pages/pruebas/MatrizDetalle'
import LanzadorPruebas from './pages/pruebas/LanzadorPruebas'
import ReportePruebas from './pages/reportes/ReportePruebas'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/principal" element={<Dashboard />} />
          <Route path="/configuracion-general/usuarios" element={<Usuarios />} />
          <Route path="/configuracion-general/perfiles" element={<Perfiles />} />
          <Route path="/configuracion-general/ldap" element={<LdapConfig />} />
          <Route path="/configuracion-avanzada/tecnologias" element={<Tecnologias />} />
          <Route path="/configuracion-avanzada/operadores-telefonicos" element={<Operadores />} />
          <Route path="/configuracion-avanzada/equipos" element={<Equipos />} />
          <Route path="/configuracion-avanzada/numeros-externos" element={<NumerosExternos />} />
          <Route path="/configuracion-avanzada/asterisk" element={<ConfigAsterisk />} />
          <Route path="/generador-pruebas/matrices" element={<Matrices />} />
          <Route path="/generador-pruebas/matrices/:id" element={<MatrizDetalle />} />
          <Route path="/generador-pruebas/lanzador-pruebas" element={<LanzadorPruebas />} />
          <Route path="/reportes/reporte-pruebas" element={<ReportePruebas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
