'use client'

import React from 'react'
import { Ruler, Coffee, Book, Smartphone, Hand } from 'lucide-react'
import { TranslatedText } from './TranslatedText'

interface SizeComparisonProps {
  length?: number  // in cm
  width?: number   // in cm
  height?: number  // in cm
  weight?: number  // in grams
}

interface ComparisonItem {
  name: string
  icon: React.ReactNode
  length?: number
  width?: number
  height?: number
  matchScore: number
}

export default function SizeComparison({ length, width, height, weight }: SizeComparisonProps) {
  if (!length && !width && !height) {
    return null
  }

  // Common Indian household items for comparison (dimensions in cm)
  const commonItems = [
    { name: 'Standard Thali Plate', icon: '🍽️', diameter: 30, length: 30, width: 30, height: 2 },
    { name: 'Cricket Ball', icon: '🏏', diameter: 7, length: 7, width: 7, height: 7 },
    { name: 'A4 Paper', icon: '📄', length: 29.7, width: 21, height: 0.01 },
    { name: 'Smartphone', icon: '📱', length: 15, width: 7, height: 0.8 },
    { name: 'Tea Cup', icon: '☕', diameter: 8, length: 8, width: 8, height: 10 },
    { name: 'Book', icon: '📚', length: 23, width: 15, height: 3 },
    { name: 'Laptop', icon: '💻', length: 35, width: 24, height: 2 },
    { name: 'Diya (Lamp)', icon: '🪔', diameter: 5, length: 5, width: 5, height: 3 },
    { name: 'Hand (Palm)', icon: '✋', length: 18, width: 9, height: 2 },
    { name: 'Banana', icon: '🍌', length: 18, width: 3, height: 3 },
  ]

  // Calculate best match based on dimensions
  const findBestMatch = (): ComparisonItem => {
    const productVolume = (length || 0) * (width || 0) * (height || 0)
    
    let bestMatch = commonItems[0]
    let minDifference = Infinity

    commonItems.forEach(item => {
      const itemVolume = item.length * item.width * item.height
      const volumeDiff = Math.abs(productVolume - itemVolume)
      
      // Also consider individual dimension similarities
      const lengthDiff = Math.abs((length || 0) - item.length)
      const widthDiff = Math.abs((width || 0) - item.width)
      
      const totalDiff = volumeDiff * 0.5 + lengthDiff + widthDiff
      
      if (totalDiff < minDifference) {
        minDifference = totalDiff
        bestMatch = item
      }
    })

    return {
      name: bestMatch.name,
      icon: bestMatch.icon,
      length: bestMatch.length,
      width: bestMatch.width,
      height: bestMatch.height,
      matchScore: 100 - Math.min(minDifference * 2, 100)
    }
  }

  const comparison = findBestMatch()
  
  const getComparisonText = () => {
    const productArea = (length || 0) * (width || 0)
    const itemArea = (comparison.length || 0) * (comparison.width || 0)
    
    if (Math.abs(productArea - itemArea) / itemArea < 0.2) {
      return `About the same size as a ${comparison.name}`
    } else if (productArea > itemArea * 1.5) {
      const times = Math.round(productArea / itemArea * 10) / 10
      return `About ${times}x larger than a ${comparison.name}`
    } else if (productArea < itemArea * 0.7) {
      return `Smaller than a ${comparison.name}`
    }
    return `Similar to a ${comparison.name}`
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
        <Ruler className="w-5 h-5 mr-2 text-blue-600" />
        <TranslatedText text="Size Comparison" />
      </h3>

      <div className="flex items-center justify-between mb-4">
        {/* Product Dimensions */}
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">
            <TranslatedText text="This Product:" />
          </p>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            {length && (
              <div className="text-sm">
                <span className="font-medium">L:</span> {length} cm
              </div>
            )}
            {width && (
              <div className="text-sm">
                <span className="font-medium">W:</span> {width} cm
              </div>
            )}
            {height && (
              <div className="text-sm">
                <span className="font-medium">H:</span> {height} cm
              </div>
            )}
            {weight && (
              <div className="text-sm text-gray-500 mt-1">
                <span className="font-medium">Weight:</span> {weight}g
              </div>
            )}
          </div>
        </div>

        {/* Comparison Arrow */}
        <div className="mx-4 flex flex-col items-center">
          <div className="text-2xl animate-pulse">≈</div>
          <div className="text-xs text-gray-500 mt-1">
            <TranslatedText text="Similar to" />
          </div>
        </div>

        {/* Comparison Item */}
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">
            <TranslatedText text="Familiar Object:" />
          </p>
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <div className="text-4xl mb-1">{comparison.icon}</div>
            <div className="text-sm font-medium text-gray-800">
              <TranslatedText text={comparison.name} />
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Text */}
      <div className="bg-blue-100 rounded-lg p-3 text-center">
        <p className="text-sm font-medium text-blue-900">
          <TranslatedText text={getComparisonText()} />
        </p>
      </div>

      {/* Visual Size Indicator */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-white rounded p-2">
          <div className="text-xs text-gray-500 mb-1">
            <TranslatedText text="Small" />
          </div>
          <div className={`w-8 h-8 mx-auto rounded ${(length || 0) < 15 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
        </div>
        <div className="bg-white rounded p-2">
          <div className="text-xs text-gray-500 mb-1">
            <TranslatedText text="Medium" />
          </div>
          <div className={`w-12 h-12 mx-auto rounded ${(length || 0) >= 15 && (length || 0) < 40 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
        </div>
        <div className="bg-white rounded p-2">
          <div className="text-xs text-gray-500 mb-1">
            <TranslatedText text="Large" />
          </div>
          <div className={`w-16 h-16 mx-auto rounded ${(length || 0) >= 40 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
        </div>
      </div>
    </div>
  )
}
