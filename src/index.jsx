import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import { AuthProvider } from './AuthContext'; // Import AuthProvider
import { DataProvider } from './DataContext'; // Import DataProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* Wrap App with AuthProvider */}
      <DataProvider> {/* Wrap App with DataProvider */}
        <App />
      </DataProvider>
    </AuthProvider>
    <Toaster position="top-right" reverseOrder={false} /> {/* Place Toaster component here */}
  </React.StrictMode>
);
