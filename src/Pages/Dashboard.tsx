import { useEffect, useState } from 'react'
import { ArrowRight, Box, ShoppingCart, TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../UI/AppShell'
import Loading from '../Components/Loading'
import type { Product } from '../data/mockData'
import { subscribeProducts } from '../data/inventoryStore'
import { subscribeOrders, type Order } from '../data/orderStore'
import { usePageLoading } from '../hooks/usePageLoading'

const money = (value: number) =>
  value.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  })

const orderSummary = (order: Order) => {
  if (order.items.length === 0) return 'No items'
  if (order.items.length === 1) return order.items[0].productName
  return `${order.items[0].productName} +${order.items.length - 1} more`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const { isLoading, markReady } = usePageLoading(2, 2000)

  useEffect(() => {
    const unsubscribeProducts = subscribeProducts((productData) => {
      setProducts(productData)
      markReady('products')
    })
    const unsubscribeOrders = subscribeOrders((orderData) => {
      setOrders(orderData)
      markReady('orders')
    })

    return () => {
      unsubscribeProducts()
      unsubscribeOrders()
    }
  }, [markReady])

  const totalValue = orders.reduce((sum, order) => sum + order.total, 0)
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= product.minStock)
  const outOfStock = products.filter((product) => product.stock === 0)
  const pendingOrders = orders.filter((order) => !order.delivered)

  return (
    <AppShell>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/stock-movements')}
              className="rounded-xl bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800"
            >
              Quick Stock Movement
            </button>
            <button
              type="button"
              onClick={() => navigate('/products?tab=add')}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              + Add Product
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-600">Total Sold Amount</p>
            <p className="mt-2 text-4xl font-semibold">{money(totalValue)}</p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="mt-2 text-4xl font-semibold">{lowStock.length}</p>
              </div>
              <div className="rounded-xl bg-amber-100 p-3">
                <TriangleAlert size={20} className="text-amber-500" />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="mt-2 text-4xl font-semibold">{outOfStock.length}</p>
              </div>
              <div className="rounded-xl bg-red-100 p-3">
                <Box size={20} className="text-red-500" />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="mt-2 text-4xl font-semibold">{pendingOrders.length}</p>
              </div>
              <div className="rounded-xl bg-green-100 p-3">
                <ShoppingCart size={20} className="text-green-700" />
              </div>
            </div>
          </article>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Low Stock Alert</h2>
              <TriangleAlert size={18} className="text-amber-500" />
            </div>
            {lowStock.length === 0 ? (
              <p className="text-gray-500">No low stock items</p>
            ) : (
              <div className="space-y-4">
                {lowStock.slice(0, 4).map((product) => (
                  <div key={product.id} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{product.stock} units</p>
                      <p className="text-gray-500">Min: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Pending Orders</h2>
              <ShoppingCart size={18} className="text-green-700" />
            </div>
            {pendingOrders.length === 0 ? (
              <p className="text-gray-500">No pending orders</p>
            ) : (
              <div className="space-y-3">
                {pendingOrders.slice(0, 4).map((order) => (
                  <div key={order.id} className="rounded-xl border border-gray-200 p-3">
                    <p className="font-medium">{order.receiverName}</p>
                    <p className="text-sm text-gray-500">{orderSummary(order)}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/purchase-orders')}
                      className="mt-2 text-sm font-medium text-green-700 hover:text-green-800"
                    >
                      View order <ArrowRight size={14} className="inline" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
        </div>
      )}
    </AppShell>
  )
}
