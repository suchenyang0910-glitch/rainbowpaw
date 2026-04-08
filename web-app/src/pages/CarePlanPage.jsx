import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ChevronLeft, Sparkles, CheckCircle2, ShieldCheck, HeartPulse, Clock } from 'lucide-react';

export default function CarePlanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);
  const [error, setError] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const res = await api.carePlan();
      setPlanData(res);
    } catch (e) {
      setError(e.message || '加载护理方案失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!planData?.recommendedPack) return;
    try {
      setSubscribing(true);
      // We assume planData.recommendedPack has an id or we use a generic planId for now
      await api.careSubscribe(planData.recommendedPack.id || 'care_001');
      setSubscribed(true);
    } catch (e) {
      alert(e.message || '订阅失败');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 animate-pulse">
          <Sparkles className="text-blue-500 animate-spin" />
        </div>
        <p className="text-gray-500 font-medium">AI 正在为您生成专属护理方案...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadPlan} className="bg-blue-500 text-white px-6 py-2 rounded-xl font-bold">
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
        <h1 className="text-lg font-bold text-gray-800">专属护理方案 (Care Plan)</h1>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 opacity-90">
              <Sparkles size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">AI Powered</span>
            </div>
            <h2 className="text-2xl font-black mb-2">Based on your pet's profile</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              We’ll help your pet live more comfortably with these personalized recommendations.
            </p>

            <div className="space-y-3">
              {planData?.plan?.map((item, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {planData?.recommendedPack && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-gray-800 mb-1">Recommended Plan</h3>
                <p className="text-sm text-gray-500">{planData.recommendedPack.name}</p>
              </div>
              <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <ShieldCheck size={14} /> Recommended
              </div>
            </div>

            <div className="flex items-end gap-2 mb-6">
              <span className="text-4xl font-black text-gray-900">${planData.recommendedPack.price}</span>
              <span className="text-sm text-gray-400 font-medium mb-1">/ month</span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-blue-500"><HeartPulse size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Monthly Care Pack</p>
                  <p className="text-xs text-gray-500">Includes prescribed diet, supplements, and care items.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-blue-500"><Clock size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Regular Check-ins</p>
                  <p className="text-xs text-gray-500">Automated reminders and AI vet support.</p>
                </div>
              </div>
            </div>

            {subscribed ? (
              <div className="w-full bg-green-50 text-green-600 py-4 rounded-2xl font-black text-center border border-green-100">
                已订阅 (Subscribed)
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-transform ${
                  subscribing ? 'bg-gray-400' : 'bg-gray-900 active:scale-95 hover:bg-gray-800'
                }`}
              >
                {subscribing ? 'Processing...' : 'Subscribe Care Pack'}
              </button>
            )}
            
            <button className="w-full mt-3 py-3 text-sm font-bold text-gray-500 hover:text-gray-800">
              💬 Ask AI Vet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
