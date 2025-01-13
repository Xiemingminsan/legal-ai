// ChatPage.jsx
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
    const [conversationList, setConversationList] = useState([]);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Function to load conversations from the backend
    const loadConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Token:', token);

            const response = await fetch('http://localhost:5000/api/chat/history', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            console.log('Response Status:', response.status);
            console.log('Content Type:', response.headers.get('Content-Type'));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response Error Text:', errorText);
                throw new Error(`Failed to fetch conversations: ${response.status}`);
            }

            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Expected JSON response but received HTML or other content.');
            }

            const data = await response.json();
            console.log('Fetched Data:', data);
            setConversationList(data);

            // If there's no current conversation selected, load the most recent one
            if (data.length > 0 && !conversationId) {
                const recentConversation = data[0];
                setConversationId(recentConversation._id);
                setMessages([
                    { role: 'ai', text: "Hello! I'm Legal-God AI. How can I assist you with your legal questions today?" },
                    ...recentConversation.conversation
                ]);
            }

        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    // Function to send a message to the backend
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!userMessage.trim()) return;

        try {
            // Add user message to UI immediately
            setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
            setIsLoading(true);
            const currentMessage = userMessage;
            setUserMessage('');

            const token = localStorage.getItem('token');
            console.log('Token for sendMessage:', token);

            const response = await axios.post(
                'http://localhost:5000/api/chat/ask-ai',
                {
                    query: currentMessage,
                    conversationId: conversationId,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;
            console.log('AI Response Data:', data);

            // Update conversation ID if it's a new conversation
            if (data.conversationId && data.conversationId !== conversationId) {
                setConversationId(data.conversationId);
            }

            // Get the latest AI response
            const latestMessage = data.conversation[data.conversation.length - 1];
            if (latestMessage && latestMessage.role === 'assistant') {
                setMessages(prev => [...prev, { role: 'ai', text: latestMessage.text }]);
            }

            // Optionally, refresh the conversation list after sending a message
            await loadConversations();

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

    // Function to handle selecting a conversation from the sidebar
    const handleSelectConversation = (conv) => {
        console.log('Selected conversation:', conv);
        setConversationId(conv._id);
        setMessages([
            { role: 'ai', text: "Hello! I'm Legal-God AI. How can I assist you with your legal questions today?" },
            ...conv.conversation
        ]);
    };

    // Function to handle back navigation
    const handleBack = () => {
        navigate('/dashboard');
    };

    // Load conversations on component mount
    useEffect(() => {
        loadConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroll to the bottom of the messages when they update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="chat-page">
            {/* Sidebar for conversation list */}
            <aside className="sidebar">
                <h2>Conversations</h2>
                <ul>
                    {conversationList.length > 0 ? (
                        conversationList.map((conv) => (
                            <li
                                key={conv._id}
                                onClick={() => handleSelectConversation(conv)}
                                className={conv._id === conversationId ? 'active' : ''}
                            >
                                {/* Display the most recent message as a preview */}
                                {conv.conversation.length > 0
                                    ? conv.conversation[conv.conversation.length - 1].text.slice(0, 30) + '...'
                                    : 'New Conversation'}
                                <span className="timestamp">{new Date(conv.createdAt).toLocaleString()}</span>
                            </li>
                        ))
                    ) : (
                        <p>No conversations yet</p>
                    )}
                </ul>
            </aside>

            {/* Main chat container */}
            <main className="chat-container">
                <header className="chat-header">
                    <h1>Chat with Legal-God AI</h1>
                </header>
                <div className="messages-container">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role}`}>
                            <div className="avatar">
                                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className="message-content">
                                <p>{msg.text}</p>
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
            </main>
        </div>
    );
};

export default ChatPage;
