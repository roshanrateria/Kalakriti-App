'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from '@/contexts/TranslationContext'
import { TranslatedText } from '@/components/TranslatedText'
import { 
  Clock, 
  User, 
  TrendingDown, 
  Check, 
  X, 
  MessageCircle,
  Package,
  Calendar,
  Gift
} from 'lucide-react'
import { toast } from '@/components/ui/Toaster'

interface Offer {
  id: string
  offerPrice: number
  originalPrice: number
  status: string
  message?: string
  quantity: number
  expiresAt?: string
  createdAt: string
  product: {
    id: string
    title: string
    price: number
    images: string[]
  }
  buyer: {
    id: string
    name: string
    email: string
  }
}

interface OffersManagementProps {
  isOpen: boolean
  onClose: () => void
}

export default function OffersManagement({ isOpen, onClose }: OffersManagementProps) {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending')
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user?.role === 'SELLER') {
      fetchOffers()
    }
  }, [isOpen, user, filter])

  const fetchOffers = async () => {
    if (!token) return

    setLoading(true)
    try {
      const statusParam = filter === 'all' ? '' : `&status=${filter.toUpperCase()}`
      const response = await fetch(`/api/offers?type=received${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOffers(data.offers)
      } else {
        toast.error(await translate('Failed to load offers'))
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
      toast.error(await translate('Failed to load offers'))
    } finally {
      setLoading(false)
    }
  }

  const handleOfferResponse = async (offerId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!token || processingOfferId) return

    setProcessingOfferId(offerId)
    
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(await translate(data.message))
        fetchOffers() // Refresh the list
      } else {
        toast.error(await translate(data.error || 'Failed to respond to offer'))
      }
    } catch (error) {
      console.error('Error responding to offer:', error)
      toast.error(await translate('Failed to respond to offer'))
    } finally {
      setProcessingOfferId(null)
    }
  }

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`
    }
    return `${minutes}m left`
  }

  const getDiscountPercent = (offer: Offer) => {
    return Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)
  }

  const getSavings = (offer: Offer) => {
    return offer.originalPrice - offer.offerPrice
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  <TranslatedText text="Offers Management" />
                </h2>
                <p className="text-purple-100 text-sm">
                  <TranslatedText text="Review and respond to buyer offers" />
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 mt-6">
            {[
              { key: 'pending', label: 'Pending' },
              { key: 'accepted', label: 'Accepted' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'all', label: 'All' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  filter === tab.key
                    ? 'bg-white text-purple-600 font-semibold'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <TranslatedText text={tab.label} />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                <TranslatedText text="No offers found" />
              </h3>
              <p className="text-gray-500">
                <TranslatedText text="You don't have any offers in this category yet." />
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className={`bg-gradient-to-r rounded-2xl p-6 border-2 transition-all ${
                    offer.status === 'PENDING'
                      ? 'from-yellow-50 to-orange-50 border-yellow-200 hover:border-yellow-300'
                      : offer.status === 'ACCEPTED'
                      ? 'from-green-50 to-emerald-50 border-green-200'
                      : 'from-red-50 to-pink-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                      {offer.product.images.length > 0 ? (
                        <img
                          src={offer.product.images[0]}
                          alt={offer.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Offer Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate mb-1">
                            {offer.product.title}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{offer.buyer.name}</span>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          offer.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : offer.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {offer.status}
                        </div>
                      </div>

                      {/* Price Comparison */}
                      <div className="bg-white rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">
                              <TranslatedText text="Original" />
                            </div>
                            <div className="text-lg font-bold text-gray-500 line-through">
                              ₹{offer.originalPrice.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">
                              <TranslatedText text="Offer" />
                            </div>
                            <div className="text-xl font-bold text-purple-600">
                              ₹{offer.offerPrice.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">
                              <TranslatedText text="Discount" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-green-600">
                                {getDiscountPercent(offer)}%
                              </span>
                              <span className="text-sm text-green-600">
                                -₹{getSavings(offer).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      {offer.message && (
                        <div className="bg-blue-50 rounded-xl p-3 mb-4">
                          <div className="flex items-start space-x-2">
                            <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-blue-800 mb-1">
                                <TranslatedText text="Buyer's message" />
                              </div>
                              <p className="text-sm text-blue-700">"{offer.message}"</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timing and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                          </div>
                          {offer.expiresAt && offer.status === 'PENDING' && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span className={
                                new Date(offer.expiresAt) < new Date() 
                                  ? 'text-red-600 font-semibold' 
                                  : 'text-orange-600'
                              }>
                                {getTimeLeft(offer.expiresAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {offer.status === 'PENDING' && new Date(offer.expiresAt!) > new Date() && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOfferResponse(offer.id, 'REJECTED')}
                              disabled={processingOfferId === offer.id}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
                            >
                              <X className="w-4 h-4" />
                              <span><TranslatedText text="Reject" /></span>
                            </button>
                            <button
                              onClick={() => handleOfferResponse(offer.id, 'ACCEPTED')}
                              disabled={processingOfferId === offer.id}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
                            >
                              {processingOfferId === offer.id ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              <span><TranslatedText text="Accept" /></span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
