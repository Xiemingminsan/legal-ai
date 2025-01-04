// src/pages/ChatPage.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function ChatPage() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchChatHistory();
    // eslint-disable-next-line
  }, []);

  const fetchChatHistory = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.length > 0) {
        setConversationId(data[0]._id);
        setMessages(data[0].messages);
      }
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      alert(err.response?.data?.msg || 'Failed to fetch chat history');
    }
  };

  const sendMessage = async () => {
    if (userMessage.trim() === '') return;
    try {
      // Send user message
      const { data } = await axios.post(
        'http://localhost:5000/api/chat/message',
        { conversationId, userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConversationId(data._id);
      setMessages(data.conversation);

      // Clear input
      setUserMessage('');

      // Mock assistant reply
      const mockAssistantReply = "I'll get back to you soon! [Mock AI Response]";
      const resp = await axios.post(
        'http://localhost:5000/api/chat/assistant',
        {
          conversationId: data._id,
          assistantMessage: mockAssistantReply,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(resp.data.conversation);
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      alert(err.response?.data?.msg || 'Failed to send message');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div style={styles.container}>
      <h1>Chat with Legal-God AI (Placeholder)</h1>
      <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      <div style={styles.chatBox}>
        {messages.map((m, idx) => (
          <div key={idx} style={m.role === 'user' ? styles.userMessage : styles.assistantMessage}>
            <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong> {m.text}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
          onKeyPress={(e) => { if (e.key === 'Enter') sendMessage(); }}
        />
        <button onClick={sendMessage} style={styles.sendButton}>Send</button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: 'auto', padding: '20px' },
  logoutButton: { float: 'right', padding: '8px 12px', cursor: 'pointer' },
  chatBox: { border: '1px solid #ccc', padding: '10px', height: '400px', overflowY: 'auto', marginBottom: '10px' },
  userMessage: { textAlign: 'right', margin: '10px 0' },
  assistantMessage: { textAlign: 'left', margin: '10px 0' },
  inputContainer: { display: 'flex', gap: '10px' },
  input: { flex: 1, padding: '10px', fontSize: '16px' },
  sendButton: { padding: '10px 20px', fontSize: '16px', cursor: 'pointer' },
};

export default ChatPage;
