import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, writeBatch } from 'firebase/firestore'
import type { Product } from './mockData'
import { db } from '../firebase'

export type MovementType = 'IN' | 'OUT'

export type StockMovement = {
  id: string
  date: string
  type: MovementType
  productId: string
  productName: string
  sku: string
  qty: number
  note: string
}

const productsCollection = collection(db, 'products')
const movementsCollection = collection(db, 'stock_movements')

const toProduct = (id: string, data: Omit<Product, 'id'>): Product => ({ id, ...data })

export const getProducts = async () => {
  const snapshot = await getDocs(query(productsCollection, orderBy('name')))
  return snapshot.docs.map((item) => toProduct(item.id, item.data() as Omit<Product, 'id'>))
}

export const saveProducts = async (products: Product[]) => {
  const batch = writeBatch(db)
  const snapshot = await getDocs(productsCollection)

  const nextIds = new Set(products.map((item) => item.id))

  snapshot.docs.forEach((item) => {
    if (!nextIds.has(item.id)) {
      batch.delete(item.ref)
    }
  })

  products.forEach((item) => {
    const { id, ...rest } = item
    batch.set(doc(productsCollection, id), rest)
  })

  await batch.commit()
}

export const getMovements = async () => {
  const snapshot = await getDocs(query(movementsCollection, orderBy('date', 'desc')))
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<StockMovement, 'id'>) }))
}

export const saveMovements = async (movements: StockMovement[]) => {
  const batch = writeBatch(db)
  const snapshot = await getDocs(movementsCollection)
  const nextIds = new Set(movements.map((item) => item.id))

  snapshot.docs.forEach((item) => {
    if (!nextIds.has(item.id)) {
      batch.delete(item.ref)
    }
  })

  movements.forEach((item) => {
    const { id, ...rest } = item
    batch.set(doc(movementsCollection, id), rest)
  })

  await batch.commit()
}

export const addMovement = async (movement: StockMovement) => {
  const { id, ...rest } = movement
  await setDoc(doc(movementsCollection, id), rest)
  const all = await getMovements()
  return all
}

export const subscribeProducts = (onChange: (products: Product[]) => void) => {
  const productsQuery = query(productsCollection, orderBy('name'))
  return onSnapshot(productsQuery, (snapshot) => {
    onChange(snapshot.docs.map((item) => toProduct(item.id, item.data() as Omit<Product, 'id'>)))
  })
}

export const subscribeMovements = (onChange: (movements: StockMovement[]) => void) => {
  const movementsQuery = query(movementsCollection, orderBy('date', 'desc'))
  return onSnapshot(movementsQuery, (snapshot) => {
    onChange(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<StockMovement, 'id'>) })))
  })
}
