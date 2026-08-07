import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/presentation/components/layout/RootLayout";
import { ProtectedRoute } from "./ProtectedRoute";

import HomePage from "@/presentation/pages/HomePage";
import CatalogPage from "@/presentation/pages/CatalogPage";
import ProductDetailPage from "@/presentation/pages/ProductDetailPage";
import CartPage from "@/presentation/pages/CartPage";
import CheckoutPage from "@/presentation/pages/CheckoutPage";
import LoginPage from "@/presentation/pages/LoginPage";
import RegisterPage from "@/presentation/pages/RegisterPage";
import ForgotPasswordPage from "@/presentation/pages/ForgotPasswordPage";
import ProfilePage from "@/presentation/pages/ProfilePage";
import OrdersPage from "@/presentation/pages/OrdersPage";
import OrderDetailPage from "@/presentation/pages/OrderDetailPage";
import NotFoundPage from "@/presentation/pages/NotFoundPage";

// Admin Dashboards
import AdminDashboardPage from "@/presentation/pages/admin/AdminDashboardPage";
import AdminProductsPage from "@/presentation/pages/admin/AdminProductsPage";
import AdminProductFormPage from "@/presentation/pages/admin/AdminProductFormPage";
import AdminUsersPage from "@/presentation/pages/admin/AdminUsersPage";
import AdminCampaignsPage from "@/presentation/pages/admin/AdminCampaignsPage";

// Contador Dashboard
import ContadorDashboardPage from "@/presentation/pages/contador/ContadorDashboardPage";

// Vendedor Dashboard
import VendedorDashboardPage from "@/presentation/pages/vendedor/VendedorDashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "catalogo", element: <CatalogPage /> },
      { path: "producto/:id", element: <ProductDetailPage /> },
      { path: "carrito", element: <CartPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "registro", element: <RegisterPage /> },
      { path: "recuperar-password", element: <ForgotPasswordPage /> },

      // Client Protected Routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: "checkout", element: <CheckoutPage /> },
          { path: "perfil", element: <ProfilePage /> },
          { path: "pedidos", element: <OrdersPage /> },
          { path: "pedidos/:id", element: <OrderDetailPage /> },
        ],
      },

      // Admin Protected Routes
      {
        element: <ProtectedRoute allowedRoles={["administrador"]} />,
        children: [
          { path: "admin", element: <AdminDashboardPage /> },
          { path: "admin/productos", element: <AdminProductsPage /> },
          { path: "admin/productos/nuevo", element: <AdminProductFormPage /> },
          { path: "admin/productos/editar/:id", element: <AdminProductFormPage /> },
          { path: "admin/usuarios", element: <AdminUsersPage /> },
          { path: "admin/campanas", element: <AdminCampaignsPage /> },
        ],
      },

      // Contador Protected Routes
      {
        element: <ProtectedRoute allowedRoles={["contador", "administrador"]} />,
        children: [
          { path: "contador", element: <ContadorDashboardPage /> },
        ],
      },

      // Vendedor Protected Routes
      {
        element: <ProtectedRoute allowedRoles={["vendedor", "administrador"]} />,
        children: [
          { path: "vendedor", element: <VendedorDashboardPage /> },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
