'use client'

import { useState, useCallback } from 'react'

interface Notification {
  id: string
  message: string
  type: 'offer' | 'success' | 'info' | 'warning' | 'error'
  duration?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id)
    }, newNotification.duration)

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Pre-defined notification types for offers
  const showOfferReceived = useCallback((buyerName: string, amount: number) => {
    return addNotification({
      message: `New offer from ${buyerName} for ₹${amount.toLocaleString()}! 🎯`,
      type: 'offer',
      duration: 8000,
    })
  }, [addNotification])

  const showOfferAccepted = useCallback((productName: string) => {
    return addNotification({
      message: `Your offer for "${productName}" was accepted! 🎉`,
      type: 'success',
      duration: 6000,
    })
  }, [addNotification])

  const showOfferRejected = useCallback((productName: string) => {
    return addNotification({
      message: `Your offer for "${productName}" was declined. Try a different amount! 💭`,
      type: 'info',
      duration: 5000,
    })
  }, [addNotification])

  const showBargainSuccess = useCallback((savings: number) => {
    return addNotification({
      message: `Great bargain! You saved ₹${savings.toLocaleString()} 💰`,
      type: 'success',
      duration: 7000,
    })
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    // Pre-defined helpers
    showOfferReceived,
    showOfferAccepted,
    showOfferRejected,
    showBargainSuccess,
  }
}
