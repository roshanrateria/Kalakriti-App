'use client'

import React from 'react'
import { Clock, Calendar, Sparkles } from 'lucide-react'
import { TranslatedText } from './TranslatedText'

interface CraftTimelineProps {
  timeToCreate?: number  // in days
  technique?: string
  artForm?: string
}

export default function CraftTimeline({ timeToCreate, technique, artForm }: CraftTimelineProps) {
  if (!timeToCreate || timeToCreate === 0) {
    return null
  }

  // Generate timeline stages based on craft type and time
  const generateStages = () => {
    const stages = []
    
    if (timeToCreate <= 3) {
      // Quick crafts
      stages.push(
        { phase: 'Preparation', percentage: 30, days: Math.ceil(timeToCreate * 0.3), icon: '📋' },
        { phase: 'Crafting', percentage: 60, days: Math.ceil(timeToCreate * 0.6), icon: '✨' },
        { phase: 'Finishing', percentage: 10, days: Math.ceil(timeToCreate * 0.1), icon: '✅' }
      )
    } else if (timeToCreate <= 7) {
      // Medium crafts
      stages.push(
        { phase: 'Design & Sketch', percentage: 15, days: Math.ceil(timeToCreate * 0.15), icon: '✏️' },
        { phase: 'Material Prep', percentage: 20, days: Math.ceil(timeToCreate * 0.2), icon: '🎨' },
        { phase: 'Main Crafting', percentage: 45, days: Math.ceil(timeToCreate * 0.45), icon: '🖌️' },
        { phase: 'Detailing', percentage: 15, days: Math.ceil(timeToCreate * 0.15), icon: '💎' },
        { phase: 'Quality Check', percentage: 5, days: Math.ceil(timeToCreate * 0.05), icon: '✅' }
      )
    } else {
      // Complex/heritage crafts
      stages.push(
        { phase: 'Pattern Design', percentage: 10, days: Math.ceil(timeToCreate * 0.1), icon: '📐' },
        { phase: 'Material Selection', percentage: 10, days: Math.ceil(timeToCreate * 0.1), icon: '🎨' },
        { phase: 'Initial Framework', percentage: 20, days: Math.ceil(timeToCreate * 0.2), icon: '🔨' },
        { phase: 'Detailed Work', percentage: 35, days: Math.ceil(timeToCreate * 0.35), icon: '🖌️' },
        { phase: 'Embellishment', percentage: 15, days: Math.ceil(timeToCreate * 0.15), icon: '💎' },
        { phase: 'Finishing Touch', percentage: 10, days: Math.ceil(timeToCreate * 0.1), icon: '✨' }
      )
    }
    
    return stages
  }

  const stages = generateStages()

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center text-gray-800">
          <Clock className="w-5 h-5 mr-2 text-purple-600" />
          <TranslatedText text="Craft Creation Timeline" />
        </h3>
        <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>
            <TranslatedText text={`${timeToCreate} ${timeToCreate === 1 ? 'Day' : 'Days'}`} />
          </span>
        </div>
      </div>

      {artForm && (
        <div className="mb-4 text-sm text-gray-600">
          <span className="font-medium">
            <TranslatedText text="Art Form:" />
          </span>{' '}
          <span className="text-purple-700 font-semibold">{artForm}</span>
          {technique && (
            <>
              {' | '}
              <span className="font-medium">
                <TranslatedText text="Technique:" />
              </span>{' '}
              <span className="text-purple-700 font-semibold">{technique}</span>
            </>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={index} className="relative">
            {/* Stage Info */}
            <div className="flex items-center mb-2">
              <div className="text-2xl mr-3">{stage.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-800">
                    <TranslatedText text={stage.phase} />
                  </span>
                  <span className="text-sm text-gray-600">
                    {stage.days} {stage.days === 1 ? 'day' : 'days'}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 animate-pulse-slow"
                    style={{ width: `${stage.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Connector Line */}
            {index < stages.length - 1 && (
              <div className="ml-5 h-4 border-l-2 border-dashed border-purple-300"></div>
            )}
          </div>
        ))}
      </div>

      {/* Artisan Note */}
      <div className="mt-6 bg-white rounded-lg p-4 border-l-4 border-purple-600">
        <div className="flex items-start space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-medium text-purple-900 mb-1">
              <TranslatedText text="Handcrafted with Love" />
            </p>
            <p className="text-gray-600">
              <TranslatedText text="Each piece is carefully crafted by skilled artisans. The time shown represents the dedication and craftsmanship that goes into creating your unique product." />
            </p>
          </div>
        </div>
      </div>

      {/* Fun Fact */}
      {timeToCreate >= 7 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-purple-700 font-medium">
            ⏰ <TranslatedText text={`This craft takes ${Math.ceil(timeToCreate / 7)} week${Math.ceil(timeToCreate / 7) > 1 ? 's' : ''} of dedicated work!`} />
          </p>
        </div>
      )}
    </div>
  )
}
