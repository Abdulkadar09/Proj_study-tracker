import { useState } from 'react';
import { supabase, hasSupabaseConfig } from '../supabaseClient';

export default function AuthScreen() {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'sign-up';
  const canSubmit = email.trim() && password.length >= 6 && hasSupabaseConfig;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setMessage('');

    const credentials = {
      email: email.trim(),
      password
    };

    const { error } = isSignUp
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (isSignUp) {
      setMessage('Account created. Check your email if confirmation is enabled, then sign in.');
      setMode('sign-in');
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-panel" onSubmit={handleSubmit}>
        <h1>Study Tracker</h1>
        <p>{isSignUp ? 'Create your account' : 'Sign in to your study space'}</p>

        {!hasSupabaseConfig && (
          <div className="auth-message">
            Supabase is not configured yet.
          </div>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength="6"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {message && <div className="auth-message">{message}</div>}

        <button type="submit" className="primary-button" disabled={!canSubmit || loading}>
          {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>

        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMessage('');
            setMode(isSignUp ? 'sign-in' : 'sign-up');
          }}
        >
          {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </div>
  );
}
