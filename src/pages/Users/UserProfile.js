// src/pages/Users/UserProfile.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Camera,
  Mail,
  Phone as PhoneIcon,
  Calendar,
  Shield,
  Loader2,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  Clock,
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
  collection,
  query,
  where,
  orderBy,
  limit as fbLimit,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../lib/firebase";
import { useWorkspace } from "../../context/WorkspaceContext";

/* ----------------------------- helpers ----------------------------- */
const formatDate = (dLike) =>
  dLike
    ? new Date(dLike).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

const roleColor = (role = "") => {
  switch (role.toLowerCase()) {
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
};

function dataURLtoBlob(dataURL) {
  const [head, data] = dataURL.split(",");
  const mime = head.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const bin = atob(data);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

/* -------------------------- Editable field ------------------------- */
function Editable({
  label,
  icon: Icon,
  type = "text",
  value,
  onSave,
  placeholder = "",
  displayAs,
  displayClass = "",
  inputClass = "",
  textareaClass = "",
}) {
  const [editing, setEditing] = useState(false);
  const [next, setNext] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setNext(value || "");
  }, [value]);

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 0);
  }, [editing]);

  const commit = async () => {
    if (saving) return;
    if (next === (value || "")) {
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      await onSave(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => {
    setNext(value || "");
    setEditing(false);
  };

  const onKey = (e) => {
    if (type === "textarea" && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    } else if (type !== "textarea" && e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const DisplayTag = displayAs || "div";

  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-5 h-5 text-gray-400 mt-1" />}
      <div className="flex-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        {!editing ? (
          <div className="group flex items-center gap-2">
            <DisplayTag className={displayClass || "text-gray-700"}>
              {value || placeholder || "Not provided"}
            </DisplayTag>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-gray-600"
              aria-label={`Edit ${label || "field"}`}
              title="Edit"
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
                className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${textareaClass}`}
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
                className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
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
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
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

/* ------------------------------ main ------------------------------ */
export default function UserProfile() {
  const user = auth.currentUser;
  const { workspaces = [], loadingWorkspaces = false } = useWorkspace();

  const [fsProfile, setFsProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // avatar state
  const [showCrop, setShowCrop] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  // password state
  const [showPassword, setShowPassword] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [pwSaving, setPwSaving] = useState(false);

  // recent activity
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const createdAt = useMemo(() => user?.metadata?.creationTime, [user]);
  const lastLogin = useMemo(() => user?.metadata?.lastSignInTime, [user]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user?.uid) {
        setLoading(false);
        setLoadingActivity(false);
        return;
      }
      try {
        // Load profile
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        if (!active) return;
        setFsProfile({
          name: user.displayName || data.name || "",
          email: user.email || data.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          photoURL: data.photoURL || user.photoURL || null,
          role: data.role || "collaborator",
          workspaceIds: Array.isArray(data.workspaceIds)
            ? data.workspaceIds
            : [],
        });

        // Load recent activity (optional collection: "activity")
        const q = query(
          collection(db, "activity"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          fbLimit(10)
        );
        const actSnap = await getDocs(q);
        if (!active) return;
        const rows = actSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setActivity(rows);
      } catch (e) {
        console.error("Failed to load profile or activity:", e);
      } finally {
        if (active) {
          setLoading(false);
          setLoadingActivity(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const isAllAccess = ["owner", "admin"].includes(
    (fsProfile?.role || "").toLowerCase()
  );
  const visibleWorkspaces = isAllAccess
    ? workspaces
    : workspaces.filter((w) => fsProfile?.workspaceIds?.includes(w.id));

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        You must be logged in to view your profile.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-gray-600">
        Loading profile…
      </div>
    );
  }

  const avatar = (croppedImage || fsProfile?.photoURL) ?? null;

  /* --------------------------- avatar handlers --------------------------- */
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      setSelectedImage(ev.target.result);
      setShowCrop(true);
    };
    r.readAsDataURL(f);
  };
  const onCrop = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const c = canvasRef.current,
      ctx = c.getContext("2d"),
      img = imgRef.current;
    const size = 200;
    c.width = size;
    c.height = size;
    const min = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - min) / 2,
      sy = (img.naturalHeight - min) / 2;
    ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
    setCroppedImage(c.toDataURL("image/jpeg", 0.92));
    setShowCrop(false);
    setSelectedImage(null);
  };
  const persistAvatar = async (dataUrl) => {
    if (!dataUrl || !user?.uid) return;
    const blob = dataURLtoBlob(dataUrl);
    const avatarRef = ref(storage, `avatars/${user.uid}.jpg`);
    await uploadBytes(avatarRef, blob, { contentType: "image/jpeg" });
    const url = await getDownloadURL(avatarRef);
    await updateProfile(user, { photoURL: url });
    await setDoc(
      doc(db, "users", user.uid),
      { photoURL: url, updatedAt: serverTimestamp() },
      { merge: true }
    );
    setFsProfile((p) => ({ ...(p || {}), photoURL: url }));
  };

  /* ---------------------------- inline saves ---------------------------- */
  const saveName = async (name) => {
    await updateProfile(user, { displayName: name || "" });
    await setDoc(
      doc(db, "users", user.uid),
      { name: name || "", updatedAt: serverTimestamp() },
      { merge: true }
    );
    setFsProfile((p) => ({ ...(p || {}), name }));
  };
  const savePhone = async (phone) => {
    await setDoc(
      doc(db, "users", user.uid),
      { phone: phone || "", updatedAt: serverTimestamp() },
      { merge: true }
    );
    setFsProfile((p) => ({ ...(p || {}), phone }));
  };
  const saveBio = async (bio) => {
    await setDoc(
      doc(db, "users", user.uid),
      { bio: bio || "", updatedAt: serverTimestamp() },
      { merge: true }
    );
    setFsProfile((p) => ({ ...(p || {}), bio }));
  };

  /* --------------------------- password change -------------------------- */
  const changePassword = async () => {
    if (!user?.email) return;
    if (pw.next !== pw.confirm) {
      alert("New passwords do not match");
      return;
    }
    if (pw.next.length < 8) {
      alert("New password must be at least 8 characters long");
      return;
    }
    try {
      setPwSaving(true);
      const cred = EmailAuthProvider.credential(user.email, pw.current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      setShowPassword(false);
      alert("Password updated!");
    } catch (e) {
      console.error("Password change failed:", e);
      alert("Password change failed. Check your current password and try again.");
    } finally {
      setPwSaving(false);
    }
  };

  /* ------------------------------ render ------------------------------ */
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover background */}
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          {/* Joined date (top-right) */}
          <div className="absolute top-2 right-4 text-xs text-white/90 font-medium flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Joined {formatDate(createdAt)}
          </div>
        </div>

        {/* Body */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
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
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPick}
                className="hidden"
              />
            </div>
          </div>

          {/* Name + Role */}
          <div className="flex items-center gap-4 mb-4">
            <Editable
              label={null}
              icon={null}
              type="text"
              value={fsProfile?.name}
              onSave={saveName}
              placeholder="Your name"
              displayAs="h2"
              displayClass="text-3xl font-extrabold text-gray-900"
              inputClass="text-3xl font-extrabold"
            />
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium border ${roleColor(
                fsProfile?.role
              )}`}
            >
              <Shield className="w-4 h-4 inline mr-1" />
              {(fsProfile?.role || "collaborator").replace(
                /^\w/,
                (c) => c.toUpperCase()
              )}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">
                {fsProfile?.email || user.email}
              </span>
            </div>
            <Editable
              label="Phone"
              icon={PhoneIcon}
              type="tel"
              value={fsProfile?.phone}
              onSave={savePhone}
              placeholder="Add a phone number"
            />
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

      {/* Workspaces */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Workspaces</h3>
        </div>

        {loadingWorkspaces ? (
          <p className="text-gray-600 text-sm">Loading workspaces…</p>
        ) : isAllAccess ? (
          <>
            <div className="mb-3">
              <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                All workspaces
              </span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {workspaces.map((ws) => (
                <li
                  key={ws.id}
                  className="px-3 py-1 text-sm rounded-full border bg-gray-50 text-gray-700"
                >
                  {ws.name || ws.title || ws.id}
                </li>
              ))}
            </ul>
          </>
        ) : fsProfile?.workspaceIds?.length ? (
          <ul className="flex flex-wrap gap-2">
            {visibleWorkspaces.map((ws) => (
              <li
                key={ws.id}
                className="px-3 py-1 text-sm rounded-full border bg-gray-50 text-gray-700"
              >
                {ws.name || ws.title || ws.id}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-sm">No workspace assignments.</p>
        )}
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Security</h3>
          <button
            onClick={() => setShowPassword((v) => !v)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showPassword ? "Hide" : "Change Password"}
          </button>
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <p>Last login: {formatDate(lastLogin)}</p>
        </div>

        {showPassword && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Current */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={pwShow.current ? "text" : "password"}
                  value={pw.current}
                  onChange={(e) =>
                    setPw((s) => ({ ...s, current: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwShow((s) => ({ ...s, current: !s.current }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {pwShow.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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
                  type={pwShow.next ? "text" : "password"}
                  value={pw.next}
                  onChange={(e) =>
                    setPw((s) => ({ ...s, next: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwShow((s) => ({ ...s, next: !s.next }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {pwShow.next ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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
                  type={pwShow.confirm ? "text" : "password"}
                  value={pw.confirm}
                  onChange={(e) =>
                    setPw((s) => ({ ...s, confirm: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwShow((s) => ({ ...s, confirm: !s.confirm }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {pwShow.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={changePassword}
                disabled={pwSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-60"
              >
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
              <button
                onClick={() => {
                  setShowPassword(false);
                  setPw({ current: "", next: "", confirm: "" });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>

        {loadingActivity ? (
          <p className="text-gray-600 text-sm">Loading activity…</p>
        ) : activity.length ? (
          <ul className="divide-y divide-gray-200">
            {activity.map((a) => (
              <li key={a.id} className="py-3 flex items-start justify-between">
                <div className="pr-4">
                  <p className="text-sm text-gray-900">
                    {a.message || a.type || "Activity"}
                  </p>
                  {a.details && (
                    <p className="text-xs text-gray-500 mt-0.5">{a.details}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {a.timestamp?.toDate
                    ? formatDate(a.timestamp.toDate())
                    : formatDate(a.timestamp)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-sm">No recent activity.</p>
        )}
      </div>

      {/* Crop modal */}
      {showCrop && selectedImage && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Crop Profile Picture</h3>
            <img
              ref={imgRef}
              src={selectedImage}
              alt="Selected"
              className="max-w-full max-h-64 mx-auto mb-4"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button
                onClick={onCrop}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Crop
              </button>
              <button
                onClick={() => {
                  setShowCrop(false);
                  setSelectedImage(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>

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
