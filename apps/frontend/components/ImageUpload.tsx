'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  onDetection: (result: any) => void
  onUploadStart: () => void
}

export default function ImageUpload({
  onDetection,
  onUploadStart,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      setError(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  })

  const handleUpload = async () => {
    if (!file) return

    try {
      setError(null)
      onUploadStart()

      const formData = new FormData()
      formData.append('image', file)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await axios.post(
        `${API_URL}/api/detection/detect`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      onDetection(response.data)
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || '업로드 실패'
      setError(errorMessage)
      console.error('Upload error:', err)
    }
  }

  const handleReset = () => {
    setPreview(null)
    setFile(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {isDragActive ? (
              <Upload className="w-12 h-12 text-blue-500 animate-bounce" />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-400" />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? '이미지를 놓으세요' : '이미지 업로드'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                클릭하거나 드래그 앤 드롭으로 업로드
              </p>
              <p className="text-xs text-gray-400 mt-2">
                PNG, JPG, JPEG, WebP (최대 10MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-gray-50"
            />
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!file}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              감지 시작
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">오류 발생</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}
    </div>
  )
}
