import { collection, doc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

export type Order = {
  id: string
  orderNumber: string
  receiverName: string
  receiverPhone: string
  receiverEmail?: string
  items: Array<{
    productId: string
    productName: string
    sku: string
    category: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
  total: number
  orderDate: string
  deliveryLocation: string
  paid: boolean
  delivered: boolean
}

const ordersCollection = collection(db, 'orders')

const normalizeOrder = (order: Partial<Order> & Record<string, unknown>): Order => {
  const fallbackName =
    typeof order.receiverName === 'string'
      ? order.receiverName
      : typeof order.customerName === 'string'
        ? order.customerName
        : 'Unknown Receiver'

  const normalizedItems = Array.isArray(order.items)
    ? order.items
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null
          }

          const normalizedItem = item as Record<string, unknown>
          const quantity = Number(normalizedItem.quantity ?? 0)
          const unitPrice = Number(normalizedItem.unitPrice ?? 0)

          return {
            productId: String(normalizedItem.productId ?? ''),
            productName: String(normalizedItem.productName ?? ''),
            sku: String(normalizedItem.sku ?? ''),
            category: String(normalizedItem.category ?? ''),
            quantity,
            unitPrice,
            lineTotal: Number(normalizedItem.lineTotal ?? quantity * unitPrice),
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : []

  const fallbackQuantity = Number(order.quantity ?? 0)
  const fallbackUnitPrice = Number(order.unitPrice ?? 0)

  const fallbackItem =
    normalizedItems.length === 0 && typeof order.productName === 'string'
      ? [
          {
            productId: String(order.productId ?? ''),
            productName: String(order.productName ?? ''),
            sku: String(order.sku ?? ''),
            category: String(order.category ?? ''),
            quantity: fallbackQuantity,
            unitPrice: fallbackUnitPrice,
            lineTotal: fallbackQuantity * fallbackUnitPrice,
          },
        ]
      : []

  const finalItems = normalizedItems.length > 0 ? normalizedItems : fallbackItem

  return {
    id: String(order.id ?? crypto.randomUUID()),
    orderNumber: String(order.orderNumber ?? `ORD-${Date.now()}`),
    receiverName: fallbackName,
    receiverPhone: typeof order.receiverPhone === 'string' ? order.receiverPhone : 'N/A',
    receiverEmail: typeof order.receiverEmail === 'string' ? order.receiverEmail : undefined,
    items: finalItems,
    total: finalItems.reduce((sum, item) => sum + item.lineTotal, Number(order.total ?? 0)),
    orderDate: String(order.orderDate ?? ''),
    deliveryLocation: String(order.deliveryLocation ?? ''),
    paid: typeof order.paid === 'boolean' ? order.paid : false,
    delivered: typeof order.delivered === 'boolean' ? order.delivered : false,
  }
}

export const getOrders = async () => {
  const snapshot = await getDocs(ordersCollection)
  return snapshot.docs.map((item) => normalizeOrder({ id: item.id, ...(item.data() as Record<string, unknown>) }))
}

export const saveOrders = async (orders: Order[]) => {
  const batch = writeBatch(db)
  const snapshot = await getDocs(ordersCollection)

  const nextIds = new Set(orders.map((item) => item.id))

  snapshot.docs.forEach((item) => {
    if (!nextIds.has(item.id)) {
      batch.delete(item.ref)
    }
  })

  orders.forEach((item) => {
    const { id, ...rest } = item
    batch.set(doc(ordersCollection, id), rest)
  })

  await batch.commit()
}

export const addOrder = async (order: Order) => {
  const { id, ...rest } = order
  await setDoc(doc(ordersCollection, id), rest)
  return getOrders()
}

export const subscribeOrders = (onChange: (orders: Order[]) => void) => {
  return onSnapshot(ordersCollection, (snapshot) => {
    onChange(snapshot.docs.map((item) => normalizeOrder({ id: item.id, ...(item.data() as Record<string, unknown>) })))
  })
}
