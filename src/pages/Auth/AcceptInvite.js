// src/pages/Auth/AcceptInvite.js
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

/**
 * AcceptInvite flow:
 * 1) Reads ?token= from URL
 * 2) POST /api/invites/validate { token } -> expects { valid: true, invite: { id/email/role/... } }
 *    - also supports flat { valid: true, id, email, ... } shape
 * 3) Creates Firebase Auth user with email/password
 * 4) Upserts app user doc in Firestore (doc id = auth.uid)
 * 5) POST /api/invites/consume { inviteId, token } to delete/soft-delete invite
 */
export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  // UI state
  const [phase, setPhase] = React.useState("loading"); // loading | ready | working | invalid | done
  const [invite, setInvite] = React.useState(null);
  const [err, setErr] = React.useState("");

  // form state
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Validate token and fetch invite payload
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) throw new Error("Missing invite token");

        const r = await fetch("/api/invites/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await r.json();

        if (!r.ok || !data?.valid) {
          if (mounted) setPhase("invalid");
          return;
        }

        // Support both shapes: { invite: {...} } or flat {...}
        const inv = data.invite ?? data;

        // Minimal required fields
        if (!inv?.email) {
          if (mounted) setPhase("invalid");
          return;
        }

        if (mounted) {
          setInvite(inv);
          setPhase("ready");
        }
      } catch (e) {
        console.error(e);
        if (mounted) setPhase("invalid");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    if (phase !== "ready" || !invite) return;

    setErr("");
    setPhase("working");

    try {
      const {
        email,
        role = "collaborator",
        workspaceIds = [],
        collaboratorPerms = null,
      } = invite;

      // Normalize an ID to send to consume()
      const inviteId = invite.id || invite.inviteId || null;

      // 1) Create Firebase Auth user (auto-signs in)
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name && cred?.user) {
        await updateProfile(cred.user, { displayName: name });
      }

      // 2) Upsert app user document with Auth UID as id
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          name,
          email,
          role,
          workspaceIds,
          collaboratorPerms:
            role === "collaborator"
              ? collaboratorPerms || { content: true, audits: false, reports: false }
              : null,
          isActive: true,
          createdByInvite: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 3) Consume the invite (server deletes or soft-deletes it)
      const consumeResp = await fetch("/api/invites/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, token }),
      });
      const consumeJson = await consumeResp.json();
      if (!consumeResp.ok || consumeJson?.ok !== true) {
        throw new Error(consumeJson?.error || "Failed to consume invite");
      }

      setPhase("done");
      navigate("/dashboard"); // adjust if you want a different landing page
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to accept invite");
      setPhase("ready");
    }
  }

  if (phase === "loading") {
    return <div className="p-6 text-sm text-gray-700">Checking your invite…</div>;
  }

  if (phase === "invalid") {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-semibold text-red-600">Invalid or expired invite</h1>
        <p className="mt-2 text-sm text-gray-600">
          This invite link is not valid anymore. Please contact your administrator for a new invite.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-gray-600">
        Joining as <strong>{invite?.email}</strong>
      </p>

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
          disabled={phase !== "ready" && phase !== "working"}
        >
          {phase === "working" ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-500">
        By creating an account, you agree to our terms and privacy policy.
      </p>
    </div>
  );
}
