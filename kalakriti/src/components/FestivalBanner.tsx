'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import { TranslatedText } from './TranslatedText'
import Link from 'next/link'

interface FestivalInfo {
  name: string
  date: Date
  daysUntil: number
  emoji: string
  tag: string
}

export default function FestivalBanner() {
  const [upcomingFestival, setUpcomingFestival] = useState<FestivalInfo | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const festival = getUpcomingFestival()
    if (festival && festival.daysUntil <= 30) {
      setUpcomingFestival(festival)
      
      // Check if banner was dismissed today
      const dismissedDate = localStorage.getItem('festivalBannerDismissed')
      if (dismissedDate === new Date().toDateString()) {
        setIsDismissed(true)
      }
    }
  }, [])

  const getUpcomingFestival = (): FestivalInfo | null => {
    const now = new Date()
    const currentYear = now.getFullYear()

    // Indian festivals with approximate dates (you can make these dynamic)
    const festivals = [
      { name: 'Diwali', month: 10, day: 31, emoji: '🪔', tag: 'Diwali' },
      { name: 'Holi', month: 2, day: 25, emoji: '🎨', tag: 'Holi' },
      { name: 'Raksha Bandhan', month: 7, day: 19, emoji: '🎀', tag: 'Rakhi' },
      { name: 'Durga Puja', month: 9, day: 20, emoji: '🙏', tag: 'Durga Puja' },
      { name: 'Onam', month: 8, day: 15, emoji: '🌺', tag: 'Onam' },
      { name: 'Pongal', month: 0, day: 14, emoji: '🌾', tag: 'Pongal' },
      { name: 'Eid', month: 3, day: 10, emoji: '🌙', tag: 'Eid' },
      { name: 'Christmas', month: 11, day: 25, emoji: '🎄', tag: 'Christmas' },
      { name: 'New Year', month: 11, day: 31, emoji: '🎆', tag: 'Gift' },
    ]

    let closestFestival: FestivalInfo | null = null
    let minDays = Infinity

    festivals.forEach(festival => {
      let festivalDate = new Date(currentYear, festival.month, festival.day)
      
      // If festival has passed this year, check next year
      if (festivalDate < now) {
        festivalDate = new Date(currentYear + 1, festival.month, festival.day)
      }

      const daysUntil = Math.ceil((festivalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntil < minDays && daysUntil >= 0) {
        minDays = daysUntil
        closestFestival = {
          name: festival.name,
          date: festivalDate,
          daysUntil,
          emoji: festival.emoji,
          tag: festival.tag
        }
      }
    })

    return closestFestival
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('festivalBannerDismissed', new Date().toDateString())
  }

  if (!upcomingFestival || isDismissed) {
    return null
  }

  return (
    <div className="relative bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white py-4 px-4 shadow-lg animate-fade-in">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-4xl animate-bounce">{upcomingFestival.emoji}</div>
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-lg">
                <TranslatedText text={`${upcomingFestival.name} in ${upcomingFestival.daysUntil} days!`} />
              </h3>
            </div>
            <p className="text-sm opacity-90">
              <TranslatedText text="Shop special gifts & decorations for the festive season" />
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            href={`/products?festival=${encodeURIComponent(upcomingFestival.tag)}`}
            className="px-6 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:scale-105"
          >
            <TranslatedText text="Shop Now" />
          </Link>
          
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
