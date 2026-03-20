import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Clear potentially corrupted localStorage on first load after update
const STORAGE_VERSION = 'meds-v2';
if (localStorage.getItem('meds-storage-version') !== STORAGE_VERSION) {
  localStorage.removeItem('meds-project');
  localStorage.setItem('meds-storage-version', STORAGE_VERSION);
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  document.body.innerHTML = '<h1 style="color:red;padding:20px">Root element not found</h1>';
}
