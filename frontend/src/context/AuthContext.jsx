// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Login function
  const login = async (credentials) => {
    const res = await API.post("/auth/login", credentials);

    // Save token
    localStorage.setItem("token", res.data.data.token);

    // Save user info (make sure backend returns role!)
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: res.data.data.user.email,
        role: res.data.data.user.role,
      })
    );

    // Fetch profile immediately
    const profile = await API.get("/auth/me");
    setUser(profile.data.data);

    return profile.data.data;
  };

  // Fetch user profile if token exists
  const fetchUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data.data);
    } catch {
      logout();
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchUser();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
