import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import AvisosPage from './pages/AvisosPage'
import LeyesLaboralesPage from './pages/LeyesLaboralesPage'
import BeneficiosPage from './pages/BeneficiosPage'
import ConveniosPage from './pages/ConveniosPage'
import PerfilPage from './pages/PerfilPage'
import SociosPage from './pages/SociosPage'
import CuotasPage from './pages/CuotasPage'
import LoginPage from './pages/LoginPage'
import FAQPage from './pages/FAQPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login — único sin protección */}
        <Route path="/login" element={<LoginPage />} />

        {/* Layout principal — todas las rutas protegidas */}
        <Route element={<AppLayout />}>

          {/* Todos los usuarios logueados */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/avisos" element={<ProtectedRoute><AvisosPage /></ProtectedRoute>} />
          <Route path="/leyes" element={<ProtectedRoute><LeyesLaboralesPage /></ProtectedRoute>} />
          <Route path="/beneficios" element={<ProtectedRoute><BeneficiosPage /></ProtectedRoute>} />
          <Route path="/convenios" element={<ProtectedRoute><ConveniosPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
          <Route path="/faq" element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />

          {/* Director y Administrador */}
          <Route path="/dashboard" element={<ProtectedRoute allowDirector><DashboardPage /></ProtectedRoute>} />
          <Route path="/cuotas" element={<ProtectedRoute allowDirector><CuotasPage /></ProtectedRoute>} />
          <Route path="/socios" element={<ProtectedRoute allowDirector><SociosPage /></ProtectedRoute>} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
