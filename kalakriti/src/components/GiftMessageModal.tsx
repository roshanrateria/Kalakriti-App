'use client'

import React, { useState } from 'react'
import { X, Gift, Heart, Sparkles, Send } from 'lucide-react'
import { TranslatedText } from './TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'

interface GiftMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (message: string, occasion: string) => void
  productTitle?: string
}

const INDIAN_OCCASIONS = [
  { value: 'wedding', label: 'Wedding (शादी)', icon: '💑' },
  { value: 'birthday', label: 'Birthday (जन्मदिन)', icon: '🎂' },
  { value: 'diwali', label: 'Diwali (दिवाली)', icon: '🪔' },
  { value: 'holi', label: 'Holi (होली)', icon: '🎨' },
  { value: 'rakhi', label: 'Raksha Bandhan', icon: '🎀' },
  { value: 'griha', label: 'Griha Pravesh (गृह प्रवेश)', icon: '🏠' },
  { value: 'anniversary', label: 'Anniversary', icon: '💐' },
  { value: 'newborn', label: 'New Baby (नामकरण)', icon: '👶' },
  { value: 'thank-you', label: 'Thank You (धन्यवाद)', icon: '🙏' },
  { value: 'custom', label: 'Custom Message', icon: '✍️' },
]

const GIFT_TEMPLATES: Record<string, string[]> = {
  wedding: [
    'Wishing you both a lifetime of love and happiness! May your journey together be filled with joy. 🎊',
    'Congratulations on your wedding! May your love story be as beautiful as this craft. 💑',
    'Best wishes for a wonderful life together! May you always find joy in each other. 🌟',
  ],
  birthday: [
    'Happy Birthday! May this year bring you endless joy and prosperity. 🎂',
    'Wishing you a day filled with love and a year filled with blessings! 🎉',
    'Many happy returns of the day! May all your dreams come true. 🌈',
  ],
  diwali: [
    'Happy Diwali! May the festival of lights illuminate your life with happiness and prosperity. 🪔',
    'Wishing you a sparkling Diwali filled with joy, health and wealth! ✨',
    'May this Diwali bring success and good fortune to your home. शुभ दीपावली! 🎆',
  ],
  holi: [
    'Happy Holi! May your life be filled with colors of joy and happiness. 🎨',
    'Wishing you a vibrant and joyful Holi! होली की शुभकामनाएं! 🌈',
    'May the colors of Holi spread love and happiness in your life. 💜',
  ],
  rakhi: [
    'Happy Raksha Bandhan! May the bond of love between siblings always remain strong. 🎀',
    'Wishing you a beautiful Rakhi celebration! रक्षा बंधन की शुभकामनाएं! 💝',
    'May this Rakhi strengthen the sacred bond we share. Love always! 🌟',
  ],
  griha: [
    'Congratulations on your new home! May it be filled with love, laughter and prosperity. 🏠',
    'Wishing you happiness and good fortune in your new abode. गृह प्रवेश की शुभकामनाएं! ✨',
    'May your new home be blessed with peace and joy always! 🙏',
  ],
  anniversary: [
    'Happy Anniversary! May your love continue to grow stronger with each passing year. 💐',
    'Celebrating your beautiful journey together! Wishing you many more years of happiness. 💑',
    'Congratulations on another year of togetherness and love! 🌹',
  ],
  newborn: [
    'Congratulations on your little bundle of joy! May the baby be blessed with health and happiness. 👶',
    'Welcome to the world, little one! Wishing you a lifetime of love and blessings. 🍼',
    'May the newborn bring endless joy and prosperity to your family. नामकरण की शुभकामनाएं! 🌟',
  ],
  'thank-you': [
    'Thank you for everything! Your kindness means the world to us. 🙏',
    'A small token of appreciation for all that you do. धन्यवाद! 💝',
    'Grateful for your support and love. Thank you from the heart! ❤️',
  ],
}

export default function GiftMessageModal({ isOpen, onClose, onSave, productTitle }: GiftMessageModalProps) {
  const { translate } = useTranslation()
  const [selectedOccasion, setSelectedOccasion] = useState<string>('')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  if (!isOpen) return null

  const handleSave = () => {
    const finalMessage = selectedOccasion === 'custom' ? customMessage : selectedTemplate
    if (finalMessage.trim()) {
      onSave(finalMessage, selectedOccasion)
      onClose()
    }
  }

  const templates = selectedOccasion && GIFT_TEMPLATES[selectedOccasion] ? GIFT_TEMPLATES[selectedOccasion] : []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gift className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">
                  <TranslatedText text="Add Gift Message" />
                </h2>
                {productTitle && (
                  <p className="text-sm opacity-90">
                    <TranslatedText text={`For: ${productTitle}`} />
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: Select Occasion */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              <TranslatedText text="Select Occasion" />
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INDIAN_OCCASIONS.map((occasion) => (
                <button
                  key={occasion.value}
                  onClick={() => {
                    setSelectedOccasion(occasion.value)
                    setSelectedTemplate('')
                    setCustomMessage('')
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedOccasion === occasion.value
                      ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-2xl mb-1">{occasion.icon}</div>
                  <div className="text-sm font-medium text-gray-800">
                    <TranslatedText text={occasion.label} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Choose Template or Write Custom */}
          {selectedOccasion && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-pink-600" />
                <TranslatedText text={selectedOccasion === 'custom' ? 'Write Your Message' : 'Choose a Template'} />
              </h3>

              {selectedOccasion === 'custom' ? (
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Write your personalized message here..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={5}
                />
              ) : (
                <div className="space-y-3">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedTemplate === template
                          ? 'border-pink-500 bg-pink-50 shadow-lg'
                          : 'border-gray-200 hover:border-pink-300 hover:shadow-md'
                      }`}
                    >
                      <p className="text-gray-800 leading-relaxed">{template}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {(selectedTemplate || customMessage) && (
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">
                <TranslatedText text="Message Preview:" />
              </p>
              <p className="text-gray-800 italic leading-relaxed">
                "{selectedOccasion === 'custom' ? customMessage : selectedTemplate}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            <TranslatedText text="Cancel" />
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedTemplate && !customMessage}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>
              <TranslatedText text="Save Message" />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
