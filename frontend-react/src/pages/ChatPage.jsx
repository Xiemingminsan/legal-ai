import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChatPage.css';

const ChatPage = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hello! I'm Legal-God AI. How can I assist you with your legal questions today?" }
    ]);
    const [userMessage, setUserMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Function to send message to backend
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!userMessage.trim()) return;
    
        try {
            // Add user message to UI immediately
            setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
            setIsLoading(true);
            setUserMessage('');
    
            // Get the token from localStorage
            const token = localStorage.getItem('token'); // or get it from your app's state
    
            console.log('Token:', token);
    
            // Send request to backend using axios
            const response = await axios.post(
                'http://localhost:5000/api/chat/ask-ai', // Updated backend URL
                {
                    query: userMessage,
                    conversationId: conversationId,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // Add the token to headers
                    },
                }
            );
    
            const data = response.data;
    
            // Update conversation ID if it's a new conversation
            if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
            }
    
            // Get the latest AI response
            const latestMessage = data.conversation[data.conversation.length - 1];
            if (latestMessage && latestMessage.role === 'assistant') {
                setMessages(prev => [...prev, { role: 'ai', text: latestMessage.text }]);
            }
    
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    text: "I apologize, but I'm having trouble processing your request. Please try again.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Load previous conversation if available
    useEffect(() => {
        const loadConversation = async () => {
            try {
                const response = await fetch('/api/chat/history');
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        // Load most recent conversation
                        const recentConversation = data[0];
                        setConversationId(recentConversation._id);
                        setMessages([
                            { role: 'ai', text: "Hello! I'm Legal-God AI. How can I assist you with your legal questions today?" },
                            ...recentConversation.conversation
                        ]);
                    }
                }
            } catch (error) {
                console.error('Error loading conversation:', error);
            }
        };

        loadConversation();
    }, []);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle back navigation
    const handleBack = () => {
        navigate('/dashboard');
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <h1>Chat with Legal-God AI</h1>
            </header>
            <div className="messages-container">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <div className="message-content">
                            <p>{msg.text}</p>
                        </div>
                        <div className="avatar">
                            {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message ai">
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef}></div>
            </div>
            <form onSubmit={sendMessage} className="chat-form">
                <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Type your legal question..."
                    className="chat-input"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} className="send-button">
                    <Send size={24} />
                </button>
                <button 
                    type="button"
                    onClick={handleBack}
                    className="back-button"
                >
                    Go back
                </button>
            </form>
        </div>
    );
};

export default ChatPage;