// ChatPage.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ChatPage.css';
import ReactMarkdown from 'react-markdown';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm Legal-God AI. How can I assist you with your legal questions today?" }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationList, setConversationList] = useState([]);
  const summarizationTriggeredRef = useRef(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Load conversation history (sidebar)
  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/history', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }
      const data = await response.json();
      setConversationList(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // 2. Start a fresh chat
  const handleNewChat = () => {
    setConversationId(null);
    setMessages([
      { role: 'ai', text: "Hello! I'm Legal-God AI. How can I assist you with your legal questions today?" }
    ]);
    setIsLoading(false);
  };

  // 3. Send a user query to the QA endpoint
  const sendAIQuery = async (query) => {
    if (!query.trim()) return;
  
    try {
      // Add the user's query to the message state
      setMessages((prev) => [...prev, { role: 'user', text: query }]);
      setIsLoading(true);
  
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/chat/ask-ai',
        {
          conversationId: conversationId || null, // Send conversationId if it exists
          query, // Send only the query
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const data = response.data;
  
      // Update conversationId if it changes
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }
  
      // Get the latest AI message and add it to the state
      const latestMessage = data.conversation[data.conversation.length - 1];
      if (latestMessage && latestMessage.role === 'assistant') {
        setMessages((prev) => [...prev, { role: 'ai', text: latestMessage.text }]);
      }
  
      // Optionally reload the conversation list
      if (typeof loadConversations === "function") {
        await loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
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
  

  // 4. Handle user’s “Send” action
  const sendMessage = async (e) => {
    e.preventDefault();
    await sendAIQuery(userMessage);
    setUserMessage('');
  };

  // 5. Selecting a conversation from the sidebar
  const handleSelectConversation = (conv) => {
    setConversationId(conv._id);
    setMessages([
      { role: 'ai', text: "Hello! I'm Legal-God AI. How can I assist you with your legal questions today?" },
      ...conv.conversation,
    ]);
  };

  // 6. Return to Dashboard
  const handleBack = () => {
    navigate('/dashboard');
  };

  // 7. Summarize doc (skip QA)
  const performSummarization = async (docId, mode) => {
    try {
    console.log('performSummarization', docId, mode);
      setIsLoading(true);
        
      const token = localStorage.getItem('token');
      const newConvResponse = await axios.post(
        'http://localhost:5000/api/chat/new',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const newConversationId = newConvResponse.data.conversationId;
      setConversationId(newConversationId);

      // Immediately show a "Summarizing..." message
      setMessages([
        {
          role: 'ai',
          text: "Please wait, I'm summarizing your document..."
        }
      ]);
      const response = await axios.post(
        'http://localhost:5000/api/docAnalysis/summarize',
        { docId, mode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const summary = response.data.summary || 'No summary available';
      setMessages((prev) => [...prev, { role: 'ai', text: summary }]);


      await axios.post(
        `http://localhost:5000/api/chat/${newConversationId}/save-message`,
        { role: 'assistant', text: summary },
        { headers: { Authorization: `Bearer ${token}` } }
      );

    } catch (error) {
      console.error('Summarization error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Failed to retrieve summary.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 8. Load conversations at mount, start a blank chat if no summarization requested
  useEffect(() => {
    loadConversations();

    // If there's no docId/mode, start a normal new chat
    if (!location.state?.docId && !location.state?.mode) {
      handleNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 9. Scroll chat to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 10. Summarization mode detection (prevent double call with `summarizeCalled`)
  useEffect(() => {
    const { docId, mode } = location.state || {};
    if (docId && mode && !summarizationTriggeredRef.current) {
      summarizationTriggeredRef.current = true; // Mark that summarization has been triggered

      // Start a new chat context for summarization
      handleNewChat();
      performSummarization(docId, mode);

      // Clear the state immediately to prevent subsequent triggers
      navigate('/chat', { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  return (
    <div className="chat-page">
      {/* Sidebar for conversation list */}
      <aside className="sidebar">
        <h2>Conversations</h2>
        <ul>
        <button onClick={handleNewChat} className="new-chat-button">
          New Chat
        </button>
          {conversationList.length > 0 ? (
            conversationList.map((conv) => (
              <li
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={conv._id === conversationId ? 'active' : ''}
              >
                {conv.conversation.length > 0
                  ? conv.conversation[conv.conversation.length - 1].text.slice(0, 30) + '...'
                  : 'New Conversation'}
                <span className="timestamp">
                  {new Date(conv.createdAt).toLocaleString()}
                </span>
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
                <ReactMarkdown>{msg.text}</ReactMarkdown>
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
          <button type="button" onClick={handleBack} className="back-button">
            Go back
          </button>
        </form>
      </main>
    </div>
  );
};

export default ChatPage;
