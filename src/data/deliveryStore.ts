import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Order } from './orderStore'
import { updateOrder } from './orderStore'

export type DeliveryStatus = 'pending' | 'delivered'

export type DeliveryRecord = {
  id: string
  orderId: string
  orderNumber: string
  receiverName: string
  receiverPhone: string
  receiverEmail?: string
  deliveryLocation: string
  items: Order['items']
  total: number
  orderDate: string
  paid: boolean
  status: DeliveryStatus
  driverPhone?: string
  createdAt: string
  deliveredAt?: string
}

const deliveriesCollection = collection(db, 'deliveries')

const stripUndefined = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
}

const normalizeDelivery = (data: Partial<DeliveryRecord> & Record<string, unknown>, id: string): DeliveryRecord => {
  return {
    id,
    orderId: typeof data.orderId === 'string' ? data.orderId : id,
    orderNumber: typeof data.orderNumber === 'string' ? data.orderNumber : `ORD-${id.slice(0, 6)}`,
    receiverName: typeof data.receiverName === 'string' ? data.receiverName : 'Unknown Receiver',
    receiverPhone: typeof data.receiverPhone === 'string' ? data.receiverPhone : 'N/A',
    receiverEmail: typeof data.receiverEmail === 'string' ? data.receiverEmail : undefined,
    deliveryLocation: typeof data.deliveryLocation === 'string' ? data.deliveryLocation : 'Not provided',
    items: Array.isArray(data.items) ? (data.items as Order['items']) : [],
    total: Number(data.total ?? 0),
    orderDate: typeof data.orderDate === 'string' ? data.orderDate : '',
    paid: typeof data.paid === 'boolean' ? data.paid : false,
    status: data.status === 'delivered' ? 'delivered' : 'pending',
    driverPhone: typeof data.driverPhone === 'string' ? data.driverPhone : undefined,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    deliveredAt: typeof data.deliveredAt === 'string' ? data.deliveredAt : undefined,
  }
}

export const createPendingDeliveryFromOrder = async (order: Order) => {
  const payload: DeliveryRecord = {
    id: order.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    receiverName: order.receiverName,
    receiverPhone: order.receiverPhone,
    receiverEmail: order.receiverEmail,
    deliveryLocation: order.deliveryLocation ?? '',
    items: order.items,
    total: order.total,
    orderDate: order.orderDate,
    paid: order.paid,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  const { id, ...rest } = payload
  await setDoc(doc(deliveriesCollection, id), stripUndefined(rest), { merge: true })
}

export const syncDeliveryPaidStatus = async (orderId: string, paid: boolean) => {
  const deliveryRef = doc(deliveriesCollection, orderId)
  const snapshot = await getDoc(deliveryRef)
  if (!snapshot.exists()) {
    return
  }

  await setDoc(
    deliveryRef,
    {
      paid,
    },
    { merge: true },
  )
}

export const markDeliveryAsDelivered = async (orderId: string, driverPhone: string) => {
  await setDoc(
    doc(deliveriesCollection, orderId),
    stripUndefined({
      status: 'delivered',
      driverPhone: driverPhone.trim(),
      deliveredAt: new Date().toISOString(),
    }),
    { merge: true },
  )

  await updateOrder(orderId, { delivered: true })
}

export const subscribeDeliveries = (onChange: (items: DeliveryRecord[]) => void) => {
  return onSnapshot(deliveriesCollection, (snapshot) => {
    onChange(
      snapshot.docs.map((item) => ({
        ...normalizeDelivery(item.data() as Record<string, unknown>, item.id),
      })),
    )
  })
}
