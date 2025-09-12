import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      console.log(`Loading ${collectionName} from Firebase...`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      const loadedData = [];
      querySnapshot.forEach((doc) => {
        loadedData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`Loaded ${collectionName}:`, loadedData);
      setData(loadedData);
    } catch (err) {
      console.error(`Error loading ${collectionName}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (itemData) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), itemData);
      const newItem = { id: docRef.id, ...itemData };
      setData(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error(`Error adding ${collectionName}:`, err);
      throw err;
    }
  };

  useEffect(() => {
    loadData();
  }, [collectionName]);

  return { data, loading, error, addItem, reload: loadData };
};
