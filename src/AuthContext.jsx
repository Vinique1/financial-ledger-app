// src/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase'; // Import db from firebase
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Instead of getting role from token, fetch it from Firestore.
        const profileDocRef = doc(db, 'user_profiles', currentUser.uid);
        try {
          const profileDoc = await getDoc(profileDocRef);
          if (profileDoc.exists()) {
            const role = profileDoc.data().role || 'viewer';
            setUser({ ...currentUser, role });
          } else {
            // Handle case where user exists in Auth but not in user_profiles
            // This could happen if the profile doc was deleted manually.
            console.warn(`Profile for user ${currentUser.uid} not found. Assigning default 'viewer' role.`);
            setUser({ ...currentUser, role: 'viewer' });
          }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            // On error, default to a safe, non-privileged role
            setUser({ ...currentUser, role: 'viewer' });
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loadingAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
