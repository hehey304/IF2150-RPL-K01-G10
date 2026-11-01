import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import RegistrasiPage from '../pages/auth/RegistrasiPage';
import AdminLayout from '../layouts/AdminLayout';
import PelangganLayout from '../layouts/PelangganLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import KonfirmasiLogoutPage from '../pages/auth/KonfirmasiLogoutPage';
// ...import the other pages

export default function AppRoutes() {
  return (
    <Routes>
      {/* public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registrasi" element={<RegistrasiPage />} />
      <Route element={<ProtectedRoute roles={["PELANGGAN", "RESTORAN", "ADMIN"]} />}>
        <Route path="/logout" element={<KonfirmasiLogoutPage />} />
      </Route>

      {/* role-protected */}
      <Route element={<ProtectedRoute roles={['PELANGGAN']} />}>
        <Route path="/pelanggan" element={<PelangganLayout />}>
          {/* <Route index element={<PencarianRestoPage />} /> */}
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['RESTORAN']} />}>
        <Route path="/restoran" element={<DashboardLayout />}>
          {/* <Route index element={<DashboardAntreanPage />} /> */}
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          {/* <Route index element={<DashboardKelolaRestoranPage />} /> */}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    
  );
}