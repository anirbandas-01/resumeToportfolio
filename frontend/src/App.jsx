import { useEffect, useState } from 'react';
import api from './api/client';


function App() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    api.get('/health')
    .then((res)=> setStatus(res.data.message))
    .catch(() => setStatus('Could not reach backend'));
  }, []);


  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Resume to Portfolio</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;