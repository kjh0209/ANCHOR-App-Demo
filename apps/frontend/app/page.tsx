'use client'

import { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'
import DetectionResults from '@/components/DetectionResults'
import { Plane, Navigation } from 'lucide-react'

export default function Home() {
  const [detection, setDetection] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleDetection = (result: any) => {
    setDetection(result)
    setLoading(false)
  }

  const handleUploadStart = () => {
    setLoading(true)
    setDetection(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Airport Pickup Guidance
              </h1>
              <p className="text-sm text-gray-600">
                CV 기반 공항 택시 픽업 안내 시스템
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  주행 화면 업로드
                </h2>
              </div>
              <p className="text-gray-600 mb-6 text-sm">
                택시 대시보드 카메라로 촬영한 주행 화면을 업로드하세요.
                YOLO 객체 감지와 OCR로 플랫폼 표지판을 자동으로 인식합니다.
              </p>
              <ImageUpload
                onDetection={handleDetection}
                onUploadStart={handleUploadStart}
              />
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">시스템 기능</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="bg-white/20 rounded-full p-1 mt-0.5">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">YOLOv8 객체 감지</p>
                    <p className="text-sm text-blue-100">
                      표지판, 신호등, 횡단보도, 차량, 보행자 실시간 인식
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white/20 rounded-full p-1 mt-0.5">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">OCR 숫자 인식</p>
                    <p className="text-sm text-blue-100">
                      플랫폼 번호와 교통 표지판 숫자 자동 추출
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white/20 rounded-full p-1 mt-0.5">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">스마트 안내 생성</p>
                    <p className="text-sm text-blue-100">
                      감지 결과 기반 자동 픽업 위치 안내 문구 생성
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">분석 중...</p>
              </div>
            ) : detection ? (
              <DetectionResults detection={detection} />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  이미지를 업로드하세요
                </h3>
                <p className="text-gray-500 text-sm">
                  주행 화면 이미지를 업로드하면
                  <br />
                  감지 결과와 안내 문구가 표시됩니다
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
