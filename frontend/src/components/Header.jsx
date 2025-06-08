import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./../styles/Header.css";
import { getFamilyMembersPaginated } from "../services/api";
import { FaSearch } from "react-icons/fa";

const Header = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef();

    const [members, setMembers] = useState([]);
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [helpMenuOpen, setHelpMenuOpen] = useState(false);
    const addMenuRef = useRef();
    const helpMenuRef = useRef();
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [editMemberSearch, setEditMemberSearch] = useState("");
    const [editMemberResults, setEditMemberResults] = useState([]);

    useEffect(() => {
        getFamilyMembersPaginated(1, 50).then(data => {
            setMembers(data.members || []);
            console.log('Loaded members:', data.members); // Debug: ensure members are loaded
        });
    }, []);

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

    // Close menus on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
            if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
                setAddMenuOpen(false);
            }
            if (helpMenuRef.current && !helpMenuRef.current.contains(event.target)) {
                setHelpMenuOpen(false);
            }
        }
        if (menuOpen || addMenuOpen || helpMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen, addMenuOpen, helpMenuOpen]);

    // Modern search box logic
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchValue(val);
        if (val.length > 1) {
            setSearchResults(
                members.filter(m =>
                    `${m.first_name} ${m.last_name}`.toLowerCase().includes(val.toLowerCase())
                ).slice(0, 7)
            );
        } else {
            setSearchResults([]);
        }
    };

    const handleSearchSelect = (memberId) => {
        setSearchValue("");
        setSearchResults([]);
        navigate(`/member/${memberId}`);
    };

    // Edit member search logic
    const handleEditMemberSearchChange = (e) => {
        const val = e.target.value;
        setEditMemberSearch(val);
        if (val.length > 1 && members.length > 0) {
            setEditMemberResults(
                members.filter(m =>
                    `${m.first_name} ${m.last_name}`.toLowerCase().includes(val.toLowerCase())
                ).slice(0, 7)
            );
        } else {
            setEditMemberResults([]);
        }
    };

    const handleEditMemberSelect = (memberId) => {
        setEditMemberSearch("");
        setEditMemberResults([]);
        navigate(`/edit-member/${memberId}`);
    };

    return (
        <header className="header" style={{ zIndex: 3000 }}>
            <div className="logo-title">
                <h1>
                    <span role="img" aria-label="tree" style={{ fontSize: "2.1rem", verticalAlign: "middle" }}>🌳</span>
                    Family Database
                </h1>
            </div>
            <nav className="header-nav" style={{ zIndex: 3000 }}>
                <ul>
                    <li><Link to="/" className="header-link">Home</Link></li>
                    {user && (user.role === "admin" || user.role === "editor") && (
                        <li className="dropdown" ref={addMenuRef} style={{ zIndex: 3100 }}>
                            <span
                                className="header-link"
                                onClick={e => {
                                    e.stopPropagation();
                                    setAddMenuOpen(open => !open);
                                }}
                                tabIndex={0}
                                style={{ userSelect: "none" }}
                            >
                                Add
                            </span>
                            {addMenuOpen && (
                                <ul className="dropdown-menu" onMouseDown={e => e.stopPropagation()} style={{ zIndex: 3200 }}>
                                    <li>
                                        <Link to="/add-member" className="add-member-header-btn" onClick={() => setAddMenuOpen(false)}>
                                            Add Member
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/add-marriage" className="add-member-header-btn" onClick={() => setAddMenuOpen(false)}>
                                            Add Marriage
                                        </Link>
                                    </li>
                                    <li style={{ minWidth: 220, zIndex: 3300 }}>
                                        {/* Edit Member modern search box */}
                                        <div className="modern-search-box" style={{ zIndex: 3400 }}>
                                            <FaSearch className="modern-search-icon" />
                                            <input
                                                type="text"
                                                className="modern-search-input"
                                                placeholder="Edit member..."
                                                value={editMemberSearch}
                                                onChange={handleEditMemberSearchChange}
                                                autoComplete="off"
                                                style={{ paddingLeft: 36 }}
                                            />
                                            {editMemberResults.length > 0 && (
                                                <div className="modern-search-dropdown" style={{ zIndex: 3500 }}>
                                                    {editMemberResults.map(m => (
                                                        <div
                                                            key={m.id}
                                                            className="modern-search-item"
                                                            onMouseDown={() => {
                                                                handleEditMemberSelect(m.id);
                                                                setAddMenuOpen(false);
                                                            }}
                                                        >
                                                            {m.first_name} {m.last_name}
                                                            {m.current_location ? (
                                                                <span style={{ color: "#888", fontSize: "0.7em" }}> ({m.current_location})</span>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                </ul>
                            )}
                        </li>
                    )}
                    <li className="dropdown" ref={helpMenuRef} style={{ zIndex: 3100 }}>
                        <span
                            className="header-link"
                            onClick={() => setHelpMenuOpen(open => !open)}
                            tabIndex={0}
                            onBlur={() => setTimeout(() => setHelpMenuOpen(false), 150)}
                            style={{ userSelect: "none" }}
                        >
                            Help
                        </span>
                        {helpMenuOpen && (
                            <ul className="dropdown-menu" style={{ zIndex: 3200 }}>
                                <li><Link to="/help/faq" onClick={() => setHelpMenuOpen(false)}>FAQ</Link></li>
                                <li><Link to="/help/contact" onClick={() => setHelpMenuOpen(false)}>Contact Us</Link></li>
                                <li><Link to="/help/about" onClick={() => setHelpMenuOpen(false)}>About Family Tree</Link></li>
                            </ul>
                        )}
                    </li>
                    <li style={{ position: "relative", minWidth: 220, marginLeft: "1.2rem", zIndex: 3100 }}>
                        <div className="modern-search-box" style={{ zIndex: 3200 }}>
                            <FaSearch className="modern-search-icon" />
                            <input
                                type="text"
                                className="modern-search-input"
                                placeholder="Search members..."
                                value={searchValue}
                                onChange={handleSearchChange}
                                autoComplete="off"
                                style={{ paddingLeft: 36 }}
                            />
                            {searchResults.length > 0 && (
                                <div className="modern-search-dropdown" style={{ zIndex: 3500 }}>
                                    {searchResults.map(m => (
                                        <div
                                            key={m.id}
                                            className="modern-search-item"
                                            onMouseDown={() => handleSearchSelect(m.id)}
                                        >
                                            {m.first_name} {m.last_name}
                                            {m.current_location ? (
                                                <span style={{ color: "#888", fontSize: "0.98em" }}> ({m.current_location})</span>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </li>
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
                                            user && user.profile_picture
                                                ? (user.profile_picture.startsWith("http")
                                                    ? user.profile_picture
                                                    : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${user.profile_picture}`)
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
                                                    user && user.profile_picture
                                                        ? (user.profile_picture.startsWith("http")
                                                            ? user.profile_picture
                                                            : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${user.profile_picture}`)
                                                        : "http://localhost:5000/images/default-profile.png"
                                                }
                                                alt="profile"
                                                className="header-profile-pic-large"
                                            />
                                            <div className="header-profile-username">{user?.username || ""}</div>
                                            <div className="header-profile-name">{user?.name || ""}</div>
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