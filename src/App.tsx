import { useState } from 'react'
import './App.css'

function App() {
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const checkBackendHealth = async () => {
    setLoading(true)
    setResponse('')

    try {
      const res = await fetch("/api/health")
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Coupon Simulator Frontend</h1>
      <div className="card">
        <button onClick={checkBackendHealth} disabled={loading}>
          {loading ? 'Checking...' : 'Check Backend Health'}
        </button>
        {response && (
          <pre style={{ textAlign: 'left', marginTop: '20px' }}>
            {response}
          </pre>
        )}
      </div>
    </>
  )
}

export default App
