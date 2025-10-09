import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AuthGateway() {
  const { isAuthenticated, isAuthLoading } = useAuth();

  console.log("[AuthGateway] Rendering.");
  console.debug("[AuthGateway] State:", { isAuthenticated, isAuthLoading });

  if (isAuthLoading) {
    console.log("[AuthGateway] Auth is loading. Rendering loading fallback.");
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    console.log(
      "[AuthGateway] User is authenticated. Redirecting to /profile."
    );
    return <Navigate to="/profile" replace />;
  } else {
    console.log(
      "[AuthGateway] User is NOT authenticated. Redirecting to /login."
    );
    return <Navigate to="/login" replace />;
  }
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuth();

  // Let's get the name of the child component for a more informative log.
  const componentName = children.type.name || "Component";

  console.log(`[ProtectedRoute] Checking access for <${componentName}>.`);
  console.debug(`[ProtectedRoute] State for <${componentName}>:`, {
    isAuthenticated,
    isAuthLoading,
  });

  if (isAuthLoading) {
    console.log(
      `[ProtectedRoute] Auth is loading. Rendering loading fallback for <${componentName}>.`
    );
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    console.log(
      `[ProtectedRoute] Access GRANTED for <${componentName}>. Rendering child component.`
    );
    return children;
  } else {
    console.warn(
      `[ProtectedRoute] Access DENIED for <${componentName}>. Redirecting to /login.`
    );
    return <Navigate to="/login" replace />;
  }
}

export function PublicRoute({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuth();

  const componentName = children.type.name || "Component";

  console.log(`[PublicRoute] Checking access for <${componentName}>.`);
  console.debug(`[PublicRoute] State for <${componentName}>:`, {
    isAuthenticated,
    isAuthLoading,
  });

  if (isAuthLoading) {
    console.log(
      `[PublicRoute] Auth is loading. Rendering loading fallback for <${componentName}>.`
    );
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    console.warn(
      `[PublicRoute] User is authenticated, but trying to access a public-only route <${componentName}>. Redirecting to /lobby.`
    );
    return <Navigate to="/lobby" replace />;
  }

  console.log(
    `[PublicRoute] User is not authenticated. Access GRANTED for <${componentName}>. Rendering child component.`
  );
  return children;
}
