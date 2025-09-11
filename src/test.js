import { db } from '../src/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useState } from 'react';

export default function FirebaseTest() {
  const [testResult, setTestResult] = useState('');

  const testFirestore = async () => {
    try {
      // Try to add a document
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello from Vercel!',
        timestamp: new Date()
      });
      
      // Try to read documents
      const querySnapshot = await getDocs(collection(db, 'test'));
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push(doc.data());
      });
      
      setTestResult(`Success! Added doc: ${docRef.id}, Found ${docs.length} documents`);
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Firebase Test</h2>
      <button onClick={testFirestore}>Test Firestore</button>
      <p>{testResult}</p>
    </div>
  );
}
