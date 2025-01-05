import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0); // New state
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs(data);
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      alert(err.response?.data?.msg || 'Failed to fetch documents');
    }
    
  };const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setProcessingStatus(null);
    setProcessingProgress(0); // Initialize processing progress

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);

      // Upload with progress tracking
      const response = await axios.post(
        'http://localhost:5000/api/documents/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(Math.round(progress));
          },
        }
      );

      const docId = response.data.doc._id;
      console.log('Uploaded Document ID:', docId); // Debugging line

      if (docId) {
        pollProcessingStatus(docId);
      }

      setTitle('');
      setFile(null);
      // fetchDocs(); // Move fetchDocs to after processing completes
      alert('File uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Upload failed');
      setProcessingStatus('failed');
      setProcessingProgress(100);
    } finally {
      setUploading(false);
    }
  };


  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDocs();
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      alert(err.response?.data?.msg || 'Failed to delete document');
    }
  };

  const pollProcessingStatus = async (docId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found.');
      setProcessingStatus('failed');
      return;
    }

    let attempts = 0;
    const maxAttempts = 60; // Maximum attempts (e.g., 5 minutes with 5-second intervals)
    const interval = 5000; // 5 seconds

    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/documents/${docId}/status`, // Corrected template literal
          {
            headers: { Authorization: `Bearer ${token}` }, // Corrected template literal
          }
        );

        const { status, progress, error } = response.data;
        setProcessingStatus(status);
        setProcessingProgress(progress);

        if (status === 'processing' && attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, interval);
        } else if (status === 'completed') {
          setProcessingProgress(100);
          alert('Document processed successfully! You can now search.');
        } else if (status === 'failed') {
          setProcessingProgress(100);
          alert(`Processing failed: ${error}. Please try uploading again.`); // Added backticks
        } else if (attempts >= maxAttempts && status === 'processing') {
          setProcessingProgress(100);
          alert('Processing is taking longer than expected. Please try again later.');
        }
      } catch (error) {
        console.error('Status check failed:', error);
        setProcessingStatus('failed');
        setProcessingProgress(100);
        alert('Failed to fetch processing status. Please try again.');
      }
    };

    checkStatus();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/'); // Redirect to login or home page
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Upload Document</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleUpload} style={styles.form}>
          <input
            type="text"
            placeholder="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.inputFile}
            required
          />
          <button
            type="submit"
            style={styles.button}
            disabled={uploading || !title || !file}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>

          {/* Upload Progress Bar */}
          {uploading && (
            <div style={styles.progressContainer}>
              <div
                style={{
                  ...styles.progressBar,
                  width: `${uploadProgress}%`, // Corrected template literal
                }}
              />
              <span style={styles.progressText}>{uploadProgress}% uploaded</span>
            </div>
          )}

          {/* Processing Status and Progress */}
          {processingStatus && (
            <div className={`status ${processingStatus}`} style={styles.statusContainer}>
              {processingStatus === 'processing' && (
                <>
                  <div style={styles.progressContainer}>
                    <div
                      style={{
                        ...styles.progressBar,
                        width: `${processingProgress}%`, // Corrected template literal
                        backgroundColor: '#FFA500', // Orange for processing
                      }}
                    />
                    <span style={styles.progressText}>{Math.round(processingProgress)}% processed</span>
                  </div>
                  <p>Processing document... Please wait.</p>
                </>
              )}
              {processingStatus === 'completed' && (
                <div style={{ ...styles.status, backgroundColor: '#28a745' }}>
                  Document processed successfully! You can now search.
                </div>
              )}
              {processingStatus === 'failed' && (
                <div style={{ ...styles.status, backgroundColor: '#dc3545' }}>
                  Processing failed. Please try uploading again.
                </div>
              )}
            </div>
          )}
        </form>
        <h2>Your Documents</h2>
          {docs.length === 0 ? (
            <p style={styles.emptyText}>No documents uploaded yet.</p>
          ) : (
            <ul style={styles.list}>
              {docs.map((doc) => (
                <li key={doc._id} style={styles.listItem}>
                  <span>{doc.title}</span>
                  <div>
                    <button
                      onClick={() => navigate(`/documents/${doc._id}`)}
                      style={styles.actionButton}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
          



      {/* Navigation to Search and FAISS Pages */}
      <div style={styles.navbar}>
        <button
          onClick={() => navigate('/search')}
          style={styles.navButton}
        >
          Search Documents
        </button>
        <button
          onClick={() => navigate('/faiss')}
          style={styles.navButton}
        >
          View FAISS Index
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '800px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
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
  card: {
    width: '100%',
    maxWidth: '800px',
    padding: '20px',
    borderRadius: '8px',
    backgroundColor: '#282c34',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: '#3c4048',
    color: '#fff',
    outline: 'none',
  },
  inputFile: {
    padding: '8px',
    fontSize: '16px',
    backgroundColor: '#3c4048',
    color: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '4px',
    backgroundColor: '#61dafb',
    border: 'none',
    cursor: 'pointer',
    color: '#000',
    transition: 'background-color 0.3s',
    disabled: {
      backgroundColor: '#a0d8ef',
      cursor: 'not-allowed',
    },
  },
  progressContainer: {
    marginTop: '10px',
    width: '100%',
    backgroundColor: '#ccc',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '10px',
    backgroundColor: '#61dafb', // Default blue
    transition: 'width 0.5s ease',
  },
  progressText: {
    position: 'absolute',
    top: '-20px',
    right: '0',
    fontSize: '12px',
    color: '#fff',
  },
  statusContainer: {
    marginTop: '10px',
    padding: '10px',
    borderRadius: '4px',
    textAlign: 'center',
  },
  status: {
    padding: '10px',
    borderRadius: '4px',
    textAlign: 'center',
    color: '#fff',
    marginTop: '10px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    width: '100%',
    textAlign: 'left',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#3c4048',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  actionButton: {
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: '#61dafb',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    color: '#000',
    marginRight: '10px',
    transition: 'background-color 0.3s',
    disabled: {
      backgroundColor: '#a0d8ef',
      cursor: 'not-allowed',
    },
  },
  deleteButton: {
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: 'red',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    transition: 'background-color 0.3s',
  },
  emptyText: {
    fontSize: '16px',
    color: '#bbb',
    textAlign: 'center',
  },
  navbar: {
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

export default Dashboard;