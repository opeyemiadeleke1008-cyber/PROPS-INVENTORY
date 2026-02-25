import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../UI/AppShell'
import type { Product } from '../data/mockData'
import { addMovement, saveProducts, subscribeProducts } from '../data/inventoryStore'
import { addOrder, saveOrders, subscribeOrders, type Order } from '../data/orderStore'

type DocumentKind = 'invoice' | 'receipt'
type DraftItem = { productId: string; quantity: string }

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

const makeDocImage = (order: Order, kind: DocumentKind) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 760
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#166534'
  ctx.font = '700 36px Arial'
  ctx.fillText(kind === 'invoice' ? 'INVOICE' : 'RECEIPT', 40, 60)

  ctx.fillStyle = '#374151'
  ctx.font = '18px Arial'
  ctx.fillText(`Order Number: ${order.orderNumber}`, 40, 105)
  ctx.fillText(`Receiver: ${order.receiverName}`, 40, 135)
  ctx.fillText(`Phone: ${order.receiverPhone}`, 40, 165)
  if (order.receiverEmail) {
    ctx.fillText(`Email: ${order.receiverEmail}`, 40, 195)
  }
  ctx.fillText(`Date: ${order.orderDate}`, 40, 225)
  ctx.fillText(`Delivery Location: ${order.deliveryLocation}`, 40, 255)

  ctx.strokeStyle = '#d1d5db'
  ctx.strokeRect(40, 285, 920, 380)

  ctx.fillStyle = '#111827'
  ctx.font = '700 20px Arial'
  ctx.fillText('Order Items', 60, 320)

  ctx.font = '16px Arial'
  let y = 350
  order.items.slice(0, 10).forEach((item, index) => {
    ctx.fillText(`${index + 1}. ${item.productName} (${item.sku})`, 60, y)
    ctx.fillText(`Qty: ${item.quantity} x ${money(item.unitPrice)} = ${money(item.lineTotal)}`, 520, y)
    y += 30
  })

  if (order.items.length > 10) {
    ctx.fillText(`...and ${order.items.length - 10} more items`, 60, y)
  }

  ctx.fillStyle = '#166534'
  ctx.font = '700 28px Arial'
  ctx.fillText(`${kind === 'invoice' ? 'Amount Due' : 'Amount Paid'}: ${money(order.total)}`, 60, 640)

  return canvas.toDataURL('image/png')
}

