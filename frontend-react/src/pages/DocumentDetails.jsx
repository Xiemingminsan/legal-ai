// src/pages/DocumentDetails.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
  
  function DocumentDetails() {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const navigate = useNavigate();
  
    useEffect(() => {
      fetchDoc();
    }, [id]);
  
    const fetchDoc = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`http://localhost:5000/api/documents/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoc(data);
      } catch (err) {
        console.error(err.response?.data?.msg || err.message);
        alert(err.response?.data?.msg || 'Failed to fetch document details');
      }
    };
  
    if (!doc) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>Loading...</h1>
          </div>
        </div>
      );
    }
  
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Document Details</h1>
          <p style={styles.detail}>
            <strong>Title:</strong> {doc.title}
          </p>
          <p style={styles.detail}>
            <strong>Uploaded At:</strong> {new Date(doc.createdAt).toLocaleString()}
          </p>
          <a
            href={`http://localhost:5000/${doc.filePath}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            View PDF
          </a> 
          <br>  </br>
          <button
            onClick={() => navigate('/dashboard')}
            style={styles.button}
          >
            Back to Dashboard
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
      padding: '20px',
      backgroundColor: '#1e1e2f',
      height: '100vh',
      width: '100vw',
      color: '#fff',
      overflow: 'hidden',
    },
    card: {
      width: '100%',
      maxWidth: '600px',
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#282c34',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      textAlign: 'center',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    detail: {
      fontSize: '18px',
      margin: '10px 0',
    },
    link: {
      display: 'inline-block',
      margin: '20px 0',
      padding: '10px 15px',
      backgroundColor: '#61dafb',
      borderRadius: '4px',
      textDecoration: 'none',
      color: '#000',
      fontWeight: 'bold',
      transition: 'background-color 0.3s',
    },
    button: {
      padding: '10px 20px',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '4px',
      backgroundColor: '#61dafb',
      border: 'none',
      cursor: 'pointer',
      color: '#000',
      marginTop: '20px',
      transition: 'background-color 0.3s',
    },
  };

  export default DocumentDetails;
  