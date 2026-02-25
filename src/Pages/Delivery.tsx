import { useEffect, useState } from 'react'
import { CheckCircle2, MapPin, X } from 'lucide-react'
import AppShell from '../UI/AppShell'
import Loading from '../Components/Loading'
import { markDeliveryAsDelivered, subscribeDeliveries, type DeliveryRecord } from '../data/deliveryStore'
import { usePageLoading } from '../hooks/usePageLoading'

const orderSummary = (order: DeliveryRecord) => {
  if (order.items.length === 0) return 'No items'
  if (order.items.length === 1) return order.items[0].productName
  return `${order.items[0].productName} +${order.items.length - 1} more`
}

export default function Delivery() {
  const [orders, setOrders] = useState<DeliveryRecord[]>([])
  const [trackingOrder, setTrackingOrder] = useState<DeliveryRecord | null>(null)
  const [driverPhones, setDriverPhones] = useState<Record<string, string>>({})
  const [toast, setToast] = useState('')
  const { isLoading, markReady } = usePageLoading(1, 2000)

  useEffect(() => {
    return subscribeDeliveries((orderData) => {
      setOrders(orderData)
      markReady('deliveries')
    })
  }, [markReady])

  const markDelivered = async (order: DeliveryRecord) => {
    const phone = (driverPhones[order.id] ?? '').trim()
    if (!phone) {
      setToast('Enter driver number before marking delivered.')
      window.setTimeout(() => setToast(''), 1500)
      return
    }
    if (!order.paid) {
      setToast('Order must be marked paid first.')
      window.setTimeout(() => setToast(''), 1500)
      return
    }

    try {
      await markDeliveryAsDelivered(order.id, phone)
      setToast('Order marked as delivered.')
      window.setTimeout(() => setToast(''), 1500)
    } catch {
      setToast('Could not update delivery now. Try again.')
      window.setTimeout(() => setToast(''), 1500)
    }
  }

  return (
    <AppShell>
      {isLoading ? (
        <Loading />
      ) : (
        <>
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-5">
          <h1 className="text-4xl font-bold tracking-tight">Delivery</h1>
        </header>

        {orders.length === 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            No delivery orders yet.
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">{order.orderNumber}</h2>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    {order.status === 'delivered' ? 'Delivered' : 'Pending'}
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
                  <p>
                    <span className="text-gray-500">Payment:</span> {order.paid ? 'Paid' : 'Unpaid'}
                  </p>
                  <p className="inline-flex items-center gap-1">
                    <MapPin size={14} className="text-green-600" />
                    <span className="text-gray-500">Delivered To:</span> {order.deliveryLocation}
                  </p>
                  {order.driverPhone && (
                    <p>
                      <span className="text-gray-500">Driver Number:</span> {order.driverPhone}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {order.status !== 'delivered' && (
                    <>
                      <input
                        type="tel"
                        value={driverPhones[order.id] ?? ''}
                        onChange={(event) => setDriverPhones((current) => ({ ...current, [order.id]: event.target.value }))}
                        placeholder="Driver Number"
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-green-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          void markDelivered(order)
                        }}
                        className="rounded-lg border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                      >
                        Delivered
                      </button>
                    </>
                  )}
                  {order.status === 'delivered' && (
                    <button
                      type="button"
                      className="rounded-lg border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                    >
                      Delivered
                    </button>
                  )}
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
              <div className="rounded-lg bg-green-100 p-3 font-semibold text-green-800">
                {trackingOrder.status === 'delivered'
                  ? `Delivered to ${trackingOrder.deliveryLocation}`
                  : `Pending delivery to ${trackingOrder.deliveryLocation}`}
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed right-5 top-5 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">{toast}</div>
      )}
        </>
      )}
    </AppShell>
  )
}
