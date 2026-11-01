import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const CatalogPage = lazy(() => import('@/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const ProductPage = lazy(() => import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const CartPage = lazy(() => import('@/pages/CartPage').then((m) => ({ default: m.CartPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const AccountPage = lazy(() => import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const OrdersPage = lazy(() => import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const AddressesPage = lazy(() => import('@/pages/AddressesPage').then((m) => ({ default: m.AddressesPage })));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() => import('@/pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const FAQPage = lazy(() => import('@/pages/FAQPage').then((m) => ({ default: m.FAQPage })));
const PolicyPage = lazy(() => import('@/pages/PolicyPage').then((m) => ({ default: m.PolicyPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminCustomers = lazy(() => import('@/pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomers })));
const AdminInventory = lazy(() => import('@/pages/admin/AdminInventory').then((m) => ({ default: m.AdminInventory })));
const AdminCoupons = lazy(() => import('@/pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons })));
const AdminBanners = lazy(() => import('@/pages/admin/AdminBanners').then((m) => ({ default: m.AdminBanners })));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminAdmins = lazy(() => import('@/pages/admin/AdminAdmins').then((m) => ({ default: m.AdminAdmins })));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-stone" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
        <Route path="/catalogo/:categorySlug" element={<Suspense fallback={<PageLoader />}><CatalogPage /></Suspense>} />
        <Route path="/colecoes/:collectionSlug" element={<Suspense fallback={<PageLoader />}><CatalogPage /></Suspense>} />
        <Route path="/produto/:slug" element={<Suspense fallback={<PageLoader />}><ProductPage /></Suspense>} />
        <Route path="/busca" element={<Suspense fallback={<PageLoader />}><SearchPage /></Suspense>} />
        <Route path="/novidades" element={<Suspense fallback={<PageLoader />}><CatalogPage /></Suspense>} />
        <Route path="/lancamentos" element={<Suspense fallback={<PageLoader />}><CatalogPage /></Suspense>} />
        <Route path="/promocoes" element={<Suspense fallback={<PageLoader />}><CatalogPage /></Suspense>} />
        <Route path="/favoritos" element={<Suspense fallback={<PageLoader />}><FavoritesPage /></Suspense>} />
        <Route path="/carrinho" element={<Suspense fallback={<PageLoader />}><CartPage /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
        <Route path="/cadastro" element={<Suspense fallback={<PageLoader />}><SignupPage /></Suspense>} />
        <Route path="/recuperar-senha" element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />
        <Route path="/checkout" element={<Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense>} />
        <Route path="/pedido/confirmacao/:orderNumber" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><OrderConfirmationPage /></ProtectedRoute></Suspense>} />
        <Route path="/conta" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><AccountPage /></ProtectedRoute></Suspense>} />
        <Route path="/conta/pedidos" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><OrdersPage /></ProtectedRoute></Suspense>} />
        <Route path="/conta/pedidos/:orderNumber" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><OrderDetailPage /></ProtectedRoute></Suspense>} />
        <Route path="/conta/enderecos" element={<Suspense fallback={<PageLoader />}><ProtectedRoute><AddressesPage /></ProtectedRoute></Suspense>} />
        <Route path="/sobre" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="/contato" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
        <Route path="/faq" element={<Suspense fallback={<PageLoader />}><FAQPage /></Suspense>} />
        <Route path="/politica/:policy" element={<Suspense fallback={<PageLoader />}><PolicyPage /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute></Suspense>}>
          <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
          <Route path="produtos" element={<Suspense fallback={<PageLoader />}><AdminProducts /></Suspense>} />
          <Route path="estoque" element={<Suspense fallback={<PageLoader />}><AdminInventory /></Suspense>} />
          <Route path="pedidos" element={<Suspense fallback={<PageLoader />}><AdminOrders /></Suspense>} />
          <Route path="clientes" element={<Suspense fallback={<PageLoader />}><AdminCustomers /></Suspense>} />
          <Route path="cupons" element={<Suspense fallback={<PageLoader />}><AdminCoupons /></Suspense>} />
          <Route path="banners" element={<Suspense fallback={<PageLoader />}><AdminBanners /></Suspense>} />
          <Route path="configuracoes" element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
          <Route path="administradores" element={<Suspense fallback={<PageLoader />}><AdminAdmins /></Suspense>} />
        </Route>
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
      </Route>
    </Routes>
  );
}
