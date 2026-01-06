'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from '@/contexts/TranslationContext'
import { TranslatedText } from '@/components/TranslatedText'
import { X, TrendingDown, MessageCircle, Clock, Sparkles, Gift } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'

interface Product {
  id: string
  title: string
  price: number
  seller: {
    id: string
    name: string
  }
}

interface MakeOfferModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onOfferSubmitted?: () => void
}

export default function MakeOfferModal({ 
  product, 
  isOpen, 
  onClose, 
  onOfferSubmitted 
}: MakeOfferModalProps) {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
    const [offerPrice, setOfferPrice] = useState('')
  const [message, setMessage] = useState('')
  const [quantity] = useState(1) // Fixed to 1 - offers are for single items only
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1) // 1: Price selection, 2: Message, 3: Confirmation
  const [suggestedPrices, setSuggestedPrices] = useState<number[]>([])
  const [discount, setDiscount] = useState(0)
  const [savings, setSavings] = useState(0)

  useEffect(() => {
    if (isOpen && product) {
      // Generate suggested prices with different discount levels
      const prices = [
        Math.round(product.price * 0.95), // 5% off
        Math.round(product.price * 0.90), // 10% off  
        Math.round(product.price * 0.85), // 15% off
        Math.round(product.price * 0.80), // 20% off
      ]
      setSuggestedPrices(prices)
      setOfferPrice('')
      setMessage('')
      setStep(1)
      setDiscount(0)
      setSavings(0)
    }
  }, [isOpen, product])

  useEffect(() => {
    if (offerPrice && product) {
      const offer = parseFloat(offerPrice)
      const original = product.price
      if (offer > 0 && offer < original) {
        const discountPercent = Math.round(((original - offer) / original) * 100)
        const savingsAmount = original - offer
        setDiscount(discountPercent)
        setSavings(savingsAmount)
      } else {
        setDiscount(0)
        setSavings(0)
      }
    }
  }, [offerPrice, product])

  const handlePriceSelect = (price: number) => {
    setOfferPrice(price.toString())
    // Add bounce animation
    const element = document.getElementById(`price-${price}`)
    if (element) {
      element.classList.add('animate-bounce')
      setTimeout(() => element.classList.remove('animate-bounce'), 500)
    }
  }

  const handleSubmitOffer = async () => {
    if (!offerPrice || !product || !user || !token) return

    const offer = parseFloat(offerPrice)
    const minPrice = product.price * 0.5

    if (offer <= 0) {
      toast.error(await translate('Please enter a valid offer price'))
      return
    }

    if (offer >= product.price) {
      toast.error(await translate('Offer price must be less than the current price'))
      return
    }

    if (offer < minPrice) {
      toast.error(await translate(`Offer price must be at least ₹${minPrice.toFixed(2)}`))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          offerPrice: offer,
          message: message.trim(),
          quantity
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(await translate(data.message || 'Offer submitted successfully!'))
        onOfferSubmitted?.()
        onClose()
      } else {
        toast.error(await translate(data.error || 'Failed to submit offer'))
      }
    } catch (error) {
      console.error('Error submitting offer:', error)
      toast.error(await translate('Failed to submit offer'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all scale-95 animate-in duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                <TranslatedText text="Make an Offer" />
              </h2>
              <p className="text-orange-100 text-sm">
                <TranslatedText text="Negotiate a better price" />
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex space-x-2 mt-4">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`flex-1 h-2 rounded-full transition-all ${
                  step >= stepNum ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Info */}
          <div className="bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
              {product.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                <TranslatedText text="Current Price" />
              </span>
              <span className="text-lg font-bold text-orange-600">
                ₹{product.price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Step 1: Price Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                  <TranslatedText text="What's your offer?" />
                </h3>

                {/* Suggested Prices */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {suggestedPrices.map((price, index) => {
                    const discountPercent = Math.round(((product.price - price) / product.price) * 100)
                    return (
                      <button
                        key={price}
                        id={`price-${price}`}
                        onClick={() => handlePriceSelect(price)}
                        className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                          offerPrice === price.toString()
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">₹{price.toLocaleString()}</div>
                          <div className="text-sm text-green-600">{discountPercent}% OFF</div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Custom Price Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <TranslatedText text="Or enter custom amount" />
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="Enter your offer"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Savings Display */}
                  {savings > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Gift className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            <TranslatedText text="You save" />
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ₹{savings.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-600">
                            ({discount}% <TranslatedText text="off" />)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <TranslatedText text="Cancel" />
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!offerPrice || parseFloat(offerPrice) <= 0}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                  >
                    <TranslatedText text="Continue" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Message */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
                  <TranslatedText text="Add a message (optional)" />
                </h3>
                
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the seller why you're interested or any special requests..."
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none h-32"
                  maxLength={200}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {message.length}/200
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <TranslatedText text="Back" />
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
                >
                  <TranslatedText text="Review" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-500" />
                  <TranslatedText text="Review your offer" />
                </h3>

                {/* Offer Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600"><TranslatedText text="Your offer" /></span>
                    <span className="text-2xl font-bold text-purple-600">
                      ₹{parseFloat(offerPrice || '0').toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600"><TranslatedText text="Original price" /></span>
                    <span className="text-gray-500 line-through">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-green-600 font-medium"><TranslatedText text="You save" /></span>
                      <span className="text-green-600 font-bold">
                        ₹{savings.toLocaleString()} ({discount}%)
                      </span>
                    </div>
                  )}
                  
                  {message && (
                    <div className="border-t pt-2">
                      <span className="text-gray-600 text-sm block mb-1"><TranslatedText text="Your message" /></span>
                      <p className="text-gray-800 text-sm bg-white rounded-lg p-2">"{message}"</p>
                    </div>
                  )}
                </div>

                {/* Expiry Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      <TranslatedText text="This offer will expire in 24 hours" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <TranslatedText text="Back" />
                </button>
                <button
                  onClick={handleSubmitOffer}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span><TranslatedText text="Submitting..." /></span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4" />
                      <span><TranslatedText text="Submit Offer" /></span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
