'use client'

import { Navigation, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Detection {
  x1: number
  y1: number
  x2: number
  y2: number
  confidence: number
  class_name: string
  class_id: number
  ocr_text?: string
}

interface DetectionResultsProps {
  detection: {
    detections: Detection[]
    instruction: string
    image_width: number
    image_height: number
  }
}

const CLASS_COLORS: Record<string, string> = {
  platform_sign: 'bg-blue-100 text-blue-800 border-blue-300',
  traffic_sign: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  traffic_light: 'bg-red-100 text-red-800 border-red-300',
  crosswalk: 'bg-green-100 text-green-800 border-green-300',
  vehicle: 'bg-purple-100 text-purple-800 border-purple-300',
  pedestrian: 'bg-pink-100 text-pink-800 border-pink-300',
}

const CLASS_NAMES: Record<string, string> = {
  platform_sign: '플랫폼 표지판',
  traffic_sign: '교통 표지판',
  traffic_light: '신호등',
  crosswalk: '횡단보도',
  vehicle: '차량',
  pedestrian: '보행자',
}

export default function DetectionResults({ detection }: DetectionResultsProps) {
  const { detections, instruction } = detection

  // Count detections by class
  const counts = detections.reduce((acc, d) => {
    acc[d.class_name] = (acc[d.class_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Get signs with OCR text
  const signsWithText = detections.filter(
    (d) =>
      (d.class_name === 'platform_sign' || d.class_name === 'traffic_sign') &&
      d.ocr_text
  )

  return (
    <div className="space-y-6">
      {/* Instruction Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Navigation className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">픽업 안내</h2>
            <p className="text-lg leading-relaxed">{instruction}</p>
          </div>
        </div>
      </div>

      {/* Detection Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          감지 결과
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Object.entries(counts).map(([className, count]) => (
            <div
              key={className}
              className={`rounded-lg border-2 p-3 ${CLASS_COLORS[className]}`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm font-medium">
                {CLASS_NAMES[className]}
              </div>
            </div>
          ))}
        </div>

        <div className="text-sm text-gray-600">
          총 <span className="font-semibold">{detections.length}개</span> 객체
          감지
        </div>
      </div>

      {/* Detected Signs with Numbers */}
      {signsWithText.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            인식된 표지판 숫자
          </h3>

          <div className="space-y-3">
            {signsWithText.map((sign, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  CLASS_COLORS[sign.class_name]
                }`}
              >
                <div>
                  <div className="font-medium">
                    {CLASS_NAMES[sign.class_name]}
                  </div>
                  <div className="text-sm opacity-75">
                    신뢰도: {(sign.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-3xl font-bold">{sign.ocr_text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detection Details */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <details className="group">
          <summary className="text-lg font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
            <span>상세 정보</span>
            <svg
              className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>

          <div className="mt-4 space-y-2">
            {detections.map((d, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      CLASS_COLORS[d.class_name]
                    }`}
                  >
                    {CLASS_NAMES[d.class_name]}
                  </span>
                  <span className="text-gray-600">
                    {(d.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                {d.ocr_text && (
                  <div className="text-gray-700">
                    텍스트: <span className="font-mono">{d.ocr_text}</span>
                  </div>
                )}
                <div className="text-gray-500 text-xs font-mono">
                  위치: ({Math.round(d.x1)}, {Math.round(d.y1)}) → (
                  {Math.round(d.x2)}, {Math.round(d.y2)})
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  )
}
