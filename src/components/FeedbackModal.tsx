import React, { useState } from 'react';
import { XCircle, Send, MessageSquare } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';

export const FeedbackModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userProfile } = useApp();
  const [category, setCategory] = useState<'issue' | 'suggestion'>('issue');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: userProfile?.uid,
        userName: userProfile?.name,
        category,
        message,
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full sm:w-[400px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-800">Submit Feedback</h2>
            <p className="text-xs text-slate-500">Report issues or suggest features</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCategory('issue')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl border ${category === 'issue' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
            >
              Report Issue
            </button>
            <button
              type="button"
              onClick={() => setCategory('suggestion')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl border ${category === 'suggestion' ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
            >
              Suggestion
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind..."
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2D8C7C] text-white py-3.5 rounded-2xl font-bold shadow-md hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Feedback</>}
          </button>
        </form>
      </div>
    </div>
  );
};
