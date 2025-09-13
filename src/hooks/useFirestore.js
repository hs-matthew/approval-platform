// src/hooks/useFirestore.js
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,          // kept for reload()
  onSnapshot,       // real-time
  query,
  orderBy as fbOrderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * useFirestore(collectionName, options?)
 * options:
 *  - realtime (default true): live updates via onSnapshot
 *  - orderBy: { field: string, dir?: "asc" | "desc" }
 */
export const useFirestore = (collectionName, options = {}) => {
  const { realtime = true, orderBy: orderBySpec } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // One-time load (used by reload)
  const loadOnce = async () => {
    try {
      if (!collectionName) return;
      setLoading(true);
      setError(null);

      const colRef = collection(db, collectionName);
      const qRef = orderBySpec
        ? query(colRef, fbOrderBy(orderBySpec.field, orderBySpec.dir || "asc"))
        : query(colRef);

      const snap = await getDocs(qRef);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setData(rows);
    } catch (err) {
      console.error(`Error loading ${collectionName}:`, err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!collectionName) return;

    setLoading(true);
    setError(null);

    const colRef = collection(db, collectionName);
    const qRef = orderBySpec
      ? query(colRef, fbOrderBy(orderBySpec.field, orderBySpec.dir || "asc"))
      : query(colRef);

    if (!realtime) {
      // fall back to one-time load
      loadOnce();
      return;
    }

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setData(rows);
        setLoading(false);
      },
      (err) => {
        console.error(`onSnapshot error for ${collectionName}:`, err);
        setError(err.message || String(err));
        setLoading(false);
      }
    );

    return () => unsub();
    // Re-subscribe if collection or ordering changes
  }, [collectionName, realtime, orderBySpec?.field, orderBySpec?.dir]);

  // Keep your existing addItem helper
  const addItem = async (itemData) => {
    const docRef = await addDoc(collection(db, collectionName), itemData);
    // No need to setData here—onSnapshot will emit immediately
    return { id: docRef.id, ...itemData };
  };

  return { data, loading, error, addItem, reload: loadOnce };
};
