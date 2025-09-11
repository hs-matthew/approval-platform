import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ApprovalPlatform from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ApprovalPlatform />);

            // Add this to your existing component
function FirebaseDebug() {
  return (
    <div style={{ border: '1px solid red', padding: '10px', margin: '10px' }}>
      <h3>Debug Info:</h3>
      <p>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING'}</p>
      <p>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Present' : 'MISSING'}</p>
    </div>
  );
}

// Then include <FirebaseDebug /> in your main component's return