const downloadImage = (order: Order, kind: DocumentKind) => {
  const dataUrl = makeDocImage(order, kind)
  if (!dataUrl) return

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${order.orderNumber.toLowerCase()}-${kind}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function PurchaseOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null)
  const [previewKind, setPreviewKind] = useState<DocumentKind>('invoice')
  const [previewImage, setPreviewImage] = useState('')

  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverEmail, setReceiverEmail] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [draftItems, setDraftItems] = useState<DraftItem[]>([{ productId: '', quantity: '1' }])
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const unsubscribeProducts = subscribeProducts((storedProducts) => {
      setProducts(storedProducts)
      if (storedProducts.length > 0) {
        setDraftItems((current) => {
          if (current.length === 0 || !storedProducts.some((product) => product.id === current[0].productId)) {
            return [{ productId: storedProducts[0].id, quantity: '1' }]
          }
          return current
        })
      }
    })

    const unsubscribeOrders = subscribeOrders((storedOrders) => {
      setOrders(storedOrders)
    })

    return () => {
      unsubscribeProducts()
      unsubscribeOrders()
    }
  }, [])

  const statusLabel = (order: Order) => {
    if (order.delivered) return 'Delivered'
    if (order.paid) return 'Paid'
    return 'Pending'
  }

  const statusClass = (order: Order) => {
    if (order.delivered) return 'bg-green-100 text-green-700'
    if (order.paid) return 'bg-emerald-100 text-emerald-700'
    return 'bg-amber-100 text-amber-700'
  }

  const updateDraftItem = (index: number, value: Partial<DraftItem>) => {
    setDraftItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item)))
  }

  const addDraftItem = () => {
    const fallbackProductId = products[0]?.id ?? ''
    setDraftItems((current) => [...current, { productId: fallbackProductId, quantity: '1' }])
  }

  const removeDraftItem = (index: number) => {
    setDraftItems((current) => (current.length <= 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)))
  }

  const handleCreateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!receiverName.trim() || !receiverPhone.trim() || !deliveryLocation.trim()) {
      setFormError('Please fill required fields.')
      return
    }

    if (draftItems.length === 0) {
      setFormError('Add at least one product.')
      return
    }

    const quantityByProduct = new Map<string, number>()

    for (const item of draftItems) {
      if (!item.productId) {
        setFormError('Select a product for every order line.')
        return
      }

      const qty = Number(item.quantity)
      if (!qty || qty < 1) {
        setFormError('Each quantity must be at least 1.')
        return
      }

      quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + qty)
    }

    for (const [productId, qty] of quantityByProduct.entries()) {
      const product = products.find((candidate) => candidate.id === productId)
      if (!product) {
        setFormError('One or more selected products are invalid.')
        return
      }
      if (product.stock < qty) {
        setFormError(`Not enough stock for ${product.name}. Available: ${product.stock}`)
        return
      }
    }

    const orderItems = Array.from(quantityByProduct.entries()).map(([productId, qty]) => {
      const product = products.find((candidate) => candidate.id === productId) as Product
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        quantity: qty,
        unitPrice: product.price,
        lineTotal: qty * product.price,
      }
    })

    const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)

    const now = new Date()
    const nextOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber: `ORD-${now.getFullYear()}-${String(Date.now()).slice(-5)}`,
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverEmail: receiverEmail.trim() || undefined,
      items: orderItems,
      total,
      orderDate: now.toISOString().slice(0, 10),
      deliveryLocation: deliveryLocation.trim(),
      paid: false,
      delivered: false,
    }

    const nextProducts = products.map((product) => {
      const qty = quantityByProduct.get(product.id)
      if (!qty) return product
      return {
        ...product,
        stock: product.stock - qty,
      }
    })

    await saveProducts(nextProducts)
    setProducts(nextProducts)

    for (const item of orderItems) {
      await addMovement({
        id: crypto.randomUUID(),
        date: nextOrder.orderDate,
        type: 'OUT',
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        qty: item.quantity,
        note: `Order sold to ${nextOrder.receiverName}`,
      })
    }

    setOrders(await addOrder(nextOrder))
    setReceiverName('')
    setReceiverPhone('')
    setReceiverEmail('')
    setDeliveryLocation('')
    setDraftItems([{ productId: products[0]?.id ?? '', quantity: '1' }])
    setFormError('')
    setShowCreateModal(false)
  }

  const togglePaid = async (id: string) => {
    const next = orders.map((order) => {
      if (order.id !== id || order.delivered) return order
      return { ...order, paid: !order.paid }
    })
    setOrders(next)
    await saveOrders(next)
  }

  const markDelivered = async (id: string) => {
    const next = orders.map((order) => {
      if (order.id !== id || !order.paid) return order
      return { ...order, delivered: true }
    })
    setOrders(next)
    await saveOrders(next)
  }

  const openPreview = (order: Order, kind: DocumentKind) => {
    setPreviewOrder(order)
    setPreviewKind(kind)
    setPreviewImage(makeDocImage(order, kind))
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-bold tracking-tight">Orders</h1>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + Create Order
          </button>
        </header>

        {products.length === 0 && (
          <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No products yet. Add products first before creating orders.
            <button
              type="button"
              onClick={() => navigate('/products?tab=add')}
              className="ml-2 font-semibold text-green-700 hover:text-green-800"
            >
              Add Product
            </button>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {orders.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <ShoppingCart size={38} className="mb-3 text-gray-400" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Receiver</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.orderDate}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p>{order.receiverName}</p>
                        <p className="text-xs text-gray-500">{order.receiverPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p>{orderSummary(order)}</p>
                        <p className="text-xs text-gray-500">{order.items.length} item(s)</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`rounded-lg px-3 py-1 text-xs font-medium ${statusClass(order)}`}>{statusLabel(order)}</span>
                        {order.delivered && <CheckCircle2 size={15} className="ml-2 inline text-green-600" />}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{money(order.total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void togglePaid(order.id)
                            }}
                            className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                              order.paid ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                            }`}
                          >
                            {order.paid ? 'Mark Unpaid' : 'Mark Paid'}
                          </button>

                          {order.paid && !order.delivered && (
                            <button
                              type="button"
                              onClick={() => {
                                void markDelivered(order.id)
                              }}
                              className="rounded-lg border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                            >
                              Delivered
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openPreview(order, 'invoice')}
                            className="rounded-lg border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                          >
                            Create Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => openPreview(order, 'receipt')}
                            className="rounded-lg border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                          >
                            Generate Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Create Order</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(event) => void handleCreateOrder(event)} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-600">Receiver Name</span>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(event) => setReceiverName(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-gray-600">Receiver Number</span>
                  <input
                    type="tel"
                    value={receiverPhone}
                    onChange={(event) => setReceiverPhone(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Receiver Email (Optional)</span>
                <input
                  type="email"
                  value={receiverEmail}
                  onChange={(event) => setReceiverEmail(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Delivery Location</span>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(event) => setDeliveryLocation(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                  required
                />
              </label>

              <div className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Order Items</p>
                  <button
                    type="button"
                    onClick={addDraftItem}
                    className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
                  >
                    <Plus size={14} />
                    Add Product
                  </button>
                </div>

                <div className="space-y-2">
                  {draftItems.map((item, index) => (
                    <div key={`draft-item-${index}`} className="grid gap-2 md:grid-cols-[1fr_120px_36px]">
                      <select
                        value={item.productId}
                        onChange={(event) => updateDraftItem(index, { productId: event.target.value })}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
                        required
                      >
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku}) - Stock: {product.stock}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateDraftItem(index, { quantity: event.target.value })}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => removeDraftItem(index)}
                        className="rounded-xl border border-gray-300 text-gray-500 hover:bg-gray-50"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} className="mx-auto" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Create Order
              </button>
            </form>
          </div>
        </div>
      )}

      {previewOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{previewKind === 'invoice' ? 'Invoice Preview' : 'Receipt Preview'}</h2>
              <button type="button" onClick={() => setPreviewOrder(null)} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            {previewImage && <img src={previewImage} alt="Preview document" className="w-full rounded-xl border border-gray-200" />}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => downloadImage(previewOrder, previewKind)}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Download {previewKind === 'invoice' ? 'Invoice' : 'Receipt'}
              </button>
              <button
                type="button"
                onClick={() => setPreviewOrder(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
