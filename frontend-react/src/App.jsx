// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import DocumentDetails from './pages/DocumentDetails';
import ChatPage from './pages/ChatPage';
import SearchPage from './pages/SearchPage'; // Import the new page
import FAISSIndex from './pages/FAISSIndex'; // Import the new page
import FAISSDocuments from './pages/FAISSDocuments'; // Import the new page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchPage />} /> {/* New Route */}
        <Route path="/faiss" element={<FAISSIndex />} />
        <Route path="/faiss-documents" element={<FAISSDocuments />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents/:id" element={<DocumentDetails />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;
