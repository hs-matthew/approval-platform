// src/pages/Users/UserProfile.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Camera,
  Save,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  X,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { auth, db, storage } from "../../lib/firebase";
import { useWorkspace } from "../../context/WorkspaceContext";

/** Helper to convert a dataURL to a Blob */
function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const bytes = atob(data);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

/** Pretty date */
function formatDate(dateLike) {
  if (!dateLike) return "—";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Chip color by role (adjust to your roles) */
function getRoleColor(role) {
  switch ((role || "").toLowerCase()) {
    case "owner":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "admin":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "staff":
      return "bg-cyan-100 text-cyan-700 border-cyan-200";
    case "client":
      return "bg-green-100 text-green-700 border-green-200";
    case "collaborator":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function UserProfile({ onUpdateProfile = async () => {} }) {
  const user = auth.currentUser;

  // --- Load Firestore profile (for extra fields like phone/location/bio/role) ---
  const [fsProfile, setFsProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Edit state ---
  const [isEditing, setIsEditing] = useState(false);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(user?.photoURL || null);

  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    location: "",
    bio: "",
  });

  // --- Password change state ---
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // --- Refs for image crop ---
  const fileInputRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const imageRef = useRef(null);

  // Derived metadata
  const createdAt = useMemo(() => user?.metadata?.creationTime, [user]);
  const lastLogin = useMemo(() => user?.metadata?.lastSignInTime, [user]);

  // Role might live in Firestore (recommended). Fallback to 'collaborator'
  const role = (fsProfile?.role || "collaborator").toLowerCase();

  // Load Firestore data for current user
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active) {
          const data = snap.exists() ? snap.data() : {};
          setFsProfile(data);
          setFormData((prev) => ({
            ...prev,
            phone: data.phone || "",
            location: data.location || "",
            bio: data.bio || "",
          }));
        }
      } catch (e) {
        console.error("Failed to load firestore profile:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  // --- Image selection ---
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rdr = new FileReader();
    rdr.onload = (ev) => {
      setSelectedImage(ev.target.result);
      setShowImageCrop(true);
    };
    rdr.readAsDataURL(file);
  };

  // --- Crop image (center crop square -> 200x200) ---
  const handleImageCrop = () => {
    if (!cropCanvasRef.current || !imageRef.current) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - minDim) / 2;
    const sy = (img.naturalHeight - minDim) / 2;

    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCroppedImage(dataUrl);
    setShowImageCrop(false);
    setSelectedImage(null);
  };

  // --- Save profile to Auth + Storage + Firestore ---
  const handleProfileSave = async () => {
    if (!user?.uid) return;

    try {
      // 1) If we have a cropped image data URL, upload to Storage
      let photoURL = user.photoURL || null;
      if (croppedImage && croppedImage.startsWith("data:")) {
        const blob = dataURLtoBlob(croppedImage);
        const avatarRef = ref(storage, `avatars/${user.uid}.jpg`);
        await uploadBytes(avatarRef, blob, { contentType: "image/jpeg" });
        photoURL = await getDownloadURL(avatarRef);
      }

      // 2) Update Firebase Auth profile (displayName/photoURL)
      await updateProfile(user, {
        displayName: formData.name || "",
        photoURL: photoURL || null,
      });

      // 3) Persist extra fields to Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: formData.name || "",
          email: user.email || "", // keep Auth email as source of truth
          phone: formData.phone || "",
          location: formData.location || "",
          bio: formData.bio || "",
          photoURL: photoURL || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 4) Optional external hook
      await onUpdateProfile({
        uid: user.uid,
        ...formData,
        photoURL,
      });

      setIsEditing(false);
      // refresh local state
      setFsProfile((prev) => ({ ...(prev || {}), photoURL, ...formData }));
      alert("Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  // --- Change password with re-auth ---
  const handlePasswordChange = async () => {
    if (!user?.email) return;
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters long");
      return;
    }
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordChange(false);
      alert("Password updated!");
    } catch (e) {
      console.error("Password change failed:", e);
      alert("Password change failed. Check your current password and try again.");
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-semibold">You must be logged in to view your profile.</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-600">Loading profile…</p>
      </div>
    );
  }

  const displayName = formData.name || user.displayName || "Your Name";
  const avatar = croppedImage || fsProfile?.photoURL || user.photoURL || null;
  const { workspaces = [], loadingWorkspaces = false } = useWorkspace();

const isAllAccess = ["owner", "admin"].includes((fsProfile?.role || "collaborator").toLowerCase());
const assignedIds = Array.isArray(fsProfile?.workspaceIds) ? fsProfile.workspaceIds : [];

const visibleWorkspaces = isAllAccess
  ? workspaces
  : workspaces.filter(w => assignedIds.includes(w.id));


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleProfileSave}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user.displayName || "",
                    email: user.email || "",
                    phone: fsProfile?.phone || "",
                    location: fsProfile?.location || "",
                    bio: fsProfile?.bio || "",
                  });
                  setCroppedImage(fsProfile?.photoURL || user.photoURL || null);
                }}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4">
            {/* Name & Role */}
            <div className="flex items-center gap-4">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(role)}`}>
                <Shield className="w-4 h-4 inline mr-1" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>

            {/* Bio */}
            <div>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full text-gray-600 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-600">{fsProfile?.bio || "No bio provided"}</p>
              )}
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                {/* Email: show only (we keep Auth email as source of truth) */}
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="flex-1 border border-gray-200 bg-gray-100 rounded-md px-3 py-2 text-gray-500 cursor-not-allowed"
                  />
                ) : (
                  <span className="text-gray-700">{user.email}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-gray-700">{fsProfile?.phone || "Not provided"}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Location"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-gray-700">{fsProfile?.location || "Not provided"}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Joined {formatDate(createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Security</h3>
          <button
            onClick={() => setShowPasswordChange((v) => !v)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Change Password
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>Last login: {formatDate(lastLogin)}</p>
        </div>

        {showPasswordChange && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">Change Password</h4>

            <div className="space-y-3">
              {/* Current */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((s) => ({ ...s, current: !s.current }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((s) => ({ ...s, new: !s.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePasswordChange}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Update Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
{/* Workspaces */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">Workspaces</h3>
    {isAllAccess && (
      <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
        All workspaces
      </span>
    )}
  </div>

  {loadingWorkspaces ? (
    <p className="text-gray-600 text-sm">Loading workspaces…</p>
  ) : (
    <>
      {!isAllAccess && assignedIds.length === 0 ? (
        <p className="text-gray-600 text-sm">No workspace assignments.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {visibleWorkspaces.map((ws) => (
            <li
              key={ws.id}
              className="px-3 py-1 text-sm rounded-full border bg-gray-50 text-gray-700"
              title={ws.description || ""}
            >
              {ws.name || ws.title || ws.id}
            </li>
          ))}
        </ul>
      )}
    </>
  )}
</div>


      {/* Image Crop Modal */}
      {showImageCrop && selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Crop Profile Picture</h3>
            <div className="mb-4">
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Selected"
                className="max-w-full max-h-64 mx-auto"
                crossOrigin="anonymous"
              />
            </div>
            <canvas ref={cropCanvasRef} className="hidden" />
            <div className="flex gap-3">
              <button
                onClick={handleImageCrop}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Crop & Save
              </button>
              <button
                onClick={() => {
                  setShowImageCrop(false);
                  setSelectedImage(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
