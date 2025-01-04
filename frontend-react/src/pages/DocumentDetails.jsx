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
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1>Document Details</h1>
      <p><strong>Title:</strong> {doc.title}</p>
      <p><strong>Uploaded At:</strong> {new Date(doc.createdAt).toLocaleString()}</p>
      <a href={`http://localhost:5000/${doc.filePath}`} target="_blank" rel="noopener noreferrer" style={styles.link}>
        View PDF
      </a>
      <button onClick={() => navigate('/dashboard')} style={styles.button}>Back to Dashboard</button>
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: 'auto', padding: '20px' },
  link: { display: 'block', margin: '20px 0', color: 'blue', textDecoration: 'underline' },
  button: { padding: '10px 20px', cursor: 'pointer' },
};

export default DocumentDetails;
