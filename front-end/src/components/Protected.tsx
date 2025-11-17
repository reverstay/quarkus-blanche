import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Protected({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true)
  const [isAuthed, setAuthed] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session); setLoading(false)
    })
  }, [])
  if (loading) return null
  return isAuthed ? children : <Navigate to="/login" replace />
}
