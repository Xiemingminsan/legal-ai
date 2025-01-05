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
        const { data } = await axios.post(
          'http://localhost:5000/api/chat/message',
          { conversationId, userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        setConversationId(data._id);
        setMessages(data.conversation);
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
        <div style={styles.header}>
          <h1 style={styles.title}>Chat with Legal-God AI</h1>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
        <div style={styles.chatBox}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={m.role === 'user' ? styles.userMessage : styles.assistantMessage}
            >
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
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <button onClick={sendMessage} style={styles.sendButton}>
            Send
          </button>
        </div>
      </div>
    );
  }
  
  
const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      padding: '20px',
      backgroundColor: '#1e1e2f',
      color: '#fff',
      overflow: 'hidden',
    },
    header: {
      width: '100%',
      maxWidth: '800px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#fff',
    },
    logoutButton: {
      padding: '10px 15px',
      backgroundColor: '#61dafb',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      cursor: 'pointer',
      color: '#000',
      transition: 'background-color 0.3s',
    },
    chatBox: {
      width: '100%',
      maxWidth: '800px',
      borderRadius: '8px',
      backgroundColor: '#282c34',
      padding: '20px',
      height: '400px',
      overflowY: 'auto',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      marginBottom: '20px',
    },
    userMessage: {
      textAlign: 'right',
      margin: '10px 0',
      padding: '10px',
      borderRadius: '8px',
      backgroundColor: '#61dafb',
      color: '#000',
      maxWidth: '70%',
      alignSelf: 'flex-end',
    },
    assistantMessage: {
      textAlign: 'left',
      margin: '10px 0',
      padding: '10px',
      borderRadius: '8px',
      backgroundColor: '#3c4048',
      color: '#fff',
      maxWidth: '70%',
      alignSelf: 'flex-start',
    },
    inputContainer: {
      width: '100%',
      maxWidth: '800px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      backgroundColor: '#282c34',
      borderRadius: '8px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    },
    input: {
      flex: 1,
      padding: '12px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '16px',
      backgroundColor: '#3c4048',
      color: '#fff',
      outline: 'none',
    },
    sendButton: {
      padding: '12px 20px',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '4px',
      backgroundColor: '#61dafb',
      border: 'none',
      cursor: 'pointer',
      color: '#000',
      transition: 'background-color 0.3s',
    },
  };
  
  export default ChatPage;
  