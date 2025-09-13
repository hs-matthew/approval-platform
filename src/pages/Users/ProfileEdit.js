// src/pages/Users/ProfileEdit.js
import React, { useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function ProfileEdit() {
  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [photo, setPhoto] = useState(user?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      await updateProfile(user, {
        displayName: name,
        photoURL: photo,
      });
      setMessage("Profile updated!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            className="mt-1 block w-full border rounded p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Profile Photo URL</label>
          <input
            type="url"
            className="mt-1 block w-full border rounded p-2"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
          />
          {photo && (
            <img
              src={photo}
              alt="Profile preview"
              className="mt-2 h-20 w-20 rounded-full object-cover"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
