import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ChevronLeft, Calendar, Image as ImageIcon } from 'lucide-react'
import api from '../api'

export default function MemorialPage() {
  const navigate = useNavigate()
  const [memorials, setMemorials] = useState([])
  const [selectedMemorial, setSelectedMemorial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lighting, setLighting] = useState(false)

  const globalUserId = 'g_10001' // Mocked user id for now

  useEffect(() => {
    fetchMemorials()
  }, [])

  const fetchMemorials = async () => {
    try {
      setLoading(true)
      const res = await api.memorialList(globalUserId)
      if (res.code === 0 && res.data?.pages) {
        setMemorials(res.data.pages)
        if (res.data.pages.length > 0) {
          fetchDetail(res.data.pages[0].id)
        } else {
          setLoading(false)
        }
      } else {
        throw new Error(res.message || 'Failed to fetch memorials')
      }
    } catch (err) {
      console.error(err)
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchDetail = async (id) => {
    try {
      setLoading(true)
      const res = await api.memorialDetail(id)
      if (res.code === 0) {
        setSelectedMemorial(res.data)
      } else {
        throw new Error(res.message || 'Failed to fetch memorial detail')
      }
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLightCandle = async () => {
    if (!selectedMemorial) return
    try {
      setLighting(true)
      const res = await api.memorialLightCandle(globalUserId, selectedMemorial.id)
      if (res.code === 0) {
        setSelectedMemorial((prev) => ({
          ...prev,
          candles_lit: res.data.candles_lit
        }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLighting(false)
    }
  }

  if (loading && !selectedMemorial) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-zinc-500 font-medium">Loading Memories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4">
        <button onClick={() => navigate(-1)} className="flex items-center text-zinc-600 mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
          {error}
        </div>
      </div>
    )
  }

  if (!selectedMemorial) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4">
        <button onClick={() => navigate(-1)} className="flex items-center text-zinc-600 mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <div className="text-center text-zinc-500 py-12">
          No memorials found.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-zinc-800 mr-8">
          In Loving Memory
        </h1>
      </div>

      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm">
        {/* Cover Image */}
        <div className="relative w-full h-64 bg-zinc-200">
          <img 
            src={selectedMemorial.cover_image} 
            alt={selectedMemorial.pet_name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-3xl font-bold mb-1">{selectedMemorial.pet_name}</h2>
            <div className="flex items-center text-white/80 text-sm">
              <Calendar className="w-4 h-4 mr-1.5" />
              Crossed the Rainbow Bridge on {selectedMemorial.passed_away_date}
            </div>
          </div>
        </div>

        {/* Bio & Actions */}
        <div className="p-6">
          <p className="text-zinc-600 text-base leading-relaxed mb-6 italic">
            "{selectedMemorial.bio}"
          </p>

          <div className="bg-amber-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center mb-8 border border-amber-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
              <Heart className={`w-8 h-8 text-amber-500 ${lighting ? 'animate-ping' : ''}`} fill="currentColor" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 mb-1">Light a Virtual Candle</h3>
            <p className="text-sm text-zinc-500 mb-4">
              {selectedMemorial.candles_lit} candles lit in memory of {selectedMemorial.pet_name}
            </p>
            <button 
              onClick={handleLightCandle}
              disabled={lighting}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {lighting ? 'Lighting...' : 'Light a Candle'}
            </button>
          </div>

          {/* Photo Gallery */}
          {selectedMemorial.gallery && selectedMemorial.gallery.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <ImageIcon className="w-5 h-5 text-zinc-400 mr-2" />
                <h3 className="text-lg font-bold text-zinc-800">Photo Gallery</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {selectedMemorial.gallery.map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-zinc-100 shadow-sm">
                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
