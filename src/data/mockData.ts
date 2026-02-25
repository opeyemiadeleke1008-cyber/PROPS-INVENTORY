export type Product = {
  id: string
  name: string
  brand: string
  sku: string
  barcode: string
  category: string
  stock: number
  minStock: number
  cost: number
  price: number
}

export type Supplier = {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  leadTimeDays: number
  address: string
  notes: string
}

export const products: Product[] = [
  
]

export const suppliers: Supplier[] = [
  
]
