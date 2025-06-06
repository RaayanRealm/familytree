import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./../styles/Header.css";
import Search from "./Search";
import { getFamilyMembers } from "../services/api";
import AsyncSelect from "react-select/async";

const Header = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef();

    const [members, setMembers] = useState([]);
    const [editMemberId, setEditMemberId] = useState("");

    useEffect(() => {
        getFamilyMembers().then(setMembers); // ✅ Fetch all members for search
    }, []);

    // For react-select async search
    const loadMemberOptions = (inputValue, callback) => {
        if (!inputValue) {
            callback([]);
            return;
        }
        const filtered = members
            .filter(m =>
                `${m.first_name} ${m.last_name}`.toLowerCase().includes(inputValue.toLowerCase())
            )
            .map(m => ({
                value: m.id,
                label: `${m.first_name} ${m.last_name}`
            }));
        callback(filtered);
    };

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
            <div className="logo-title">
                <h1>🌳 Family Database</h1>
            </div>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    {user && (user.role === "admin" || user.role === "editor") && (
                        <li className="dropdown">
                            <span>Add</span>
                            <ul className="dropdown-menu">
                                <li>
                                    <Link to="/add-member" className="add-member-header-btn">
                                        Add Member
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/add-marriage" className="add-member-header-btn">
                                        Add Marriage
                                    </Link>
                                </li>
                                <li style={{ minWidth: 220 }}>
                                    <AsyncSelect
                                        cacheOptions
                                        loadOptions={loadMemberOptions}
                                        defaultOptions={members.slice(0, 10).map(m => ({
                                            value: m.id,
                                            label: `${m.first_name} ${m.last_name}`
                                        }))}
                                        onChange={option => {
                                            if (option && option.value) {
                                                window.location.href = `/edit-member/${option.value}`;
                                            }
                                        }}
                                        placeholder="Edit Member..."
                                        classNamePrefix="relation-async-select"
                                        isClearable
                                        styles={{
                                            container: base => ({
                                                ...base,
                                                minWidth: 180,
                                                maxWidth: 260,
                                                margin: "0.2rem 0",
                                                zIndex: 1200, // ensure above content
                                            }),
                                            control: base => ({
                                                ...base,
                                                background: "#f8fafc", // light background for input
                                                color: "#222",
                                                borderColor: "#01a982",
                                                minHeight: 36,
                                                boxShadow: "none"
                                            }),
                                            menu: base => ({
                                                ...base,
                                                zIndex: 2000, // ensure above dialogs/pages
                                                background: "#fff",
                                                color: "#222",
                                                border: "1px solid #01a982"
                                            }),
                                            option: base => ({
                                                ...base,
                                                color: "#222",
                                                background: "#fff",
                                                "&:hover": {
                                                    background: "#e6f7f3"
                                                }
                                            })
                                        }}
                                    />
                                </li>
                            </ul>
                        </li>
                    )}
                    <li className="dropdown">
                        <span>Help</span>
                        <ul className="dropdown-menu">
                            <li><Link to="/help/faq">FAQ</Link></li>
                            <li><Link to="/help/contact">Contact Us</Link></li>
                            <li><Link to="/help/about">About Family Tree</Link></li>
                        </ul>
                    </li>
                    <Search members={members} />
                    <li>
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
                                                ? (user.profile_picture.startsWith("http")
                                                    ? user.profile_picture
                                                    : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/images"}${user.profile_picture}`)
                                                : "http://localhost:5000/images/default-profile.png"
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
                                                        ? (user.profile_picture.startsWith("http")
                                                            ? user.profile_picture
                                                            : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/images"}${user.profile_picture}`)
                                                        : "http://localhost:5000/images/default-profile.png"
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
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;