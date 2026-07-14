
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, Attachment } from '../types';
import { sendMessageToJustino } from '../services/justino-service';
import { Send, Paperclip, Scale, ExternalLink, Globe, Loader2, ShieldCheck, AlertCircle, TrendingUp } from 'lucide-react';

interface ChatInterfaceProps {
  user: User;
  messages: Message[];
  onNewMessage: (msg: Message) => void;
  onAddFile: (name: string, type: string, content: string, origin?: 'generated' | 'uploaded') => void;
}

const STRATEGIC_STEPS = [
  "Iniciando Protocolo Specter...",
  "Analizando debilidades de la contraparte...",
  "Fundamentando con Código Civil Federal...",
  "Buscando jurisprudencia ganadora...",
  "Diseñando jugada de jaque mate...",
  "Blindando tu declaración..."
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, messages, onNewMessage, onAddFile }) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const welcomeDispatchedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasWelcome = messages.some(m => m.id === 'welcome');
      if (messages.length === 0 && !hasWelcome && !welcomeDispatchedRef.current) {
        welcomeDispatchedRef.current = true;
        onNewMessage({
          id: 'welcome',
          text: `Hola, soy Justino, tu guía legal digital. Te encuentras en un sitio blindado y seguro; tu información está protegida al 100% y nadie más que tú tiene acceso.\n\nMi objetivo es resolver tu situación legal de principio a fin. Yo me encargaré de explicarte tus opciones, generar cada documento que necesites y decirte exactamente dónde y cómo entregarlos para que tú mismo tomes el control de tu caso sin necesidad de intermediarios ni gastos excesivos.\n\nPara comenzar a trazar tu estrategia, cuéntame: ¿En qué ciudad te encuentras y qué situación legal vamos a solucionar hoy?`,
          sender: 'bot',
          timestamp: new Date(),
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [messages, onNewMessage]);

  useEffect(() => {
    let interval: any;
    if (isSending) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % STRATEGIC_STEPS.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isSending]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachment) || isSending) return;

    const currentInput = input;
    const currentAttachment = attachment;
    
    setInput('');
    setAttachment(null);
    setIsSending(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      text: currentInput || (currentAttachment ? `Analizando: ${currentAttachment.name}` : ""),
      sender: 'user',
      timestamp: new Date(),
      attachment: currentAttachment || undefined
    };
    onNewMessage(userMsg);

    // Save user attachment to Vault as evidence
    if (currentAttachment) {
      onAddFile(
        currentAttachment.name,
        currentAttachment.type,
        currentAttachment.content,
        'uploaded'
      );
    }

    try {
      const response = await sendMessageToJustino(currentInput, messages, currentAttachment || undefined);
      
      // Parse for generated documents wrapped in [DOCUMENTO_OFICIAL: ... ]
      const docRegex = /\[DOCUMENTO_OFICIAL:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\]/gs;
      const docMatches = [...response.text.matchAll(docRegex)];
      
      let finalBotText = response.text;
      
      if (docMatches.length > 0) {
        docMatches.forEach(match => {
          const [fullMatch, title, content, location] = match;
          // Extract data
          onAddFile(
            title.trim(), 
            "Solicitud Legal", 
            `${content.trim()}\n\n---\nUBICACIÓN DE ENTREGA FÍSICA:\n${location.trim()}\n(Presentar en original y 2 copias con identificación oficial)`,
            'generated'
          );
          // Remove the technical block from the visible message
          finalBotText = finalBotText.replace(fullMatch, "");
        });
        
        // Clean up text
        finalBotText = finalBotText.trim();
        if (!finalBotText) {
          finalBotText = "He generado tu documento oficial. Ya lo puedes encontrar en tu Bóveda listo para descargar e imprimir.";
        }
      }

      onNewMessage({
        id: crypto.randomUUID(),
        text: finalBotText,
        sender: 'bot',
        timestamp: new Date(),
        sources: response.sources && response.sources.length > 0 ? response.sources : undefined
      });
    } catch (error: any) {
      onNewMessage({ 
        id: 'error-' + Date.now(), 
        text: `Tengo una interferencia en el sistema. (${error.message || error})`, 
        sender: 'bot', 
        timestamp: new Date() 
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`max-w-[85%] md:max-w-[75%] ${
              msg.sender === 'user' 
                ? 'bg-navy-900 text-white rounded-3xl rounded-tr-none px-6 py-5 shadow-xl' 
                : 'bg-white text-navy-900 rounded-3xl rounded-tl-none px-8 py-7 shadow-sm border border-slate-100'
            }`}>
              <div className="space-y-4">
                <div className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium">
                  {msg.text}
                </div>
                
                {msg.sources && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Globe className="w-3 h-3 text-emerald-500" /> Precedentes Estratégicos
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-navy-900 hover:border-emerald-500 transition-all">
                          <ExternalLink className="w-3 h-3 text-emerald-600" /> <span className="truncate max-w-[180px]">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isSending && (
           <div className="flex w-full justify-start animate-fade-in-up">
             <div className="bg-white px-8 py-6 rounded-3xl rounded-tl-none shadow-2xl flex items-center gap-6 border-l-4 border-emerald-500">
               <div className="relative">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-500 animate-pulse" />
                  </div>
                  <Loader2 className="w-12 h-12 text-emerald-500/20 animate-spin absolute inset-0" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-black text-navy-900 tracking-widest uppercase">Estratega en Acción</span>
                 <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.2em] animate-pulse">
                   {STRATEGIC_STEPS[loadingStep]}
                 </span>
               </div>
             </div>
           </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 p-4 md:p-6 z-20">
        <div className="max-w-4xl mx-auto">
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (re) => setAttachment({ name: file.name, type: file.type, content: re.target?.result as string, isTextExtracted: true });
              reader.readAsDataURL(file);
            }
          }} />

          <form onSubmit={handleSend} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 md:gap-4">
            {/* Desktop Attach Button */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className={`hidden sm:flex p-5 rounded-2xl transition-all items-center justify-center ${attachment ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              <Paperclip className="w-6 h-6" />
            </button>

            <div className="flex-1 flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-end">
              <div className="flex-1 bg-slate-100 rounded-2xl border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-inner relative">
                {attachment && (
                  <div className="absolute -top-12 left-0 right-0 p-2">
                    <div className="bg-navy-900 text-white text-[10px] font-bold px-4 py-1.5 rounded-full flex items-center justify-between shadow-xl">
                      <span className="truncate">Evidencia: {attachment.name}</span>
                      <button type="button" onClick={() => setAttachment(null)} className="ml-4 hover:text-red-400 transition-colors">✕</button>
                    </div>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Describe tu situación..."
                  className="w-full min-h-[64px] max-h-40 p-6 resize-none bg-transparent focus:outline-none text-navy-900 font-bold placeholder:text-slate-400"
                  rows={1}
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Attach Button */}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`sm:hidden flex-1 p-5 rounded-2xl transition-all flex items-center justify-center ${attachment ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  <Paperclip className="w-6 h-6" />
                </button>

                <button 
                  type="submit" 
                  disabled={(!input.trim() && !attachment) || isSending} 
                  className="flex-1 sm:flex-none p-6 bg-navy-900 text-white rounded-2xl hover:bg-emerald-600 disabled:opacity-20 transition-all shadow-xl active:scale-95 shrink-0 flex items-center justify-center"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
           <ShieldCheck className="w-3 h-3 text-emerald-500" /> Bóveda Cifrada Activa
        </div>
      </div>
    </div>
  );
}
