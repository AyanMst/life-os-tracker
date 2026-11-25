import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth({ t, lang, theme, languages, onLangChange, onThemeToggle }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      setMessage(error ? `${t.authSignupError}${error.message}` : t.authSignupSuccess);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(`${t.authLoginError}${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 transition-colors duration-200 dark:bg-[#0A0A0A] dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{t.appName}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {isSignUp ? t.authCreate : t.authWelcome}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label={t.language}
              value={lang}
              onChange={onLangChange}
              className="h-9 rounded-lg border border-zinc-200 bg-transparent px-2 text-sm font-medium text-zinc-500 outline-none dark:border-zinc-800"
            >
              {languages.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-label={t.theme}
              onClick={onThemeToggle}
              className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-zinc-800"
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707m12.728 0-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm dark:border-zinc-800 dark:bg-[#111111]">
          <p className="mb-6 text-sm leading-6 text-zinc-500">
            {isSignUp ? t.authCreateText : t.authWelcomeText}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-500">{t.authName}</span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder={t.authNamePh}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-500">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-500">{t.authPassword}</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="........"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            {message && (
              <p className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {loading ? t.authLoading : isSignUp ? t.authSignup : t.authLogin}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsSignUp((current) => !current);
              setMessage('');
            }}
            className="mt-6 w-full text-center text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {isSignUp ? t.authSwitchLogin : t.authSwitchSignup}
          </button>
        </div>
      </div>
    </div>
  );
}
