// src/pages/Users/UserProfile.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  User, Camera, Mail, Phone as PhoneIcon, MapPin, Calendar, Shield, Loader2,
  Edit3, Check, X
} from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../lib/firebase";
import { useWorkspace } from "../../context/WorkspaceContext";

/* --- helpers --- */
const formatDate = (dLike) =>
  dLike ? new Date(dLike).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

const roleColor = (role="") => {
  switch (role.toLowerCase()) {
    case "owner": return "bg-amber-100 text-amber-700 border-amber-200";
    case "admin": return "bg-purple-100 text-purple-700 border-purple-200";
    case "staff": return "bg-cyan-100 text-cyan-700 border-cyan-200";
    case "client": return "bg-green-100 text-green-700 border-green-200";
    case "collaborator": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

function dataURLtoBlob(dataURL) {
  const [head, data] = dataURL.split(",");
  const mime = head.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const bin = atob(data);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

/* --- Reusable inline Editable field --- */
function Editable({
  label,
  icon: Icon,
  type = "text",            // 'text' | 'tel' | 'textarea'
  value,
  onSave,                   // async (next) => void
  placeholder = "",
}) {
  const [editing, setEditing] = useState(false);
  const [next, setNext] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setNext(value || ""); }, [value]);
  useEffect(() => { if (editing) setTimeout(() => inputRef.current?.focus(), 0); }, [editing]);

  const commit = async () => {
    if (saving) return;
    if (next === (value || "")) { setEditing(false); return; }
    try {
      setSaving(true);
      await onSave(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => { setNext(value || ""); setEditing(false); };

  const onKey = (e) => {
    if (type === "textarea" && (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
      e.preventDefault(); commit();
    } else if (type !== "textarea" && e.key === "Enter") {
      e.preventDefault(); commit();
    } else if (e.key === "Escape") {
      e.preventDefault(); cancel();
    }
  };

  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-5 h-5 text-gray-400 mt-1" />}
      <div className="flex-1">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

        {!editing ? (
          <div className="group flex items-center gap-2">
            <div className={`text-gray-700 ${value ? "" : "text-gray-400 italic"}`}>
              {value || placeholder || "Not provided"}
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-gray-600"
              aria-label={`Edit ${label}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            {type === "textarea" ? (
              <textarea
                ref={inputRef}
                rows={3}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                onKeyDown={onKey}
                onBlur={commit}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input
                ref={inputRef}
                type={type}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                onKeyDown={onKey}
                onBlur={commit}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            <div className="flex items-center gap-1 pt-1">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={commit}
                className="p-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                aria-label="Save"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancel}
                className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Main --- */
export default function UserProfile() {
  const user = auth.currentUser;
  const { workspaces = [], loadingWorkspaces = false } = useWorkspace();

  const [fsProfile, setFsProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // avatar state (optional crop/upload flow retained)
  const [showCrop, setShowCrop] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const createdAt = useMemo(() => user?.metadata?.creationTime, [user]);
  const lastLogin = useMemo(() => user?.metadata?.lastSignInTime, [user]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user?.uid) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        if (!active) return;
        setFsProfile({
          name: user.displayName || data.name || "",
          email: user.email || data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || "",
          photoURL: data.photoURL || user.photoURL || null,
          role: data.role || "collaborator",
          workspaceIds: Array.isArray(data.workspaceIds) ? data.workspaceIds : [],
        });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  const isAllAccess = ["owner", "admin"].includes((fsProfile?.role || "").toLowerCase());
  const visibleWorkspaces = isAllAccess
    ? workspaces
    : workspaces.filter((w) => fsProfile?.workspaceIds?.includes(w.id));

  if (!user) {
    return <div className="max-w-4xl mx-auto p-6">You must be logged in to view your profile.</div>;
  }
  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 text-gray-600">Loading profile…</div>;
  }

  const avatar = (croppedImage || fsProfile?.photoURL) ?? null;

  /* --- Avatar handlers (optional) --- */
  const onPick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { setSelectedImage(ev.target.result); setShowCrop(true); };
    r.readAsDataURL(f);
  };
  const onCrop = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const c = canvasRef.current, ctx = c.getContext("2d"), img = imgRef.current;
    const size = 200; c.width = size; c.height = size;
    const min = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - min) / 2, sy = (img.naturalHeight - min) / 2;
    ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
    setCroppedImage(c.toDataURL("image/jpeg", 0.92));
    setShowCrop(false); setSelectedImage(null);
  };
  const persistAvatar = async (dataUrl) => {
    if (!dataUrl || !user?.uid) return;
    const blob = dataURLtoBlob(dataUrl);
    const avatarRef = ref(storage, `avatars/${user.uid}.jpg`);
    await uploadBytes(avatarRef, blob, { contentType: "image/jpeg" });
    const url = await getDownloadURL(avatarRef);
    await updateProfile(user, { photoURL: url });
    await setDoc(doc(db, "users", user.uid), { photoURL: url, updatedAt: serverTimestamp() }, { merge: true });
    setFsProfile((p) => ({ ...(p || {}), photoURL: url }));
  };

  /* --- Inline saves --- */
  const saveName = async (name) => {
    await updateProfile(user, { displayName: name || "" });
    await setDoc(doc(db, "users", user.uid), { name: name || "", updatedAt: serverTimestamp() }, { merge: true });
    setFsProfile((p) => ({ ...(p || {}), name }));
  };
  const savePhone = async (phone) => {
    await setDoc(doc(db, "users", user.uid), { phone: phone || "", updatedAt: serverTimestamp() }, { merge: true });
    setFsProfile((p) => ({ ...(p || {}), phone }));
  };
  const saveBio = async (bio) => {
    await setDoc(doc(db, "users", user.uid), { bio: bio || "", updatedAt: serverTimestamp() }, { merge: true });
    setFsProfile((p) => ({ ...(p || {}), bio }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">Click a field to edit it inline.</p>
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
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                title="Change photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
            </div>
          </div>

          {/* Name & Role row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <Editable
                label="Name"
                icon={null}
                type="text"
                value={fsProfile?.name}
                onSave={saveName}
                placeholder="Your name"
              />
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${roleColor(fsProfile?.role)}`}>
              <Shield className="w-4 h-4 inline mr-1" />
              {(fsProfile?.role || "collaborator").replace(/^\w/, c => c.toUpperCase())}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{fsProfile?.email || user.email}</span>
            </div>

            <Editable
              label="Phone"
              icon={PhoneIcon}
              type="tel"
              value={fsProfile?.phone}
              onSave={savePhone}
              placeholder="Add a phone number"
            />

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{fsProfile?.location || "Not provided"}</span>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">Joined {formatDate(createdAt)}</span>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <Editable
              label="Bio"
              icon={null}
              type="textarea"
              value={fsProfile?.bio}
              onSave={saveBio}
              placeholder="Tell us about yourself…"
            />
          </div>
        </div>
      </div>

      {/* Workspaces (read-only for non-admins) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Workspaces</h3>
          {["owner", "admin"].includes((fsProfile?.role || "").toLowerCase()) ? (
            <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              All workspaces
            </span>
          ) : (
            <span className="text-xs text-gray-500">(read-only)</span>
          )}
        </div>

        {loadingWorkspaces ? (
          <p className="text-gray-600 text-sm">Loading workspaces…</p>
        ) : ["owner", "admin"].includes((fsProfile?.role || "").toLowerCase()) ? (
          <ul className="flex flex-wrap gap-2">
            {workspaces.map((ws) => (
              <li key={ws.id} className="px-3 py-1 text-sm rounded-full border bg-gray-50 text-gray-700">
                {ws.name || ws.title || ws.id}
              </li>
            ))}
          </ul>
        ) : (fsProfile?.workspaceIds?.length ? (
          <ul className="flex flex-wrap gap-2">
            {visibleWorkspaces.map((ws) => (
              <li key={ws.id} className="px-3 py-1 text-sm rounded-full border bg-gray-50 text-gray-700">
                {ws.name || ws.title || ws.id}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-sm">No workspace assignments.</p>
        ))}
      </div>

      {/* Crop modal */}
      {showCrop && selectedImage && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Crop Profile Picture</h3>
            <img ref={imgRef} src={selectedImage} alt="Selected" className="max-w-full max-h-64 mx-auto mb-4" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button
                onClick={async () => { onCrop(); }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Crop
              </button>
              <button
                onClick={() => { setShowCrop(false); setSelectedImage(null); }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>

            {/* Save avatar to Firebase after cropping */}
            {croppedImage && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => persistAvatar(croppedImage)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Photo
                </button>
                <button
                  onClick={() => setCroppedImage(null)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
