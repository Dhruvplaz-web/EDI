'use client'

import { useState, useRef, useEffect } from 'react';
import { FileText, Send, User, Bot, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'bot' | 'user';
  content: string;
}

export function IntakeForms() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Hi Sarah. I'm Praxis, your clinical assistant. To prepare Dr. Jenkins for your session, I need to ask a few questions. First, how have you been sleeping over the past week?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [completed, setCompleted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = "";
      
      // Simulated dynamic follow-up logic based on keywords
      if (messages.length === 1) {
        if (userMessage.toLowerCase().includes('bad') || userMessage.toLowerCase().includes('not') || userMessage.toLowerCase().includes('sleep')) {
          botResponse = "I'm sorry to hear that. When you can't sleep, do you feel physically restless or is your mind racing with anxious thoughts?";
        } else {
          botResponse = "Understood. Have you experienced any physical symptoms of anxiety lately, such as a racing heart or tight chest?";
        }
      } else if (messages.length === 3) {
        if (userMessage.toLowerCase().includes('racing') || userMessage.toLowerCase().includes('anxious')) {
          botResponse = "Racing thoughts can be exhausting. On a scale of 1-10, how much is this interfering with your daily focus and work?";
        } else {
          botResponse = "Noted. Are you still taking your Escitalopram 10mg daily as prescribed, or have you missed any doses?";
        }
      } else if (messages.length === 5) {
         botResponse = "Thank you for sharing, Sarah. I've compiled this into a clinical summary (including your PHQ-9/GAD-7 baseline metrics) for Dr. Jenkins. You're all set for your consultation.";
         setCompleted(true);
      }

      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 text-slate-900 font-sans flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b border-slate-100 shrink-0">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <span className="flex items-center"><FileText className="w-4 h-4 mr-2 text-indigo-600" /> Pre-Consultation Smart Intake</span>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-full border border-indigo-200">Dynamic AI Screener</span>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          A conversational intake process that dynamically adapts to your symptoms to build a clinical profile.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 ml-3' : 'bg-teal-600 mr-3'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start">
               <div className="flex items-start max-w-[80%] flex-row">
                 <div className="w-8 h-8 rounded-full bg-teal-600 mr-3 flex items-center justify-center shrink-0">
                   <Bot className="w-4 h-4 text-white" />
                 </div>
                 <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm flex space-x-1 items-center h-10">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
               </div>
             </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {completed ? (
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center text-teal-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" /> Intake Completed and Sent to Dr. Jenkins
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your response..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
              disabled={isTyping}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="icon" className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0">
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
