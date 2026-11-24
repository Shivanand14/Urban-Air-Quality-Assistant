import React, { useState } from 'react';
import { Send, Shield } from 'lucide-react';
import type {
  AirQualitySnapshot,
  ChatMessage,
  FamilyMemberProfile,
} from '../types/breathewise.ts';

interface AiAssistantViewProps {
  airQuality: AirQualitySnapshot | null;
  familyMembers: FamilyMemberProfile[];
}

const SUGGESTED_QUESTIONS = [
  'Is it a good time to take my child outside?',
  'Should I open windows today?',
  'What should we do when AQI reaches 300?',
  'How can I improve our bedroom air quality?',
];

export function AiAssistantView({ airQuality, familyMembers }: AiAssistantViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Ask any question about current air quality, window ventilation, school commutes, or indoor protection for your family. I use your active city AQI and family profile while clearly separating measured data from general guidance.',
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async (questionText: string) => {
    const clean = questionText.trim();
    if (!clean || !airQuality || sending) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: clean,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: clean,
          history: messages,
          airQuality,
          familyMembers,
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        sourceMode?: 'gemini' | 'rule-based';
        error?: string;
      };

      const replyText =
        data.reply ||
        data.error ||
        'Unable to answer right now. Please check your connection and try again.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyText,
          sourceMode: data.sourceMode,
          timestamp: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Network error while contacting BreatheWise AI. Please verify your connection and retry.',
          timestamp: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Ask BreatheWise AI
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Context-aware answers grounded in {airQuality?.city ?? 'your city'} ({airQuality?.cpcbAqi ?? '—'} CPCB AQI · {airQuality?.dataMode === 'demo' ? 'Demonstration Mode' : 'Live Feed'}) and {familyMembers.length} family {familyMembers.length === 1 ? 'profile' : 'profiles'}.
        </p>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={sending || !airQuality}
            onClick={() => sendMessage(q)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-teal-600 hover:text-teal-900 rounded-lg transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Conversation Surface */}
      <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                {msg.content}
              </div>
              <span className="mt-1 text-[11px] text-slate-400 font-mono-num">
                {msg.timestamp}
                {msg.sourceMode === 'gemini'
                  ? ' · Gemini AI'
                  : msg.sourceMode === 'rule-based'
                  ? ' · Rule-Based Safety Engine'
                  : ''}
              </span>
            </div>
          ))}
          {sending && (
            <div className="text-xs text-slate-500">BreatheWise AI is analyzing current readings...</div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-4 border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about outdoor play, masks, window timing, or indoor air..."
            disabled={sending || !airQuality}
            className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || !airQuality}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>

      <p className="text-xs text-slate-500 flex items-center gap-2">
        <Shield className="w-4 h-4 text-slate-400 shrink-0" />
        Informational guidance only. Seek professional medical attention promptly for wheezing, breathlessness, chest discomfort, or worsening asthma symptoms.
      </p>
    </div>
  );
}
