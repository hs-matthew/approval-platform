// src/pages/Auth/Login.js
import React, { useState } from "react";
import { auth } from "../../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function Login() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      window.location.href = "/dashboard"; // redirect after success
    } catch (e) {
      setErr(e.message || "Authentication failed");
    }
  };

  const google = async () => {
    setErr("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      window.location.href = "/dashboard";
    } catch (e) {
      setErr(e.message || "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h1>

        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full px-3 py-2 border rounded-md"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-3 py-2 border rounded-md"
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={google}
          className="mt-3 w-full bg-gray-100 text-gray-800 py-2 rounded-md hover:bg-gray-200"
        >
          Continue with Google
        </button>

        <div className="mt-4 text-sm text-gray-600">
          {mode === "signin" ? (
            <>
              Don’t have an account?{" "}
              <button className="text-blue-600" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className="text-blue-600" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
