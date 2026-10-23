import React, { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Loader from '../components/Loader'
import api from './api'

/**
 * UserProtection
 * Wraps user-only routes. Validates the stored userToken against the backend.
 * - Loading  → shows <Loader />
 * - Valid    → renders <Outlet /> (the child route)
 * - Invalid  → redirects to /login with a toast error
 */
function UserProtection() {
  const [status, setStatus] = useState('checking') // 'checking' | 'valid' | 'invalid'

  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      const token = localStorage.getItem('userToken')

      if (!token) {
        if (isMounted) setStatus('invalid')
        return
      }

      try {
        await api.get('/auth/validate', {
          headers: {
            Authorization: `Bearer ${token}`,
            'auth-token': token,
          },
        })
        if (isMounted) setStatus('valid')
      } catch (err) {
        // Token is expired or invalid
        localStorage.removeItem('userToken')
        localStorage.removeItem('userData')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userName')
        const message =
          err.response?.data?.message || 'Session expired. Please log in again.'
        toast.error(message, { toastId: 'auth-session-expired' })
        if (isMounted) setStatus('invalid')
      }
    }

    validate()
    return () => {
      isMounted = false;
    }
  }, [])

  if (status === 'checking') return <Loader />
  if (status === 'valid')    return <Outlet />
  return <Navigate to="/login" replace />
}

export default UserProtection
