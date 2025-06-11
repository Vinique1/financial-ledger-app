import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import FormInput from './components/FormInput'; // Import FormInput
import ActionButton from './components/ActionButton'; // Import ActionButton
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [resetMessage, setResetMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null); // Clear any previous reset messages
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Successful login will trigger App to show main UI (due to onAuthStateChanged in AuthContext)
      toast.success('Logged in successfully!');
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      toast.error(`Login failed: ${err.message}`);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password.');
      toast.error('Please enter your email to reset password.');
      return;
    }
    setError(null);
    setResetMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Password reset email sent! Check your inbox.');
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message);
      toast.error(`Password reset failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg space-y-6">
        <h2 className="text-3xl font-bold text-center text-gray-800">Login to Business Tracker</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {resetMessage && <p className="text-green-500 text-sm text-center">{resetMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <ActionButton
            type="submit"
            color="blue"
            className="w-full"
          >
            Login
          </ActionButton>
          <div className="text-center">
            <ActionButton
              type="button"
              onClick={handleForgotPassword}
              color="gray" // Using gray for a more subtle look, or could define a 'link' style
              className="text-blue-600 hover:underline" // Keeping original text-blue-600 for link appearance
              style={{ background: 'none', border: 'none', padding: 0 }} // Remove button styling for pure link
            >
              Forgot Password?
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
