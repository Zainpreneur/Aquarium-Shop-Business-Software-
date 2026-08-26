import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./lib/auth";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { POS } from "./pages/POS";
import { SalesHistory } from "./pages/SalesHistory";
import { Customers } from "./pages/Customers";
import { Suppliers } from "./pages/Suppliers";
import { PurchaseOrders } from "./pages/PurchaseOrders";
import { Reports } from "./pages/Reports";
import { UsersAdmin } from "./pages/UsersAdmin";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<SalesHistory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/users"
              element={
                <RequireAuth roles={["ADMIN"]}>
                  <UsersAdmin />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
