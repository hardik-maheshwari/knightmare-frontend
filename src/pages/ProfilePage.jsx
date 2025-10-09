import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import "./ProfilePage.css";

function ProfilePage() {
  console.log("[ProfilePage] Component rendering.");

  const { user, isAuthLoading, logout } = useAuth();

  console.debug("[ProfilePage] State from useAuth:", { user, isAuthLoading });

  const handleLogout = () => {
    console.log("[ProfilePage] handleLogout called.");
    logout();
  };

  if (isAuthLoading) {
    console.log("[ProfilePage] Auth is loading. Rendering loading fallback.");
    return (
      <div className="profile-container">
        <h1>Loading Profile...</h1>
      </div>
    );
  }

  if (!user) {
    console.warn(
      "[ProfilePage] No user data found, but page was rendered. This should normally be prevented by ProtectedRoute. Rendering fallback UI."
    );
    return (
      <div className="profile-container">
        <h1>No User Data</h1>
        <p>No user data found. You may need to log in.</p>
        <Link to="/login" className="primary-button">
          Go to Login
        </Link>
      </div>
    );
  }

  console.log(`[ProfilePage] Rendering profile for user: ${user.username}`);
  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      <div className="profile-card">
        <p>
          <strong>Username:</strong> {user.username}
        </p>
        <p>
          <strong>User ID:</strong> {user.user_id}
        </p>
        <p>
          <strong>Member Since:</strong>{" "}
          {new Date(user.member_since).toLocaleDateString()}
        </p>
      </div>

      <Link to="/lobby" className="primary-button">
        Go to Lobby
      </Link>

      <button onClick={handleLogout} className="logout-button">
        Log Out
      </button>
    </div>
  );
}

export default ProfilePage;
