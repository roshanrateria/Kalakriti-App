'use client'

import React, { useState, useEffect } from 'react'
import { Gift, TrendingDown, Sparkles, X } from 'lucide-react'
import { TranslatedText } from '@/components/TranslatedText'

interface FloatingNotificationProps {
  message: string
  type: 'offer' | 'success' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function FloatingNotification({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 5000 
}: FloatingNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!isVisible) return null

  const getThemeClasses = () => {
    switch (type) {
      case 'offer':
        return 'from-green-500 to-emerald-500 border-green-300'
      case 'success':
        return 'from-blue-500 to-cyan-500 border-blue-300'
      case 'info':
        return 'from-purple-500 to-pink-500 border-purple-300'
      default:
        return 'from-gray-500 to-gray-600 border-gray-300'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'offer':
        return <TrendingDown className="w-5 h-5" />
      case 'success':
        return <Gift className="w-5 h-5" />
      case 'info':
        return <Sparkles className="w-5 h-5" />
      default:
        return <Sparkles className="w-5 h-5" />
    }
  }

  return (
    <div className={`
      fixed top-20 right-6 z-[100] transform transition-all duration-300 ease-out
      ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className={`
        bg-gradient-to-r ${getThemeClasses()} text-white rounded-2xl shadow-2xl border-2
        p-4 max-w-sm min-w-[300px] backdrop-blur-sm
        animate-bounce-gentle relative overflow-hidden
      `}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent transform rotate-45 animate-pulse"></div>
        </div>
        
        <div className="relative z-10 flex items-start space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-relaxed">
              <TranslatedText text={message} />
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
          <div className="h-full bg-white/60 animate-progress-bar origin-left"></div>
        </div>
      </div>
    </div>
  )
}
