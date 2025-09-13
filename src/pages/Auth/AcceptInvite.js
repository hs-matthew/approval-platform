// src/pages/Auth/AcceptInvite.js
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase"; // <- your existing client SDK init

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [status, setStatus] = React.useState("loading"); // loading | ready | working | invalid | done
  const [invite, setInvite] = React.useState(null);
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`);
        const data = await r.json();
        if (!data?.valid) {
          setStatus("invalid");
        } else {
          setInvite(data);
          setStatus("ready");
        }
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    if (status !== "ready" || !invite) return;
    setErr("");
    setStatus("working");

    try {
      const { email, role, workspaceIds = [], collaboratorPerms = null, inviteId } = invite;

      // 1) Create Auth user (auto signs in)
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });

      // 2) Create/merge app user doc using Auth UID as doc id
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          name,
          email,
          role,
          workspaceIds,
          collaboratorPerms: role === "collaborator" ? (collaboratorPerms || { content: true, audits: false, reports: false }) : null,
          isActive: true,
          createdByInvite: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 3) Mark invite used
      await fetch("/api/invites/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      setStatus("done");
      navigate("/dashboard"); // change if your post-signup landing is different
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to accept invite");
      setStatus("ready");
    }
  }

  if (status === "loading") return <div className="p-6">Checking your invite…</div>;
  if (status === "invalid") return <div className="p-6 text-red-600">This invite link is invalid or expired.</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-gray-600">Joining as <strong>{invite?.email}</strong></p>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input
            className="mt-1 w-full border rounded p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Create password</label>
          <input
            className="mt-1 w-full border rounded p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={8}
            required
            placeholder="At least 8 characters"
          />
        </div>

        <button
          className="w-full rounded bg-blue-600 text-white py-2 disabled:opacity-60"
          disabled={status !== "ready"}
        >
          {status === "working" ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-500">
        By creating an account, you agree to our terms and privacy policy.
      </p>
    </div>
  );
}
