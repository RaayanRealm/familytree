import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./../styles/Header.css";


const Header = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        window.dispatchEvent(new Event("userChanged"));
        setMenuOpen(false);
        navigate("/login");
    };

    const handleProfileClick = () => {
        setMenuOpen(open => !open);
    };

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    return (
        <header className="header">
            <nav>
                <Link to="/" className="header-logo">Home</Link>
                {user && (user.role === "admin" || user.role === "editor") && (
                    <Link to="/add-member" className="header-link">Add</Link>
                )}
                <Link to="/events" className="header-link">Events</Link>
                <Link to="/family/tree" className="header-link">Family Tree</Link>
                <Link to="/help/faq" className="header-link">Help</Link>
                <span className="header-spacer" />
                {!user ? (
                    <Link to="/login" className="header-login-btn">Sign In</Link>
                ) : (
                    <div className="header-profile-menu" ref={menuRef}>
                        <button
                            className="header-profile-btn"
                            onClick={handleProfileClick}
                            aria-label="Profile"
                        >
                            <img
                                src={
                                    user.profile_picture
                                        ? user.profile_picture.startsWith("http")
                                            ? user.profile_picture
                                            : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${user.profile_picture}`
                                        : "/default-profile.png"
                                }
                                alt="profile"
                                className="header-profile-pic"
                            />
                        </button>
                        {menuOpen && (
                            <div className="header-profile-dropdown">
                                <div className="header-profile-info">
                                    <img
                                        src={
                                            user.profile_picture
                                                ? user.profile_picture.startsWith("http")
                                                    ? user.profile_picture
                                                    : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${user.profile_picture}`
                                                : "/default-profile.png"
                                        }
                                        alt="profile"
                                        className="header-profile-pic-large"
                                    />
                                    <div className="header-profile-username">{user.username}</div>
                                    <div className="header-profile-name">{user.name}</div>
                                </div>
                                <button
                                    className="header-profile-settings-btn"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        navigate("/user/settings");
                                    }}
                                >
                                    Settings
                                </button>
                                <button className="header-logout-btn" onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;