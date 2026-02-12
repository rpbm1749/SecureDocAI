import { createRoot } from 'react-dom/client'
import './index.css'
import Login from'./Login.jsx'
import React from 'react'
import Dashboard from './Dashboard.jsx'
import { useState } from 'react'

function Root(){
  const [content, setContent] = useState('login');
  return content === 'login' ? <Login setContent={setContent} /> : <Dashboard setContent={setContent} />
}

createRoot(document.getElementById('root')).render(<Root />)
