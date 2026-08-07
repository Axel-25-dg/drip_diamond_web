import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "@/presentation/components/cart/CartDrawer";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
