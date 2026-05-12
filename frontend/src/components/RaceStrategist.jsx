import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Trash2, Zap, ChevronDown, Loader, Mic } from 'lucide-react';

const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8001/api' : '/api';

const SUGGESTED_QUESTIONS = [
    "Why did the leader pit when they did?",
    "Who had the fastest theoretical lap today?",
    "Which driver improved the most lap-over-lap?",
    "Explain the Safety Car's impact on the race strategy.",
    "Who had the best tyre management in this race?",
    "What was the biggest strategic mistake today?",
    "Compare the top 3 drivers' sector times.",
    "Which team had the fastest pit stop?",
];

const TypingDots = () => (
    <div className="flex items-end gap-1 py-1">
        {[0, 1, 2].map(i => (
            <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-400"
                style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
            />
        ))}
    </div>
);

const MessageBubble = ({ msg }) => {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-br from-purple-600 to-blue-700 text-white'
                }`}>
                {isUser ? 'U' : <Bot size={14} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed
                ${isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-[#1b1d24] border border-[#2b2e36] text-gray-200 rounded-tl-none'
                }`}>
                {msg.role === 'assistant' && msg.streaming && !msg.content ? (
                    <TypingDots />
                ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.provider && (
                    <div className="mt-1.5 flex items-center gap-1">
                        <Zap size={9} className="text-yellow-400" />
                        <span className="text-[10px] text-gray-500">via Groq / {msg.provider}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const RaceStrategist = ({ year, round, sessionType, drivers = [], allDrivers = [] }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `👋 I'm your AI Race Strategist, powered by **Groq + LLaMA 3.3**.\n\nLoad a session and ask me anything — pit strategies, lap analyses, driver comparisons, flag impacts, theoretical lap times. I have full telemetry context injected into every answer.`,
        }
    ]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const abortRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(scrollToBottom, [messages]);

    const sendQuestion = useCallback(async (question) => {
        if (!question.trim() || isStreaming) return;

        const userMsg = { role: 'user', content: question };
        const assistantMsg = { role: 'assistant', content: '', streaming: true };

        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setInput('');
        setIsStreaming(true);
        setShowSuggestions(false);

        // Build history for context (last 6 turns)
        const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

        try {
            abortRef.current = new AbortController();
            const res = await fetch(`${API_BASE}/strategist/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    year: parseInt(year),
                    round: parseInt(round),
                    session_type: sessionType,
                    drivers: drivers,
                    history,
                }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Request failed');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullText = '';
            let providerName = 'llama-3.3-70b';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]') break;
                    try {
                        const obj = JSON.parse(payload);
                        if (obj.provider) providerName = obj.provider;
                        if (obj.token) {
                            fullText += obj.token;
                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = {
                                    ...updated[updated.length - 1],
                                    content: fullText,
                                    streaming: true,
                                };
                                return updated;
                            });
                        }
                    } catch { /* partial JSON — skip */ }
                }
            }

            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: fullText || '[No response]',
                    streaming: false,
                    provider: providerName,
                };
                return updated;
            });

        } catch (err) {
            if (err.name === 'AbortError') return;
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: `⚠️ Error: ${err.message}. Make sure a race session is loaded and the backend is running.`,
                    streaming: false,
                };
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    }, [isStreaming, messages, year, round, sessionType, drivers]);

    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = useRef(null);

    useEffect(() => {
        if (SpeechRecognition) {
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'en-US';

            recognition.current.onstart = () => {
                setIsListening(true);
            };

            recognition.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                // Optionally auto-send: sendQuestion(transcript);
                // But letting the user review it might be better, we will auto-send for seamless experience:
                setTimeout(() => sendQuestion(transcript), 300);
            };

            recognition.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognition.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [sendQuestion]);

    const toggleListening = () => {
        if (isListening) {
            recognition.current?.stop();
        } else {
            setInput('');
            recognition.current?.start();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendQuestion(input);
    };

    const clearChat = () => {
        if (abortRef.current) abortRef.current.abort();
        setMessages([{
            role: 'assistant',
            content: `Chat cleared. Ask me anything about the ${year} session!`,
        }]);
        setIsStreaming(false);
        setShowSuggestions(true);
    };

    const sessionLabel = round
        ? `${year} — Round ${round} (${sessionType})`
        : 'No session loaded';

    return (
        <div className="flex flex-col h-full bg-[#0b0d10] text-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b2e36] bg-[#16181d] shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center shadow-lg">
                        <Bot size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white tracking-wide">AI Race Strategist</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Zap size={9} className="text-yellow-400" />
                            Groq · LLaMA 3.3 70B · {sessionLabel}
                        </p>
                    </div>
                </div>
                <button
                    onClick={clearChat}
                    title="Clear chat"
                    className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-950/30"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Context badge */}
            {drivers.length > 0 && (
                <div className="px-4 py-2 bg-[#0f1117] border-b border-[#1e2028] flex items-center gap-2 text-[11px] text-gray-500 shrink-0">
                    <span className="text-gray-600">Analysing:</span>
                    <div className="flex gap-1.5">
                        {drivers.map(d => {
                            const info = allDrivers.find(a => a.abbreviation === d);
                            const color = info?.team_color || '3b82f6';
                            return (
                                <span
                                    key={d}
                                    className="px-2 py-0.5 rounded font-bold font-mono text-[10px]"
                                    style={{ background: `#${color}22`, color: `#${color}`, border: `1px solid #${color}55` }}
                                >
                                    {d}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} />
                ))}

                {/* Suggested questions */}
                {showSuggestions && (
                    <div className="mt-4">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2 font-bold">
                            Suggested questions
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendQuestion(q)}
                                    className="text-xs px-3 py-1.5 rounded-full border border-[#2b2e36] text-gray-400 hover:text-white hover:border-blue-500/60 hover:bg-blue-600/10 transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                className="shrink-0 border-t border-[#2b2e36] bg-[#16181d] px-4 py-3 flex gap-2 items-end"
            >
                <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendQuestion(input);
                        }
                    }}
                    placeholder={round ? "Ask about strategy, lap times, tyres, incidents…" : "Load a race session first, then ask anything…"}
                    disabled={isStreaming}
                    className="flex-1 resize-none bg-[#0b0d10] border border-[#2b2e36] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50 min-h-[38px] max-h-[120px]"
                    style={{ fieldSizing: 'content' }}
                />
                
                {SpeechRecognition && (
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={isStreaming}
                        className={`flex-shrink-0 w-9 h-9 rounded-lg transition-all flex items-center justify-center shadow-md ${
                            isListening 
                                ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50' 
                                : 'bg-[#1b1d24] text-gray-400 hover:text-white border border-[#2b2e36] hover:border-gray-500'
                        }`}
                        title="Voice Query"
                    >
                        <Mic size={14} />
                    </button>
                )}

                <button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-md"
                >
                    {isStreaming ? (
                        <Loader size={14} className="text-white animate-spin" />
                    ) : (
                        <Send size={14} className="text-white" />
                    )}
                </button>
            </form>
        </div>
    );
};

export default RaceStrategist;
