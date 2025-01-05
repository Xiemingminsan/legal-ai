import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
  function Dashboard() {
    const [docs, setDocs] = useState([]);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
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
    };
  
    const handleUpload = async (e) => {
      e.preventDefault();
      if (!file) {
        alert('Please select a file');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);
  
        await axios.post('http://localhost:5000/api/documents/upload', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        alert('File uploaded!');
        setTitle('');
        setFile(null);
        fetchDocs();
      } catch (err) {
        console.error(err.response?.data?.msg || err.message);
        alert(err.response?.data?.msg || 'File upload failed');
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
  
    const handleLogout = () => {
      localStorage.removeItem('token');
      navigate('/');
    };
  
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
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
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              style={styles.inputFile}
              required
            />
            <button type="submit" style={styles.button}>Upload Document</button>
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
      overflow: 'hidden',
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
  };
  

  export default Dashboard;
  