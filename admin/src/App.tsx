import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './store/authStore';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import CircleManagement from './pages/CircleManagement';
import ReportReview from './pages/ReportReview';
import SensitiveWords from './pages/SensitiveWords';
import WishpoolThreshold from './pages/WishpoolThreshold';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="circles" element={<CircleManagement />} />
            <Route path="reports" element={<ReportReview />} />
            <Route path="sensitive-words" element={<SensitiveWords />} />
            <Route path="wishpool-threshold" element={<WishpoolThreshold />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
