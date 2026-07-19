"use client";

import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { isAdmin } from "@/lib/firestore";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          setAdmin(await isAdmin(currentUser.uid));
        } catch {
          setAdmin(false);
        }
      } else {
        setAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    if (!auth) throw new Error("Firebase is not configured");
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return { user, loading, admin, signIn, logout, enabled: isFirebaseConfigured };
}
