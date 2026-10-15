
import { useState } from "react";
import api from "./services/api";
import Dashboard from "./Dashboard";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("subtrack_token");
    const savedUser = localStorage.getItem("subtrack_user");

    if (token && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        localStorage.removeItem("subtrack_user");
      }
    }

    return null;
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await api.post(endpoint, payload);
      const data = response.data;

      localStorage.setItem("subtrack_token", data.token);

      const currentUser = {
        id: data.id,
        name: data.name,
        email: data.email,
      };

      localStorage.setItem("subtrack_user", JSON.stringify(currentUser));
      setUser(currentUser);
      setPassword("");
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        setMessage("Invalid email or password.");
      } else if (status === 409) {
        setMessage("An account with this email already exists.");
      } else if (status === 400) {
        setMessage("Please check your details and try again.");
      } else {
        setMessage(
          "Unable to connect to SubTrack. Check that the backend is running."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("subtrack_token");
    localStorage.removeItem("subtrack_user");
    setUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setMessage("");
    setIsLogin(true);
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <main className="app-shell">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-icon">S</div>
          <h1>SubTrack</h1>
        </div>

        <p className="eyebrow">TAKE CONTROL OF YOUR SPENDING</p>

        <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>

        <p className="description">
          {isLogin
            ? "Sign in to keep your subscriptions organized."
            : "Start tracking your subscriptions in one place."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? "tab active" : "tab"}
            onClick={() => {
              setIsLogin(true);
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? "tab active" : "tab"}
            onClick={() => {
              setIsLogin(false);
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <label>
              Full name
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={150}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
          </label>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="footer-note">
          Secure authentication powered by SubTrack
        </p>
      </section>
    </main>
  );
}

export default App;
