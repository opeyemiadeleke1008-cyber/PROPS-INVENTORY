import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Search, TriangleAlert } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import AppShell from '../UI/AppShell'
import type { Product } from '../data/mockData'
import { addMovement, saveProducts, subscribeProducts } from '../data/inventoryStore'

const formatMoney = (value: number) =>
  value.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  })

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [stockFilter, setStockFilter] = useState('All Stock Levels')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [formError, setFormError] = useState('')
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [cost, setCost] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [minStock, setMinStock] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [variants, setVariants] = useState<string[]>([''])

  useEffect(() => {
    return subscribeProducts((data) => {
      setProducts(data)
    })
  }, [])

  useEffect(() => {
    setShowAddPanel(searchParams.get('tab') === 'add')
  }, [searchParams])

  const categories = useMemo(() => {
    const values = new Set(products.map((product) => product.category))
    return ['All Categories', ...values]
  }, [products])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch = normalizedSearch.length === 0 || product.sku.toLowerCase().includes(normalizedSearch)
      const matchesCategory = categoryFilter === 'All Categories' || product.category === categoryFilter

      const isCritical = product.stock === 0
      const isLow = product.stock > 0 && product.stock <= product.minStock
      const matchesStock =
        stockFilter === 'All Stock Levels' ||
        (stockFilter === 'In Stock' && !isCritical && !isLow) ||
        (stockFilter === 'Low Stock' && isLow) ||
        (stockFilter === 'Out of Stock' && isCritical)

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [products, searchTerm, categoryFilter, stockFilter])

  const clearForm = () => {
    setSku('')
    setBarcode('')
    setName('')
    setCategory('')
    setBrand('')
    setCost('')
    setPrice('')
    setStock('')
    setMinStock('')
    setImageUrl('')
    setVariants([''])
    setFormError('')
  }

  const closeAddPanel = () => {
    clearForm()
    setSearchParams({})
  }

  const handleExportCsv = () => {
    if (filteredProducts.length === 0) {
      return
    }

    const rows = [
      ['SKU', 'Category', 'Price', 'Stock'],
      ...filteredProducts.map((product) => [product.sku, product.category, String(product.price), String(product.stock)]),
    ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'products-export.csv'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedSku = sku.trim().toUpperCase()
    if (!normalizedSku || !name.trim() || !category.trim() || !cost.trim() || !price.trim() || !stock.trim() || !minStock.trim()) {
      setFormError('Please complete all required fields.')
      return
    }

    const hasDuplicateSku = products.some((product) => product.sku.toLowerCase() === normalizedSku.toLowerCase())
    if (hasDuplicateSku) {
      setFormError('SKU already exists. Use a unique SKU.')
      return
    }

    const numericStock = Number(stock)
    const nextProduct: Product = {
      id: crypto.randomUUID(),
      sku: normalizedSku,
      barcode: barcode.trim(),
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim() || 'N/A',
      cost: Number(cost),
      price: Number(price),
      stock: numericStock,
      minStock: Number(minStock),
    }

    const nextProducts = [nextProduct, ...products]
    setProducts(nextProducts)
    await saveProducts(nextProducts)

    if (numericStock > 0) {
      await addMovement({
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        type: 'IN',
        productId: nextProduct.id,
        productName: nextProduct.name,
        sku: nextProduct.sku,
        qty: numericStock,
        note: 'Initial stock from add product',
      })
    }

    closeAddPanel()
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-bold tracking-tight">Products</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'add' })}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              + Add Product
            </button>
          </div>
        </header>

        <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-3">
          <div className="grid gap-3 lg:grid-cols-3">
            <label className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-gray-500">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by SKU..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option>All Stock Levels</option>
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-2">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isCritical = product.stock === 0
                  const isLow = product.stock > 0 && product.stock <= product.minStock

                  return (
                    <tr key={product.id} className="border border-gray-100">
                      <td className="px-4 py-3 font-medium">{product.sku}</td>
                      <td className="px-4 py-3 text-sm">{product.category}</td>
                      <td className="px-4 py-3 text-sm">{formatMoney(product.price)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={isCritical ? 'text-red-600' : ''}>{product.stock}</span>
                        {(isLow || isCritical) && <TriangleAlert size={14} className="ml-1 inline text-amber-500" />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-3 text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </section>
      </div>

      {showAddPanel && (
        <div className="fixed inset-0 z-40 bg-black/40 p-4 md:p-8">
          <div className="mx-auto h-full w-full max-w-5xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6">
            <button type="button" onClick={closeAddPanel} className="mb-3 inline-flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <ArrowLeft size={17} />
              Back
            </button>

            <h2 className="mb-6 text-4xl font-bold tracking-tight">Add New Product</h2>

            <form onSubmit={handleCreateProduct} className="space-y-4 rounded-2xl border border-gray-200 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">SKU *</span>
                  <input
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Barcode</span>
                  <input
                    value={barcode}
                    onChange={(event) => setBarcode(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Product Name *</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Category *</span>
                  <input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="e.g., Electronics, Clothing"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Brand</span>
                  <input
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Cost Price *</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={cost}
                    onChange={(event) => setCost(event.target.value)}
                    placeholder="NGN"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Selling Price *</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="NGN"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Current Stock *</span>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Low Stock Threshold *</span>
                  <input
                    type="number"
                    min={0}
                    value={minStock}
                    onChange={(event) => setMinStock(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-600"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">Image URL</span>
                <input
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-green-500 px-3 py-2 outline-none"
                />
              </label>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700">Product Variants</p>
                <p className="text-xs text-gray-500">Add variants like sizes or colors (e.g., S/M/L or Red/Blue/Green).</p>
                <div className="mt-3 space-y-2">
                  {variants.map((variant, index) => (
                    <input
                      key={`variant-${index}`}
                      value={variant}
                      onChange={(event) =>
                        setVariants((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                      }
                      placeholder="Variant"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setVariants((current) => [...current, ''])}
                  className="mt-2 text-sm font-medium text-green-600 hover:text-green-700"
                >
                  + Add Another Variant
                </button>
              </div>

              {formError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

              <div className="grid gap-3 pt-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={closeAddPanel}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
