import { useState } from 'react'
import './App.css'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
}

function App() {
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', name: 'Item A', price: 10.99, qty: 1 },
    { id: '2', name: 'Item B', price: 5.50, qty: 2 }
  ])
  const [couponCode, setCouponCode] = useState<string>('SAVE10')
  const [loading, setLoading] = useState<boolean>(false)
  const [response, setResponse] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleAddItem = () => {
    const newItem: CartItem = {
      id: `${Date.now()}-${Math.random()}`,
      name: '',
      price: 0,
      qty: 1
    }
    setItems([...items, newItem])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleItemChange = (id: string, field: keyof CartItem, value: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'name') {
          return { ...item, name: value }
        } else if (field === 'price') {
          return { ...item, price: parseFloat(value) || 0 }
        } else if (field === 'qty') {
          return { ...item, qty: parseInt(value) || 0 }
        }
      }
      return item
    }))
  }

  const validateItems = (): string | null => {
    if (items.length === 0) {
      return 'Cart is empty. Add at least one item.'
    }
    for (const item of items) {
      if (!item.name.trim()) {
        return 'All items must have a name.'
      }
      if (item.price < 0) {
        return 'Price cannot be negative.'
      }
      if (item.qty <= 0 || !Number.isInteger(item.qty)) {
        return 'Quantity must be a positive integer.'
      }
    }
    return null
  }

  const handleSimulate = async () => {
    setError('')
    setResponse('')

    const validationError = validateItems()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/pricing/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty
          })),
          couponCode: couponCode.trim()
        })
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json()
        setResponse(JSON.stringify(data, null, 2))
      } else {
        const text = await res.text()
        setResponse(text)
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Pricing Simulator</h1>
      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <h2>Cart Items</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Price</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Qty</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      style={{ width: '100%', padding: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                      style={{ width: '100%', padding: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                      style={{ width: '100%', padding: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => handleRemoveItem(item.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleAddItem}>Add Item</button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Coupon Code:
          </label>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            style={{ width: '200px', padding: '8px' }}
          />
        </div>

        <button onClick={handleSimulate} disabled={loading} style={{ padding: '10px 20px', fontSize: '16px' }}>
          {loading ? 'Simulating...' : 'Simulate Pricing'}
        </button>

        {error && (
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {response && (
          <pre style={{ textAlign: 'left', marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px', overflow: 'auto' }}>
            {response}
          </pre>
        )}
      </div>
    </>
  )
}

export default App
