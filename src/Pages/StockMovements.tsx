import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../UI/AppShell'
import Loading from '../Components/Loading'
import type { Product } from '../data/mockData'
import { addMovement, saveProducts, subscribeMovements, subscribeProducts, type MovementType, type StockMovement } from '../data/inventoryStore'
import { usePageLoading } from '../hooks/usePageLoading'

export default function StockMovements() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [movementType, setMovementType] = useState<MovementType>('IN')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')
  const { isLoading, markReady } = usePageLoading(2, 2000)

  useEffect(() => {
    const unsubscribeProducts = subscribeProducts((storedProducts) => {
      setProducts(storedProducts)
      if (storedProducts.length > 0 && !storedProducts.some((product) => product.id === productId)) {
        setProductId(storedProducts[0].id)
      }
      markReady('products')
    })

    const unsubscribeMovements = subscribeMovements((storedMovements) => {
      setMovements(storedMovements)
      markReady('movements')
    })

    return () => {
      unsubscribeProducts()
      unsubscribeMovements()
    }
  }, [markReady, productId])

  const selectedProduct = useMemo(() => products.find((product) => product.id === productId) ?? null, [products, productId])

  const handleRecordMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const selected = products.find((product) => product.id === productId)
    const numericQty = Number(quantity)
    if (!selected || !numericQty || numericQty <= 0) {
      setFormError('Please choose a product and enter a valid quantity.')
      return
    }

    if (movementType === 'OUT' && selected.stock < numericQty) {
      setFormError('Not enough stock for this outgoing movement.')
      return
    }

    const nextProducts = products.map((product) => {
      if (product.id !== selected.id) {
        return product
      }

      return {
        ...product,
        stock: movementType === 'IN' ? product.stock + numericQty : product.stock - numericQty,
      }
    })

    await saveProducts(nextProducts)
    setProducts(nextProducts)

    const nextMovement: StockMovement = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      type: movementType,
      productId: selected.id,
      productName: selected.name,
      sku: selected.sku,
      qty: numericQty,
      note: note.trim() || (movementType === 'IN' ? 'Goods received' : 'Goods sold'),
    }

    const nextMovements = await addMovement(nextMovement)
    setMovements(nextMovements)
    setMovementType('IN')
    setQuantity('1')
    setNote('')
    setFormError('')
    setShowRecordModal(false)
  }

  return (
    <AppShell>
      {isLoading ? (
        <Loading />
      ) : (
        <>
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-bold tracking-tight">Stock Movements</h1>
          <button
            type="button"
            onClick={() => {
              if (products.length === 0) {
                navigate('/products?tab=add')
                return
              }
              setShowRecordModal(true)
            }}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + Record Movement
          </button>
        </header>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-gray-200 bg-stone-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => {
                  const isIn = movement.type === 'IN'

                  return (
                    <tr key={movement.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 py-3 text-sm">{movement.date}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                            isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isIn ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {movement.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p>{movement.productName}</p>
                        <p className="text-xs text-gray-500">{movement.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{movement.qty}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{movement.note}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {products.length === 0 && (
          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No products yet. Add products before recording movement.
            <button
              type="button"
              onClick={() => navigate('/products?tab=add')}
              className="ml-2 font-semibold text-green-700 hover:text-green-800"
            >
              Add Product
            </button>
          </section>
        )}
      </div>

      {showRecordModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Record Movement</h2>
              <button type="button" onClick={() => setShowRecordModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Movement Type</span>
                <select
                  value={movementType}
                  onChange={(event) => setMovementType(event.target.value as MovementType)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                >
                  <option value="IN">Goods In (Brought In)</option>
                  <option value="OUT">Goods Out (Sold)</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Product</span>
                <select
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </label>

              {selectedProduct && <p className="text-xs text-gray-500">Current stock: {selectedProduct.stock}</p>}

              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Quantity</span>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Note</span>
                <input
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional note"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                />
              </label>

              {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Save Movement
              </button>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </AppShell>
  )
}
