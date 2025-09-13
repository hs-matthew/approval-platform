// src/pages/Auth/AcceptInvite.js
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

// Default collaborator perms if invite didn't specify
const DEFAULT_COLLAB_PERMS = { content: true, audits: false, reports: false };

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  // UI states
  const [phase, setPhase] = React.useState("loading"); // loading | ready | working | invalid | done
  const [invite, setInvite] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [canReset, setCanReset] = React.useState(false);

  // form
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");

  // ----- Validate invite (POST body) -----
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) throw new Error("Missing invite token");

        const r = await fetch("/api/invites/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await r.json().catch(() => ({}));

        if (!r.ok || !data?.valid || !data?.invite?.email) {
          if (mounted) setPhase("invalid");
          return;
        }

        if (mounted) {
          setInvite(data.invite);
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
    setCanReset(false);
    setPhase("working");

    try {
      const {
        email,
        role = "collaborator",
        workspaceIds = [],
        collaboratorPerms = null,
      } = invite;

      const inviteId = invite.id || invite.inviteId || null;

      // 1) Create OR sign in existing user
      const methods = await fetchSignInMethodsForEmail(auth, email);

      let cred;
      if (!methods || methods.length === 0) {
        // No account yet -> create with provided password
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Account exists -> attempt sign in with provided password
        try {
          cred = await signInWithEmailAndPassword(auth, email, password);
        } catch (signInErr) {
          // Wrong/unknown password → show message and reset option
          setErr(
            "This email already has an account. Enter your existing password to join, or send a password reset."
          );
          setCanReset(true);
          setPhase("ready");
          return;
        }
      }

      // 2) Set display name if supplied
      if (name && cred?.user) {
        try {
          await updateProfile(cred.user, { displayName: name });
        } catch {
          // non-fatal
        }
      }

      // 3) Upsert app user document with Auth UID as id (first write happens ONLY now)
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          name,
          email,
          role,
          workspaceIds,
          collaboratorPerms:
            role === "collaborator"
              ? (collaboratorPerms || DEFAULT_COLLAB_PERMS)
              : null,
          isActive: true,
          createdByInvite: true,
          createdAt: serverTimestamp(),
          createdByFlow: "accept-invite", // test
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 4) Consume invite (server marks used / soft-deletes)
      const consumeResp = await fetch("/api/invites/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteId ? { inviteId, token } : { token }),
      });
      const consumeJson = await consumeResp.json().catch(() => ({}));
      if (!consumeResp.ok || consumeJson?.ok !== true) {
        throw new Error(consumeJson?.error || "Failed to consume invite");
      }

      setPhase("done");
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      // Safety for any leftover create-only errors
      if (e?.code === "auth/email-already-in-use") {
        setErr(
          "This email already has an account. Enter your existing password to join, or send a password reset."
        );
        setCanReset(true);
        setPhase("ready");
        return;
      }
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

      {err && <p className="mt-3 text-sm text-red-600">Firebase: {err}</p>}

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

      {canReset && (
        <button
          type="button"
          onClick={async () => {
            try {
              await sendPasswordResetEmail(auth, invite.email);
              setErr("Reset link sent. Check your email.");
              setCanReset(false);
            } catch (e) {
              setErr(e?.message || "Failed to send reset email");
            }
          }}
          className="mt-3 w-full rounded border border-gray-300 py-2 text-sm"
        >
          Send password reset
        </button>
      )}

      <p className="mt-4 text-xs text-gray-500">
        By creating an account, you agree to our terms and privacy policy.
      </p>
    </div>
  );
}
