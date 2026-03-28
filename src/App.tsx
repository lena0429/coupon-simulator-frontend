import { useState } from 'react'
import './App.css'

type AgentIntent =
  | 'apply_best_coupon_and_simulate_checkout'
  | 'simulate_checkout_without_coupon'
  | 'explain_best_coupon'
  | 'compare_coupons'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
}

interface AgentExplanation {
  code: string
  summary: string
  details?: unknown[]
}

interface AgentResponse {
  explanation: AgentExplanation | null
  compare?: unknown
}

const INTENTS: AgentIntent[] = [
  'apply_best_coupon_and_simulate_checkout',
  'simulate_checkout_without_coupon',
  'explain_best_coupon',
  'compare_coupons',
]

function App() {
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', name: 'Item A', price: 10.99, qty: 1 },
    { id: '2', name: 'Item B', price: 5.50, qty: 2 }
  ])
  const [couponCodes, setCouponCodes] = useState<string[]>(['SAVE10'])
  const [intent, setIntent] = useState<AgentIntent>('apply_best_coupon_and_simulate_checkout')
  const [loading, setLoading] = useState<boolean>(false)
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null)
  const [rawResponse, setRawResponse] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Cart handlers
  const handleAddItem = () => {
    setItems([...items, {
      id: `${Date.now()}-${Math.random()}`,
      name: '',
      price: 0,
      qty: 1
    }])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleItemChange = (id: string, field: keyof CartItem, value: string) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      if (field === 'name') return { ...item, name: value }
      if (field === 'price') return { ...item, price: parseFloat(value) || 0 }
      if (field === 'qty') return { ...item, qty: parseInt(value) || 0 }
      return item
    }))
  }

  // Coupon handlers
  const handleAddCoupon = () => setCouponCodes([...couponCodes, ''])
  const handleRemoveCoupon = (index: number) => setCouponCodes(couponCodes.filter((_, i) => i !== index))
  const handleCouponChange = (index: number, value: string) => {
    setCouponCodes(couponCodes.map((c, i) => i === index ? value : c))
  }

  const validate = (): string | null => {
    if (items.length === 0) return 'Cart is empty. Add at least one item.'
    for (const item of items) {
      if (!item.name.trim()) return 'All items must have a name.'
      if (item.price < 0) return 'Price cannot be negative.'
      if (item.qty <= 0 || !Number.isInteger(item.qty)) return 'Quantity must be a positive integer.'
    }
    if (couponCodes.some(c => !c.trim())) return 'Coupon code entries cannot be blank. Remove empty rows or fill them in.'
    return null
  }

  const handleRun = async () => {
    setError('')
    setAgentResponse(null)
    setRawResponse('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          cartItems: items.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
          couponCodes: couponCodes.map(c => c.trim()).filter(Boolean)
        })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

      const contentType = res.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const data = await res.json()
        setRawResponse(JSON.stringify(data, null, 2))
        if (data && ('explanation' in data || 'compare' in data)) {
          setAgentResponse(data as AgentResponse)
        }
      } else {
        setRawResponse(await res.text())
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Coupon Simulator</h1>
      <div className="card">

        {/* Cart Items */}
        <div style={{ marginBottom: '24px' }}>
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
                      onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                      style={{ width: '100%', padding: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={e => handleItemChange(item.id, 'price', e.target.value)}
                      style={{ width: '100%', padding: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={e => handleItemChange(item.id, 'qty', e.target.value)}
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

        {/* Coupon Codes */}
        <div style={{ marginBottom: '24px' }}>
          <h2>Coupon Codes</h2>
          {couponCodes.map((code, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <input
                type="text"
                value={code}
                onChange={e => handleCouponChange(index, e.target.value)}
                style={{ padding: '6px', width: '200px' }}
              />
              <button onClick={() => handleRemoveCoupon(index)}>Remove</button>
            </div>
          ))}
          <button onClick={handleAddCoupon}>Add Coupon Code</button>
        </div>

        {/* Intent */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
            Intent:
          </label>
          <select
            value={intent}
            onChange={e => setIntent(e.target.value as AgentIntent)}
            style={{ padding: '8px', minWidth: '320px' }}
          >
            {INTENTS.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          {loading ? 'Running...' : 'Run Agent'}
        </button>

        {error && (
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {/* Structured AgentResponse */}
        {agentResponse && (
          <div style={{ marginTop: '24px', textAlign: 'left' }}>
            {agentResponse.explanation && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f8ff', border: '1px solid #c0d8f0', borderRadius: '4px' }}>
                <strong>{agentResponse.explanation.code}</strong>
                <p style={{ margin: '6px 0 0' }}>{agentResponse.explanation.summary}</p>
                {agentResponse.explanation.details && (
                  <pre style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f4fb', borderRadius: '4px', overflow: 'auto', fontSize: '13px' }}>
                    {JSON.stringify(agentResponse.explanation.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
            {agentResponse.compare !== undefined && (
              <div>
                <strong>Compare:</strong>
                <pre style={{ marginTop: '6px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', overflow: 'auto' }}>
                  {JSON.stringify(agentResponse.compare, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Raw JSON fallback */}
        {rawResponse && !agentResponse && (
          <pre style={{ textAlign: 'left', marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px', overflow: 'auto' }}>
            {rawResponse}
          </pre>
        )}

      </div>
    </>
  )
}

export default App
