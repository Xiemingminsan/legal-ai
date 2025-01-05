// src/pages/FAISSDocuments.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FAISSDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token'); // Ensure admin token is stored
      const response = await axios.get('http://localhost:8000/faiss/documents', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDocuments(response.data.documents);
    } catch (err) {
      console.error('FAISS Documents fetch error:', err);
      setError(true);
      alert('Failed to fetch FAISS documents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>FAISS Stored Documents</h1>
      {loading && <p>Loading FAISS documents...</p>}
      {error && <p style={styles.error}>Failed to fetch FAISS documents.</p>}
      {documents.length > 0 ? (
        <div style={styles.documentsContainer}>
          {documents.map((doc, index) => (
            <div key={index} style={styles.documentCard}>
              <h3>Document ID: {doc.doc_id}</h3>
              <p><strong>Text:</strong> {doc.text}</p>
              <p><strong>Embedding:</strong></p>
              <pre style={styles.embedding}>{JSON.stringify(doc.embedding, null, 2)}</pre>
            </div>
          ))}
        </div>
      ) : (
        !loading && <p>No documents found in FAISS database.</p>
      )}
      <div style={styles.navButtons}>
        <button
          onClick={() => navigate('/faiss')}
          style={styles.navButton}
        >
          Back to FAISS Index
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={styles.navButton}
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
        minHeight: '100vh',
        width: '100vw',
        color: '#fff',
    },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
  },
  documentsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    maxWidth: '1000px',
    margin: '0 auto 20px auto',
  },
  documentCard: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#3c4048',
    borderRadius: '8px',
    textAlign: 'left',
  },
  embedding: {
    backgroundColor: '#282c34',
    padding: '10px',
    borderRadius: '4px',
    overflowX: 'auto',
  },
  error: {
    color: '#dc3545',
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '20px',
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: '#17a2b8',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
};

export default FAISSDocuments;
