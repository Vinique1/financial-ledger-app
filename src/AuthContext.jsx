// src/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebase'; // Assuming firebase.js is in the same directory
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'; // Renamed signOut to avoid conflict

// Create the AuthContext
const AuthContext = createContext(null);

// AuthProvider component to manage authentication state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // State to indicate if authentication is still loading

  // Effect to listen for Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false); // Set loading to false once auth state is determined
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Function to handle user logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      // setUser(null); // onAuthStateChanged listener will handle setting user to null
      console.log("User logged out successfully!");
    } catch (error) {
      console.error("Error during logout:", error);
      // You might want to add a toast/notification here for logout errors
    }
  };

  // Provide the user, loading state, and logout function to children components
  return (
    <AuthContext.Provider value={{ user, loadingAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
