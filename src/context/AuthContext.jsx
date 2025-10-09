import React, { createContext, useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AuthContext = createContext({
  token: null,
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  login: () => {},
  logout: () => {},
  api: async () => {
    throw new Error("AuthContext not yet available");
  },
});

export function AuthProvider({ children }) {
  console.log("[AuthProvider] Component is rendering.");
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("token");
    console.log(
      "[AuthProvider] Initializing token state from localStorage. Found token:",
      !!storedToken
    );
    return storedToken;
  });
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    console.log(
      "[AuthProvider] Interceptor effect is running. Token has changed."
    );
    console.debug("[AuthProvider] Current token for interceptor:", token);

    const requestInterceptor = apiClient.interceptors.request.use(
      (config) => {
        console.debug(
          "[apiClient Request Interceptor] Attaching token to request for URL:",
          config.url
        );
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error(
          "[apiClient Request Interceptor] Error creating request:",
          error
        );
        return Promise.reject(error);
      }
    );

    // IMPORTANT: When the component unmounts or the token changes,
    // we need to "eject" the old interceptor to avoid memory leaks or using stale tokens.
    return () => {
      console.log("[AuthProvider] Cleaning up and ejecting interceptor.");
      apiClient.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  }, []);

  // 2. NEW: The core verification logic
  useEffect(() => {
    console.log("[AuthProvider] Token verification effect is running.");
    const verifyToken = async () => {
      if (token) {
        console.log(
          "[AuthProvider] Token found. Attempting to verify with /api/auth/profile."
        );
        try {
          const response = await apiClient.get("/api/auth/profile/");
          const { data: userProfile } = response.data;
          console.log(
            "[AuthProvider] Token verification successful. Setting user:",
            userProfile
          );
          setUser(userProfile);
        } catch (error) {
          console.error("Error verifying token:", error);
          console.error(
            "[AuthProvider] Token verification failed. Calling logout().",
            error.response || error
          );
          logout(); // If any error occurs, log out.
        }
      } else {
        console.log("[AuthProvider] No token found. Skipping verification.");
      }
      // Whether we had a token or not, the initial auth check is now complete.
      setIsAuthLoading(false);
    };

    verifyToken();
  }, [token, logout]); // This effect depends on the token and the logout function.

  const login = (newToken) => {
    console.log(
      "[AuthProvider] login() called. Setting new token and saving to localStorage."
    );
    console.debug("[AuthProvider] New token:", newToken);
    setToken(newToken);

    localStorage.setItem("token", newToken);
  };

  // 4. Update the context value
  const value = {
    token,
    user, // Pass down the user object
    isAuthenticated: !!user, // Authentication is now based on having a user object
    isAuthLoading,
    login,
    logout,
  };

  console.log(
    "%cAUTH CONTEXT: Provider rendering. Current state is:",
    "color: purple; font-weight: bold;",
    { token, user, isAuthLoading }
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
