// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', {
        usernameOrEmail,
        password,
      });
      // Save token in localStorage
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      alert(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <h1>Login</h1>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="text"
          placeholder="Username or Email"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
      <button onClick={() => navigate('/register')} style={styles.linkButton}>
        Go to Register
      </button>
    </div>
  );
}

const styles = {
  container: { maxWidth: '400px', margin: 'auto', padding: '20px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '10px', fontSize: '16px' },
  button: { padding: '10px', fontSize: '16px', cursor: 'pointer' },
  linkButton: { marginTop: '10px', padding: '10px', fontSize: '14px', cursor: 'pointer', background: 'none', border: 'none', color: 'blue', textDecoration: 'underline' },
};

export default LoginPage;
