'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return { user, loading, supabase }
}

export function useUserRole() {
  const [role, setRole] = useState<'admin' | 'subadmin' | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    const getRole = async () => {
      if (!user) {
        setRole(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setRole(data.role as 'admin' | 'subadmin')
      }
      setLoading(false)
    }

    getRole()
  }, [user, supabase])

  return { role, loading, isAdmin: role === 'admin', isSubAdmin: role === 'subadmin' }
}
