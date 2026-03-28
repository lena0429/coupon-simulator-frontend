import { useState } from 'react'
import type React from 'react'
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

interface AgentDetail {
  type: 'money' | 'coupon' | 'text'
  label: string
  value?: number | string
  couponCode?: string
}

interface AgentExplanation {
  code: string
  summary: string
  details?: AgentDetail[]
}

interface CheckoutResult {
  subtotal?: number
  discount?: number
  total?: number
  [key: string]: unknown
}

interface CompareRow {
  couponCode?: string
  code?: string
  status?: string
  isValid?: boolean
  discount?: number
  total?: number
  finalPrice?: number
  message?: string
  isBest?: boolean
}

interface AgentResponse {
  explanation: AgentExplanation | null
  compare?: unknown
  chosenCoupon?: string
  finalResult?: CheckoutResult
}

function normalizeCompare(compare: unknown): CompareRow[] {
  if (Array.isArray(compare)) return compare as CompareRow[]
  if (compare && typeof compare === 'object') {
    const obj = compare as Record<string, unknown>
    if (Array.isArray(obj.results)) return obj.results as CompareRow[]
    if (Array.isArray(obj.coupons)) return obj.coupons as CompareRow[]
    if (Array.isArray(obj.comparisons)) return obj.comparisons as CompareRow[]
  }
  return []
}

function fmtCurrency(value: number | undefined | null): string {
  return typeof value === 'number' ? `$${value.toFixed(2)}` : '—'
}

function sortCompareRows(rows: CompareRow[]): CompareRow[] {
  const rank = (r: CompareRow) => r.isBest ? 0 : (r.status === 'valid' || r.isValid === true) ? 1 : 2
  return [...rows].sort((a, b) => rank(a) - rank(b))
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
                {agentResponse.explanation.details && agentResponse.explanation.details.length > 0 && (
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '14px' }}>
                    {agentResponse.explanation.details.map((detail, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>
                        <span style={{ fontWeight: 500 }}>{detail.label}:</span>{' '}
                        {detail.type === 'money' && (
                          typeof detail.value === 'number'
                            ? `$${detail.value.toFixed(2)}`
                            : detail.value
                        )}
                        {detail.type === 'coupon' && detail.couponCode}
                        {detail.type === 'text' && detail.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {(agentResponse.chosenCoupon !== undefined || agentResponse.finalResult !== undefined) && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f6fff6', border: '1px solid #b0d8b0', borderRadius: '4px' }}>
                <strong>Checkout Summary</strong>
                {agentResponse.chosenCoupon !== undefined && (
                  <p style={{ margin: '6px 0 0' }}>Chosen coupon: <code>{agentResponse.chosenCoupon}</code></p>
                )}
                {agentResponse.finalResult !== undefined && (
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '14px' }}>
                    {agentResponse.finalResult.subtotal !== undefined && (
                      <li>Subtotal: <strong>${agentResponse.finalResult.subtotal.toFixed(2)}</strong></li>
                    )}
                    {agentResponse.finalResult.discount !== undefined && (
                      <li>Discount: <strong>-${agentResponse.finalResult.discount.toFixed(2)}</strong></li>
                    )}
                    {agentResponse.finalResult.total !== undefined && (
                      <li>Total: <strong>${agentResponse.finalResult.total.toFixed(2)}</strong></li>
                    )}
                    {Object.entries(agentResponse.finalResult)
                      .filter(([k]) => !['subtotal', 'discount', 'total'].includes(k))
                      .map(([k, v]) => (
                        <li key={k}>{k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
                      ))
                    }
                  </ul>
                )}
              </div>
            )}

            {agentResponse.compare !== undefined && (() => {
              const rows = normalizeCompare(agentResponse.compare)
              if (rows.length === 0) return (
                <div>
                  <strong>Compare:</strong>
                  <pre style={{ marginTop: '6px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', overflow: 'auto' }}>
                    {JSON.stringify(agentResponse.compare, null, 2)}
                  </pre>
                </div>
              )
              const thStyle: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #ccc', whiteSpace: 'nowrap' }
              const tdBase: React.CSSProperties = { padding: '8px 12px', fontSize: '14px' }
              const sorted = sortCompareRows(rows)
              return (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Compare</strong>
                  <div style={{ overflowX: 'auto', marginTop: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Coupon</th>
                          <th style={thStyle}>Status</th>
                          <th style={thStyle}>Discount</th>
                          <th style={thStyle}>Total</th>
                          <th style={thStyle}>Message</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Best</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((row, i) => {
                          const isValid = row.status === 'valid' || row.isValid === true
                          const isBest = !!row.isBest
                          const rowStyle: React.CSSProperties = {
                            borderBottom: '1px solid #eee',
                            backgroundColor: isBest ? '#fffbe6' : 'transparent',
                            opacity: isValid ? 1 : 0.55,
                          }
                          const coupon = row.couponCode ?? row.code ?? '—'
                          const discount = fmtCurrency(row.discount)
                          const total = fmtCurrency(row.total ?? row.finalPrice)
                          const statusLabel = row.status ?? (row.isValid === true ? 'valid' : row.isValid === false ? 'invalid' : '—')
                          const statusColor = isValid ? '#2a7a2a' : '#999'
                          const statusBadge: React.CSSProperties = {
                            display: 'inline-block',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: isValid ? '#e6f4ea' : '#f0f0f0',
                            color: statusColor,
                          }
                          return (
                            <tr key={i} style={rowStyle}>
                              <td style={{ ...tdBase, fontFamily: 'monospace', fontWeight: isBest ? 600 : 400 }}>{coupon}</td>
                              <td style={tdBase}><span style={statusBadge}>{statusLabel}</span></td>
                              <td style={tdBase}>{discount}</td>
                              <td style={{ ...tdBase, fontWeight: isBest ? 600 : 400 }}>{total}</td>
                              <td style={{ ...tdBase, color: '#666', fontStyle: row.message ? 'normal' : 'italic' }}>
                                {row.message || '—'}
                              </td>
                              <td style={{ ...tdBase, textAlign: 'center', fontSize: '16px', color: '#c8a000' }}>{isBest ? '★' : ''}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
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
