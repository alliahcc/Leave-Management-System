import { useState, useEffect } from "react";
import API from "../api/axios";

export function useAdminUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    fetchUser();
  }, []);

  return user;
}
