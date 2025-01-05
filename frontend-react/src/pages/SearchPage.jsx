// src/pages/SearchPage.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(3);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      alert('Please enter a search query.');
      return;
    }

    setSearching(true);
    setResults([]);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('query', query);
      formData.append('top_k', topK);

      const response = await axios.post(
        'http://localhost:8000/search',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            // Include Authorization header if required
            // Authorization: `Bearer ${token}`,
          },
        }
      );

      setResults(response.data.results);
      if (response.data.results.length === 0) {
        alert('No similar document chunks found.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.detail || 'Search failed. Please try again.');
      alert(err.response?.data?.detail || 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Utility function to highlight query terms in the text
  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Search Similar Document Chunks</h1>
      <form onSubmit={handleSearch} style={styles.form}>
        <textarea
          placeholder="Enter your search query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.textarea}
          rows="4"
          required
        />
        <input
          type="number"
          placeholder="Number of top results (default 3)"
          value={topK}
          onChange={(e) => setTopK(e.target.value)}
          style={styles.input}
          min="1"
          max="100"
        />
        <div style={styles.navButtons}>
        <button
          type="submit"
          style={styles.button}
          disabled={searching || !query.trim()}
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={styles.button}
        >
          Back to Dashboard
        </button>
        </div>
      </form>

      {/* Display Error Message */}
      {error && (
        <div style={{ ...styles.error, backgroundColor: '#dc3545' }}>
          {error}
        </div>
      )}

      {/* Display Search Results */}
      {results.length > 0 && (
        <div style={styles.resultsContainer}>
          <h2>Search Results</h2>
          <ul style={styles.resultsList}>
            {results.map((result, index) => (
              <li key={index} style={styles.resultItem}>
                <h3>Document ID: {result.doc_id}</h3>
                <p><strong>Title:</strong> {result.title}</p>
                <p><strong>Uploaded At:</strong> {new Date(result.uploadDate).toLocaleString()}</p>
                <p>{highlightText(result.text, query)}</p>
                <p>Similarity Score: {result.similarity.toFixed(4)}</p>
                <button
                  onClick={() => navigate(`/documents/${result.doc_id}`)}
                  style={styles.viewButton}
                >
                  View Document
                </button>
                
                {/* Add Feedback Buttons if desired */}
                {/* <button onClick={() => handleFeedback(result.doc_id, 'relevant')} style={styles.feedbackButton}>Relevant</button>
                <button onClick={() => handleFeedback(result.doc_id, 'irrelevant')} style={styles.feedbackButton}>Irrelevant</button> */}
              </li>
            ))}
          </ul>
        </div>
      )}
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
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    maxWidth: '600px',
    margin: '0 auto 30px auto',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    resize: 'vertical',
    backgroundColor: '#3c4048',
    color: '#fff',
    outline: 'none',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: '#3c4048',
    color: '#fff',
    outline: 'none',
  },
  button: {
    padding: '12px 20px',
    fontSize: '16px',
    borderRadius: '4px',
    backgroundColor: '#17a2b8',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    transition: 'background-color 0.3s',
  },
  error: {
    maxWidth: '600px',
    margin: '0 auto 20px auto',
    padding: '10px',
    borderRadius: '4px',
    textAlign: 'center',
    color: '#fff',
  },
  resultsContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  resultsList: {
    listStyle: 'none',
    padding: 0,
  },
  resultItem: {
    padding: '15px',
    backgroundColor: '#3c4048',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  viewButton: {
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: '#61dafb',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    color: '#000',
    marginTop: '10px',
    transition: 'background-color 0.3s',
  },
  // Optional Feedback Button Styles
  feedbackButton: {
    padding: '6px 10px',
    fontSize: '12px',
    backgroundColor: '#ffc107',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    color: '#000',
    marginTop: '10px',
    marginRight: '5px',
    transition: 'background-color 0.3s',
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
  }
};

export default SearchPage;
