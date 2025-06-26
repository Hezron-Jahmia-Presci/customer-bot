'use client';
import { useState } from 'react';

export default function UserInfoForm({ onSubmit }: { onSubmit: (info: { name: string; email: string }) => void }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && email.trim()) {
            onSubmit({ name, email });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="userInfoForm">
            <h2 className="formTitle">Welcome 👋</h2>
            <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <button type="submit">Start Chat</button>
        </form>
    );
}
