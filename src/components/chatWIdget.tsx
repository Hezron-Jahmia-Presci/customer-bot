'use client';
import { useState, useEffect, useRef } from 'react';
import UserInfoForm from './userInfoForm';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
    const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);



    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ✅ Load from memory
    useEffect(() => {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        }
    }, []);

    // ✅ Save to memory
    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: { sender: 'user' | 'bot'; text: string } = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    history: messages,
                    name: userInfo?.name,
                    email: userInfo?.email,
                }),
            });

            const data = await res.json();
            const botMessage: { sender: 'user' | 'bot'; text: string } = { sender: 'bot', text: data.reply };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Error: Something went wrong.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <button
                className="toggleButton"
                onClick={() => setIsOpen(prev => !prev)}
            >
                🗨️
            </button>

            {isOpen && (
                <div className="chatBox">
                    {!userInfo ? (
                        <UserInfoForm onSubmit={(info) => setUserInfo(info)} />
                    ) : (
                        <>
                            <div className="chatHeader">Hi {userInfo.name}, how can I help you today?</div>
                            <div className="messages">
                                {messages.map((msg, index) => (
                                    <div key={index} className={msg.sender}>
                                        {msg.text}
                                    </div>
                                ))}
                                {loading && <div className="bot">Typing...</div>}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="inputBox">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask me anything..."
                                />
                                <button onClick={handleSend}>Send</button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
