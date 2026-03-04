import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './components/UI/Toast.jsx'
import Navbar from './components/Layout/Navbar.jsx'
import Footer from './components/Layout/Footer.jsx'
import Home from './pages/Home.jsx'
import ProductListing from './pages/ProductListing.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import OrderHistory from './pages/OrderHistory.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import AdminProducts from './pages/admin/Products.jsx'
import AdminCategories from './pages/admin/Categories.jsx'
import AdminOrders from './pages/admin/Orders.jsx'
import AdminSettings from './pages/admin/Settings.jsx'
import AdminTenants from './pages/admin/Tenants.jsx'
import AdminUsers from './pages/admin/Users.jsx'
import { useAuth } from './hooks/useAuth.js'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductListing />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={
        <ProtectedRoute><Checkout /></ProtectedRoute>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/orders" element={
        <ProtectedRoute><OrderHistory /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>
      } />
      <Route path="/admin/products" element={
        <ProtectedRoute adminOnly><AdminProducts /></ProtectedRoute>
      } />
      <Route path="/admin/categories" element={
        <ProtectedRoute adminOnly><AdminCategories /></ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute adminOnly><AdminOrders /></ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>
      } />
      <Route path="/admin/tenants" element={
        <ProtectedRoute adminOnly><AdminTenants /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar />
                <main style={{ flex: 1, paddingTop: 'var(--nav-height)' }}>
                  <AppRoutes />
                </main>
                <Footer />
              </div>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
