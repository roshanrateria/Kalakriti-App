'use client'

import React from 'react'
import AIChatbot from '@/components/AIChatbot'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              AI Shopping Assistant
            </h1>
            <p className="text-lg text-gray-600">
              Get personalized recommendations and help with your shopping
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <AIChatbot/>
          </div>
        </div>
      </div>
    </div>
  )
}
