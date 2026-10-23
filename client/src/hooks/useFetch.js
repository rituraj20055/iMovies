import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

/**
 * useFetch – Generic data-fetching hook backed by the configured Axios instance.
 *
 * @param {string} url     - API path (relative to base URL, e.g. '/movies')
 * @param {object} options - Optional Axios request config (params, headers, etc.)
 * @returns {{ data, loading, error, refetch }}
 *
 * Usage:
 *   const { data, loading, error, refetch } = useFetch('/movies', { params: { genre: 'action' } })
 */
const useFetch = (url, options = {}) => {
  const [data,    setData   ] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError  ] = useState(null)

  /**
   * fetchData is memoised with useCallback so the effect only re-runs when the
   * URL changes (options object reference is intentionally excluded – callers
   * should pass stable refs or primitives if they need reactive re-fetching).
   */
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get(url, options)
      setData(response.data)
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => {
    if (url) fetchData()
  }, [fetchData, url])

  return { data, loading, error, refetch: fetchData }
}

export default useFetch
