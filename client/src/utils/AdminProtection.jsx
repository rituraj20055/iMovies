import React, { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Loader from '../components/Loader'
import api from './api'

/**
 * AdminProtection
 * Wraps admin-only routes. Validates the stored adminToken against the backend.
 * - Loading  → shows <Loader />
 * - Valid    → renders <Outlet /> (the child route)
 * - Invalid  → redirects to /login with a toast error
 */
function AdminProtection() {
  const [status, setStatus] = useState('checking') // 'checking' | 'valid' | 'invalid'

  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      const token = localStorage.getItem('adminToken')

      if (!token) {
        if (isMounted) setStatus('invalid')
        return
      }

      try {
        await api.get('/auth/admin/validate', {
          headers: {
            Authorization: `Bearer ${token}`,
            'auth-token': token,
          },
        })
        if (isMounted) setStatus('valid')
      } catch (err) {
        // Token is expired, invalid, or user lacks admin privileges
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminData')
        localStorage.removeItem('adminEmail')
        localStorage.removeItem('adminName')
        const message =
          err.response?.data?.message ||
          'Admin session expired or unauthorized. Please log in again.'
        toast.error(message, { toastId: 'admin-protection-expired' })
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
  return <Navigate to="/admin-login" replace />
}

export default AdminProtection
