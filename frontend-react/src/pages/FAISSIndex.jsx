// src/pages/FAISSIndex.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function FAISSIndex() {
  const [indexInfo, setIndexInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchIndexInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchIndexInfo = async () => {
    try {
      const token = localStorage.getItem('token'); // Ensure admin token is stored
      const response = await axios.get('http://localhost:8000/faiss/index', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIndexInfo(response.data.faiss_index);
    } catch (err) {
      console.error('FAISS Index fetch error:', err);
      setError(true);
      alert('Failed to fetch FAISS index information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>FAISS Index Details</h1>
      {loading && <p>Loading FAISS index information...</p>}
      {error && <p style={styles.error}>Failed to fetch FAISS index information.</p>}
      {indexInfo && (
        <div style={styles.infoContainer}>
          <p><strong>Dimension:</strong> {indexInfo.dimension}</p>
          <p><strong>Number of Vectors:</strong> {indexInfo.number_of_vectors}</p>
          <p><strong>Metric Type:</strong> {getMetricType(indexInfo.metric)}</p>
          {/* Add more details as needed */}
        </div>
      )}
      <div style={styles.navButtons}>
        <button
          onClick={() => navigate('/faiss-documents')}
          style={styles.navButton}
        >
          View FAISS Documents
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

// Utility function to map FAISS metric type constants to readable strings
const getMetricType = (metric) => {
  switch (metric) {
    case 0:
      return 'L2';
    case 1:
      return 'Inner Product';
    // Add other metric types as defined in FAISS if necessary
    default:
      return 'Unknown';
  }
};

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
  infoContainer: {
    backgroundColor: '#3c4048',
    padding: '20px',
    borderRadius: '8px',
    display: 'inline-block',
    textAlign: 'left',
    marginBottom: '20px',
  },
  error: {
    color: '#dc3545',
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
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

export default FAISSIndex;
