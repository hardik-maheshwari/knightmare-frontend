// src/hooks/useAuth.js

import { useContext } from "react";
import AuthContext from "../context/AuthContext";

// This file now ONLY exports the hook.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
