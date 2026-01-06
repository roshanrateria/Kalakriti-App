'use client'

import React from 'react'
import { Palette } from 'lucide-react'
import { TranslatedText } from './TranslatedText'

interface TraditionalColorSelectorProps {
  value?: string
  onChange: (colorName: string, hexCode: string) => void
  disabled?: boolean
}

// Traditional Indian Colors with their hex codes
export const INDIAN_COLORS = [
  { name: 'Sindoor Red', hindi: 'सिंदूर लाल', hex: '#DC143C', gradient: 'from-red-600 to-red-700' },
  { name: 'Haldi Yellow', hindi: 'हल्दी पीला', hex: '#FDB913', gradient: 'from-yellow-400 to-yellow-500' },
  { name: 'Marigold Orange', hindi: 'गेंदा नारंगी', hex: '#FF8C00', gradient: 'from-orange-400 to-orange-600' },
  { name: 'Peacock Blue', hindi: 'मोर नीला', hex: '#005F73', gradient: 'from-cyan-700 to-blue-800' },
  { name: 'Mehendi Green', hindi: 'मेहंदी हरा', hex: '#556B2F', gradient: 'from-green-700 to-green-800' },
  { name: 'Rose Pink', hindi: 'गुलाबी', hex: '#FF69B4', gradient: 'from-pink-400 to-pink-600' },
  { name: 'Sandalwood Cream', hindi: 'चंदन क्रीम', hex: '#F5E6D3', gradient: 'from-amber-100 to-amber-200' },
  { name: 'Kumkum Red', hindi: 'कुमकुम लाल', hex: '#E03C31', gradient: 'from-red-500 to-red-600' },
  { name: 'Kashmiri Saffron', hindi: 'केसर', hex: '#F4C430', gradient: 'from-yellow-500 to-orange-400' },
  { name: 'Neem Green', hindi: 'नीम हरा', hex: '#228B22', gradient: 'from-green-600 to-green-700' },
  { name: 'Lotus Pink', hindi: 'कमल गुलाबी', hex: '#FFB6C1', gradient: 'from-pink-300 to-pink-400' },
  { name: 'Indigo Blue', hindi: 'नील', hex: '#4B0082', gradient: 'from-indigo-700 to-indigo-900' },
  { name: 'Turmeric Gold', hindi: 'हल्दी सोना', hex: '#DAA520', gradient: 'from-yellow-600 to-amber-600' },
  { name: 'Curry Leaf Green', hindi: 'करी पत्ता हरा', hex: '#3F704D', gradient: 'from-green-700 to-green-800' },
  { name: 'Coral Red', hindi: 'मूंगा लाल', hex: '#FF6F61', gradient: 'from-red-400 to-orange-500' },
  { name: 'Amethyst Purple', hindi: 'जामुनी', hex: '#9966CC', gradient: 'from-purple-500 to-purple-600' },
  { name: 'Ivory White', hindi: 'हाथी दांत सफेद', hex: '#FFFFF0', gradient: 'from-gray-50 to-gray-100' },
  { name: 'Charcoal Black', hindi: 'कोयला काला', hex: '#36454F', gradient: 'from-gray-800 to-gray-900' },
  { name: 'Tamarind Brown', hindi: 'इमली भूरा', hex: '#964B00', gradient: 'from-amber-800 to-amber-900' },
  { name: 'Hibiscus Red', hindi: 'गुड़हल लाल', hex: '#CD5C5C', gradient: 'from-red-500 to-rose-600' },
]

export default function TraditionalColorSelector({ value, onChange, disabled }: TraditionalColorSelectorProps) {
  const [selectedColor, setSelectedColor] = React.useState(value || '')

  const handleColorSelect = (colorName: string, hexCode: string) => {
    setSelectedColor(colorName)
    onChange(colorName, hexCode)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
        <Palette className="w-4 h-4 mr-2 text-purple-600" />
        <TranslatedText text="Traditional Color Name" />
        <span className="ml-2 text-xs text-gray-500">
          (<TranslatedText text="Optional - Adds cultural touch" />)
        </span>
      </label>

      {selectedColor && (
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <p className="text-sm font-medium text-gray-700">
            <TranslatedText text="Selected:" />{' '}
            <span className="text-purple-700 font-semibold">{selectedColor}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
        {INDIAN_COLORS.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => handleColorSelect(color.name, color.hex)}
            disabled={disabled}
            className={`group relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
              selectedColor === color.name
                ? 'border-purple-600 shadow-lg'
                : 'border-gray-200 hover:border-purple-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Color Circle */}
            <div
              className={`w-full aspect-square rounded-full mb-2 bg-gradient-to-br ${color.gradient} shadow-md group-hover:shadow-lg transition-shadow`}
              style={{ backgroundColor: color.hex }}
            ></div>

            {/* Color Name */}
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-800 leading-tight mb-1">
                {color.name}
              </p>
              <p className="text-xs text-gray-500">{color.hindi}</p>
            </div>

            {/* Selected Checkmark */}
            {selectedColor === color.name && (
              <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Clear Selection */}
      {selectedColor && !disabled && (
        <button
          type="button"
          onClick={() => {
            setSelectedColor('')
            onChange('', '')
          }}
          className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          <TranslatedText text="Clear Selection" />
        </button>
      )}

      <p className="mt-2 text-xs text-gray-500 italic">
        <TranslatedText text="Traditional color names help buyers connect emotionally with Indian crafts and understand the cultural significance of colors used." />
      </p>
    </div>
  )
}
