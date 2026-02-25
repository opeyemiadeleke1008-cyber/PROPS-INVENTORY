import { Routes, Route } from 'react-router-dom'
import Signin from './Home/Signin'
import Dashboard from './Pages/Dashboard'
import Error from './UI/Error'
import Reports from './Pages/Reports'
import Settings from './Pages/Settings'
import Products from './Pages/Products'
import PurchaseOrders from './Pages/PurchaseOrders'
import StockMovements from './Pages/StockMovements'
import Delivery from './Pages/Delivery'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Signin />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/delivery" element={<Delivery />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/products" element={<Products />} />
      <Route path="/stock-movements" element={<StockMovements />} />
      <Route path="/purchase-orders" element={<PurchaseOrders />} />
      <Route path="*" element={<Error />} />
    </Routes>
  )
}
