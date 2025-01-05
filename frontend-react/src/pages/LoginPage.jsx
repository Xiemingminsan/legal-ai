import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';

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
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      alert(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Login</h1>
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <FaUser style={styles.icon} />
            <input
              type="text"
              placeholder="Username or Email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <FaLock style={styles.icon} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
        <p style={styles.text}>
          Don&apos;t have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            style={styles.link}
          >
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw', // Ensure it spans the entire viewport width
      backgroundColor: '#1e1e2f',
      overflow: 'hidden', // Prevent extra scroll space
    },
    card: {
      width: '400px', // A slightly larger card for desktop
      padding: '30px',
      borderRadius: '8px',
      backgroundColor: '#282c34',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)', // Subtle shadow
      textAlign: 'center',
    },
    title: {
      color: '#fff',
      marginBottom: '20px',
      fontSize: '28px', // Slightly larger for web
      fontWeight: 'bold',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    },
    inputGroup: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#3c4048',
      borderRadius: '4px',
      padding: '10px',
    },
    icon: {
      color: '#bbb',
      marginRight: '10px',
    },
    input: {
      flex: 1,
      backgroundColor: 'transparent',
      border: 'none',
      outline: 'none',
      color: '#fff',
      fontSize: '16px',
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
    text: {
      color: '#bbb',
      marginTop: '20px',
    },
    link: {
      color: '#61dafb',
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  };
  
export default LoginPage;
