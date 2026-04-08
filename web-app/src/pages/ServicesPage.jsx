import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ChevronLeft, CalendarHeart, FlameKindling, Star, HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function ServicesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [bookingType, setBookingType] = useState(null);
  const [bookingTime, setBookingTime] = useState('');
  const [bookingStatus, setBookingStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await api.serviceList();
      setServices(res.services || []);
    } catch (e) {
      setError(e.message || '加载服务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!bookingType || !bookingTime) {
      alert('Please select a time');
      return;
    }
    try {
      setBookingStatus('loading');
      await api.serviceBook(bookingType, bookingTime);
      setBookingStatus('success');
      setTimeout(() => {
        setBookingType(null);
        setBookingTime('');
        setBookingStatus('idle');
      }, 3000);
    } catch (e) {
      setBookingStatus('error');
      alert(e.message || '预约失败');
    }
  };

  const getIcon = (type) => {
    if (type === 'aftercare') return <FlameKindling className="text-orange-500" size={24} />;
    if (type === 'memorial') return <Star className="text-blue-500" size={24} />;
    return <HeartHandshake className="text-rose-500" size={24} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 animate-pulse">
          <CalendarHeart className="text-rose-500 animate-spin" />
        </div>
        <p className="text-gray-500 font-medium">Loading Services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadServices} className="bg-rose-500 text-white px-6 py-2 rounded-xl font-bold">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b border-gray-100 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-50 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">服务与善终 (Services)</h1>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-rose-900 shadow-sm">
          <HeartHandshake size={32} className="text-rose-500 mb-4" />
          <h2 className="text-xl font-black mb-2">We’re here for you</h2>
          <p className="text-rose-700 text-sm leading-relaxed">
            Gentle support and coordination for your pet's final journey. From peaceful farewells to creating lasting memories.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Our Services</h3>
          {services.map((svc) => (
            <div key={svc.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                  {getIcon(svc.type)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-800">{svc.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{svc.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <span className="text-lg font-black text-gray-900">${svc.price}</span>
                <button
                  onClick={() => setBookingType(svc.type)}
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingType && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end animate-in fade-in duration-200" onClick={() => setBookingType(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            
            {bookingStatus === 'success' ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="text-green-500" size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Booking Confirmed</h3>
                <p className="text-sm text-gray-500 text-center">We will contact you shortly to confirm the details.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-black text-gray-900 mb-2">Select Date & Time</h3>
                <p className="text-sm text-gray-500 mb-6">When would you like to schedule this service?</p>
                
                <input
                  type="datetime-local"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-base focus:ring-2 focus:ring-gray-900 outline-none mb-6"
                />
                
                <button
                  onClick={handleBook}
                  disabled={bookingStatus === 'loading' || !bookingTime}
                  className={`w-full py-4 rounded-2xl font-black text-white transition-colors ${
                    bookingStatus === 'loading' || !bookingTime ? 'bg-gray-300' : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  {bookingStatus === 'loading' ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
