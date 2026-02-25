import { useEffect, useState } from 'react'
import { CheckCircle2, MapPin, X } from 'lucide-react'
import AppShell from '../UI/AppShell'
import { subscribeOrders, type Order } from '../data/orderStore'

const orderSummary = (order: Order) => {
  if (order.items.length === 0) return 'No items'
  if (order.items.length === 1) return order.items[0].productName
  return `${order.items[0].productName} +${order.items.length - 1} more`
}

export default function Delivery() {
  const [orders, setOrders] = useState<Order[]>([])
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null)

  useEffect(() => {
    return subscribeOrders((orderData) => {
      setOrders(orderData)
    })
  }, [])

  const deliveredOrders = orders.filter((order) => order.delivered)

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-5">
          <h1 className="text-4xl font-bold tracking-tight">Delivery</h1>
        </header>

        {deliveredOrders.length === 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            No delivered orders yet.
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {deliveredOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">{order.orderNumber}</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                  >
                    <CheckCircle2 size={14} />
                    Delivered
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Receiver:</span> {order.receiverName}
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span> {order.receiverPhone}
                  </p>
                  {order.receiverEmail && (
                    <p>
                      <span className="text-gray-500">Email:</span> {order.receiverEmail}
                    </p>
                  )}
                  <p>
                    <span className="text-gray-500">Items:</span> {orderSummary(order)}
                  </p>
                  <p>
                    <span className="text-gray-500">Total Units:</span> {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                  <p>
                    <span className="text-gray-500">Order Date:</span> {order.orderDate}
                  </p>
                  <p className="inline-flex items-center gap-1">
                    <MapPin size={14} className="text-green-600" />
                    <span className="text-gray-500">Delivered To:</span> {order.deliveryLocation}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                  >
                    Delivered
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingOrder(order)}
                    className="rounded-lg border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                  >
                    Track Order
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {trackingOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Track {trackingOrder.orderNumber}</h2>
              <button type="button" onClick={() => setTrackingOrder(null)} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-green-50 p-3 text-green-700">Order Created</div>
              <div className="rounded-lg bg-green-50 p-3 text-green-700">Payment Confirmed</div>
              <div className="rounded-lg bg-green-50 p-3 text-green-700">Out for Delivery</div>
              <div className="rounded-lg bg-green-100 p-3 font-semibold text-green-800">Delivered to {trackingOrder.deliveryLocation}</div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
