'use client'

import React, { useState } from 'react'
import { X, Loader2, Sparkles, RefreshCw, Check, XCircle } from 'lucide-react'

interface ImageEditModalProps {
  isOpen: boolean
  onClose: () => void
  originalImage: string
  imageIndex: number
  productDetails: {
    title: string
    description: string
    price: number
    material?: string
    technique?: string
    artForm?: string
  }
  onKeep: (editedImage: string) => void
}

export const ImageEditModal: React.FC<ImageEditModalProps> = ({
  isOpen,
  onClose,
  originalImage,
  imageIndex,
  productDetails,
  onKeep
}) => {
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editType, setEditType] = useState<'enhance' | 'change-background' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleEdit = async (type: 'enhance' | 'change-background') => {
    setIsEditing(true)
    setEditType(type)
    setError(null)

    try {
      const response = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: originalImage,
          editType: type,
          productDetails
        })
      })

      if (response.ok) {
        const result = await response.json()
        setEditedImage(result.editedImage)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to edit image')
      }
    } catch (err) {
      console.error('Error editing image:', err)
      setError('Error editing image. Please try again.')
    } finally {
      setIsEditing(false)
    }
  }

  const handleRetry = () => {
    if (editType) {
      handleEdit(editType)
    }
  }

  const handleKeep = () => {
    if (editedImage) {
      onKeep(editedImage)
      onClose()
      setEditedImage(null)
      setEditType(null)
    }
  }

  const handleDiscard = () => {
    setEditedImage(null)
    setEditType(null)
    setError(null)
  }

  const handleClose = () => {
    setEditedImage(null)
    setEditType(null)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI Image Editor</h2>
              <p className="text-sm text-gray-600">Enhance your product image</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-1">{productDetails.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{productDetails.description}</p>
          </div>

          {/* Images Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Image */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                Original Image
                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  Before
                </span>
              </h3>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-64 object-contain"
                />
              </div>
            </div>

            {/* Edited Image */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                {editedImage ? 'AI Enhanced Image' : 'Preview'}
                {editedImage && (
                  <span className="ml-2 text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">
                    After
                  </span>
                )}
              </h3>
              <div className="border-2 border-dashed border-purple-300 rounded-lg overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
                {editedImage ? (
                  <img
                    src={editedImage}
                    alt="Edited"
                    className="w-full h-64 object-contain"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center">
                    {isEditing ? (
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-600 font-medium">
                          AI is editing your image...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          This may take 10-30 seconds
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Choose an edit option below</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!editedImage ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Choose how you want to edit this image:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleEdit('enhance')}
                  disabled={isEditing}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <span className="text-2xl">✨</span>
                  <div className="text-left">
                    <p className="font-semibold">Enhance Quality</p>
                    <p className="text-xs opacity-90">Improve clarity & lighting</p>
                  </div>
                </button>

                <button
                  onClick={() => handleEdit('change-background')}
                  disabled={isEditing}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-4 rounded-xl hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <span className="text-2xl">🎨</span>
                  <div className="text-left">
                    <p className="font-semibold">Change Background</p>
                    <p className="text-xs opacity-90">Professional backdrop</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-3">
                How do you like the result?
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleRetry}
                  disabled={isEditing}
                  className="flex flex-col items-center space-y-2 bg-yellow-100 text-yellow-700 px-4 py-4 rounded-xl hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  <RefreshCw className="w-6 h-6" />
                  <span className="font-semibold text-sm">Retry</span>
                  <span className="text-xs opacity-75">Try again</span>
                </button>

                <button
                  onClick={handleDiscard}
                  disabled={isEditing}
                  className="flex flex-col items-center space-y-2 bg-red-100 text-red-700 px-4 py-4 rounded-xl hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  <XCircle className="w-6 h-6" />
                  <span className="font-semibold text-sm">Discard</span>
                  <span className="text-xs opacity-75">Use original</span>
                </button>

                <button
                  onClick={handleKeep}
                  disabled={isEditing}
                  className="flex flex-col items-center space-y-2 bg-green-100 text-green-700 px-4 py-4 rounded-xl hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  <Check className="w-6 h-6" />
                  <span className="font-semibold text-sm">Keep</span>
                  <span className="text-xs opacity-75">Use this one</span>
                </button>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">💡 Tip:</span> The AI understands your product details and will try to preserve the authentic look while enhancing quality. You can retry as many times as you like until you're satisfied with the result.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
