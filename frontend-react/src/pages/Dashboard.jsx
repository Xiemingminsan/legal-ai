// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
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
      <h1>Dashboard</h1>
      <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      <form onSubmit={handleUpload} style={styles.form}>
        <input
          type="text"
          placeholder="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
          required
        />
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} style={styles.inputFile} required />
        <button type="submit" style={styles.button}>Upload Document</button>
      </form>

      <h2>Your Documents</h2>
      {docs.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <ul style={styles.list}>
          {docs.map((doc) => (
            <li key={doc._id} style={styles.listItem}>
              <span>{doc.title}</span>
              <div>
                <button onClick={() => navigate(`/documents/${doc._id}`)} style={styles.actionButton}>View</button>
                <button onClick={() => handleDelete(doc._id)} style={styles.deleteButton}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: 'auto', padding: '20px' },
  logoutButton: { float: 'right', padding: '8px 12px', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
  input: { padding: '10px', fontSize: '16px' },
  inputFile: { padding: '5px', fontSize: '16px' },
  button: { padding: '10px', fontSize: '16px', cursor: 'pointer' },
  list: { listStyle: 'none', padding: 0 },
  listItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #ccc' },
  actionButton: { marginRight: '10px', padding: '5px 10px', cursor: 'pointer' },
  deleteButton: { padding: '5px 10px', cursor: 'pointer', backgroundColor: 'red', color: 'white', border: 'none' },
};

export default Dashboard;
