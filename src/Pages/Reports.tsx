import { useEffect, useMemo, useState } from 'react'
import AppShell from '../UI/AppShell'
import Loading from '../Components/Loading'
import { subscribeOrders, type Order } from '../data/orderStore'
import { usePageLoading } from '../hooks/usePageLoading'

const money = (value: number) =>
  value.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  })

export default function Reports() {
  const [orders, setOrders] = useState<Order[]>([])
  const { isLoading, markReady } = usePageLoading(1, 2000)

  useEffect(() => {
    return subscribeOrders((data) => {
      setOrders(data)
      markReady('orders')
    })
  }, [markReady])

  const salesByCategory = useMemo(
    () =>
      Array.from(
        orders
          .flatMap((order) => order.items)
          .reduce((map, item) => {
            const current = map.get(item.category) ?? { category: item.category, orders: 0, quantity: 0, revenue: 0 }
            current.orders += 1
            current.quantity += item.quantity
            current.revenue += item.lineTotal
            map.set(item.category, current)
            return map
          }, new Map<string, { category: string; orders: number; quantity: number; revenue: number }>())
          .values(),
      ).sort((a, b) => b.quantity - a.quantity),
    [orders],
  )

  const maxQty = Math.max(...salesByCategory.map((item) => item.quantity), 1)

  return (
    <AppShell>
      {isLoading ? (
        <Loading />
      ) : (
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-5">
          <h1 className="text-4xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-gray-500">Top selling categories based on admin-created orders.</p>
        </header>

        {salesByCategory.length === 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            No order data yet. Reports will appear after admin creates orders.
          </section>
        ) : (
          <>
            <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="mb-4 text-2xl font-semibold">Categories Selling Most</h2>
              <div className="space-y-3">
                {salesByCategory.map((item) => {
                  const widthPercent = Math.max((item.quantity / maxQty) * 100, 2)
                  return (
                    <div key={item.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{item.category}</span>
                        <span>{item.quantity} sold</span>
                      </div>
                      <div className="h-6 rounded-md bg-gray-100">
                        <div className="h-6 rounded-md bg-green-600" style={{ width: `${widthPercent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Order Lines</th>
                    <th className="px-4 py-3">Units Sold</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByCategory.map((item) => (
                    <tr key={item.category} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 py-3 text-sm">{item.category}</td>
                      <td className="px-4 py-3 text-sm">{item.orders}</td>
                      <td className="px-4 py-3 text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{money(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
      )}
    </AppShell>
  )
}
