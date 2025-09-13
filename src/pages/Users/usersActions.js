// src/pages/Users/usersActions.js
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

// Optional: helper if you want email-as-id for users
export const userIdFromEmail = (email) =>
  (email || "").toLowerCase().replace(/[^a-z0-9]/g, "_");

export async function addUserWithInvite({ name, email, role, workspaceId, wsRole }) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const createdBy = auth.currentUser?.uid || "system";
  const userDocId = userIdFromEmail(normalizedEmail);

  // 1) Add to users collection (for list view)
  await setDoc(
    doc(db, "users", userDocId),
    {
      name: (name || "").trim(),
      email: normalizedEmail,
      role,
      isActive: true,
      lastLogin: null,
      createdAt: serverTimestamp(),
      createdBy,
      memberships: { [workspaceId]: wsRole },
    },
    { merge: true }
  );

  // 2) Create invite for fulfillment on login
  await addDoc(collection(db, "invites"), {
    email: normalizedEmail,
    workspaceId,
    role: wsRole,
    status: "pending",
    createdAt: serverTimestamp(),
    createdBy,
  });
}

export async function updateUserBasic(id, changes) {
  await setDoc(
    doc(db, "users", id),
    {
      name: (changes.name || "").trim(),
      email: (changes.email || "").trim().toLowerCase(),
      role: changes.role || "writer",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
