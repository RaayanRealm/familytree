import React, { useState, useEffect } from "react";
import "./../styles/UserSettings.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const UserSettings = () => {
    const [user, setUser] = useState(() => {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : null;
    });
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        profile_picture: null,
        profile_picture_url: "",
    });
    const [passwordForm, setPasswordForm] = useState({
        password: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [showRoleAssign, setShowRoleAssign] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedRole, setSelectedRole] = useState("viewer");
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [roleAssignMsg, setRoleAssignMsg] = useState("");
    const [roleAssignError, setRoleAssignError] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [memberSearch, setMemberSearch] = useState("");
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [memberSearchResults, setMemberSearchResults] = useState([]);

    // Fetch user info from API on mount
    useEffect(() => {
        async function fetchUser() {
            if (!user) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const data = await res.json();
                if (res.ok && data.user) {
                    setUser(data.user);
                    setForm(f => ({
                        ...f,
                        name: data.user.name || "",
                        email: data.user.email || "",
                        phone: data.user.phone || "",
                        profile_picture_url: data.user.profile_picture || "",
                    }));
                }
            } catch (err) {
                // ignore
            }
        }
        fetchUser();
        // eslint-disable-next-line
    }, []);

    // Fetch all users and members for role/member assignment
    useEffect(() => {
        if (showRoleAssign) {
            fetch(`${API_BASE_URL}/api/users`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
                .then(res => res.json())
                .then(data => setAllUsers(data.users || []));
            fetch(`${API_BASE_URL}/api/family/members`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
                .then(res => res.json())
                .then(data => setAllMembers(data || []));
        }
    }, [showRoleAssign]);

    // Filter users/members as user types
    useEffect(() => {
        if (userSearch.trim()) {
            setUserSearchResults(
                allUsers.filter(u =>
                    (u.name || u.username || "")
                        .toLowerCase()
                        .includes(userSearch.toLowerCase())
                )
            );
        } else {
            setUserSearchResults([]);
        }
    }, [userSearch, allUsers]);

    useEffect(() => {
        if (memberSearch.trim()) {
            setMemberSearchResults(
                allMembers.filter(m =>
                    (`${m.first_name} ${m.last_name}` || "")
                        .toLowerCase()
                        .includes(memberSearch.toLowerCase())
                )
            );
        } else {
            setMemberSearchResults([]);
        }
    }, [memberSearch, allMembers]);

    const handleChange = e => {
        const { name, value, files } = e.target;
        if (name === "profile_picture") {
            setForm(f => ({ ...f, profile_picture: files[0] }));
        } else {
            setForm(f => ({ ...f, [name]: value }));
        }
    };

    const handlePasswordChange = e => {
        const { name, value } = e.target;
        setPasswordForm(f => ({ ...f, [name]: value }));
    };

    const handleInfoUpdate = async e => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);
        try {
            const formData = new FormData();
            for (const key of ["name", "email", "phone"]) {
                formData.append(key, form[key]);
            }
            if (form.profile_picture) {
                formData.append("profile_picture_file", form.profile_picture);
            }
            const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });
            const data = await res.json();
            if (res.ok && data.user) {
                setSuccessMsg("Profile updated!");
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                setForm(f => ({
                    ...f,
                    profile_picture: null,
                    profile_picture_url: data.user.profile_picture || f.profile_picture_url
                }));
            } else {
                setError(data.error || "Update failed");
            }
        } catch (err) {
            setError("Network error");
        }
        setLoading(false);
    };

    const handlePasswordUpdate = async e => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);
        if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("Passwords do not match or are empty.");
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ password: passwordForm.newPassword }),
            });
            const data = await res.json();
            if (res.ok && data.user) {
                setSuccessMsg("Password changed!");
                setPasswordForm({ password: "", newPassword: "", confirmPassword: "" });
            } else {
                setError(data.error || "Password change failed");
            }
        } catch (err) {
            setError("Network error");
        }
        setLoading(false);
    };

    const handleRoleAssign = async e => {
        e.preventDefault();
        setRoleAssignMsg("");
        setRoleAssignError("");
        if (!selectedUserId || !selectedRole) {
            setRoleAssignError("Please select user and role.");
            return;
        }
        try {
            const body = { role: selectedRole };
            if (selectedRole === "editor" && selectedMemberId) {
                body.member_id = selectedMemberId;
            }
            const res = await fetch(`${API_BASE_URL}/api/users/${selectedUserId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok && data.user) {
                setRoleAssignMsg("Role/member assigned successfully!");
            } else {
                setRoleAssignError(data.error || "Failed to assign role/member.");
            }
        } catch (err) {
            setRoleAssignError("Network error");
        }
    };

    if (!user) return <div className="user-settings-bg"><div className="user-settings-container"><p>Please sign in.</p></div></div>;

    return (
        <div className="user-settings-bg">
            <div className="user-settings-container">
                <h1 className="user-settings-title">User Settings</h1>
                <div className="user-settings-profile-pic-wrap">
                    <img
                        src={
                            form.profile_picture
                                ? URL.createObjectURL(form.profile_picture)
                                : form.profile_picture_url
                                    ? form.profile_picture_url.startsWith("http")
                                        ? form.profile_picture_url
                                        : `${API_BASE_URL}${form.profile_picture_url}`
                                    : "/default-profile.png"
                        }
                        alt="profile"
                        className="user-settings-profile-pic"
                    />
                </div>
                <form className="user-settings-form" onSubmit={handleInfoUpdate} encType="multipart/form-data">
                    <input
                        className="user-settings-input"
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="user-settings-input"
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="user-settings-input"
                        type="tel"
                        name="phone"
                        placeholder="Phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="user-settings-input"
                        type="file"
                        name="profile_picture"
                        accept="image/*"
                        onChange={handleChange}
                    />
                    <button className="user-settings-btn" type="submit" disabled={loading}>
                        {loading ? "Updating..." : "Update Info"}
                    </button>
                </form>
                <hr style={{ margin: "2rem 0" }} />
                <form className="user-settings-form" onSubmit={handlePasswordUpdate}>
                    <input
                        className="user-settings-input"
                        type="password"
                        name="newPassword"
                        placeholder="New Password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                    />
                    <input
                        className="user-settings-input"
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                    />
                    <button className="user-settings-btn" type="submit" disabled={loading}>
                        {loading ? "Changing..." : "Change Password"}
                    </button>
                </form>
                {/* --- Role/Member Assignment Section --- */}
                {user && user.role === "admin" && (
                    <div className="user-settings-role-assign">
                        <label style={{ display: "flex", alignItems: "center", margin: "1.5rem 0 0.5rem 0" }}>
                            <input
                                type="checkbox"
                                checked={showRoleAssign}
                                onChange={e => setShowRoleAssign(e.target.checked)}
                                style={{ marginRight: "0.7rem" }}
                            />
                            Change/Assign Role
                        </label>
                        {showRoleAssign && (
                            <form className="user-settings-form" onSubmit={handleRoleAssign} style={{ marginTop: "1rem" }}>
                                <div style={{ marginBottom: "0.7rem" }}>
                                    <label>User:&nbsp;</label>
                                    <input
                                        className="user-settings-input"
                                        type="text"
                                        placeholder="Search user by name"
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        style={{ marginBottom: "0.5rem" }}
                                        autoComplete="off"
                                    />
                                    {userSearch && userSearchResults.length > 0 && (
                                        <div className="user-settings-search-dropdown">
                                            {userSearchResults.map(u => (
                                                <div
                                                    key={u.id}
                                                    className={`user-settings-search-item${selectedUserId === String(u.id) ? " selected" : ""}`}
                                                    onClick={() => {
                                                        setSelectedUserId(u.id);
                                                        setUserSearch(`${u.username} (${u.name})`);
                                                        setUserSearchResults([]);
                                                    }}
                                                >
                                                    {u.username} ({u.name})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginBottom: "0.7rem" }}>
                                    <label>Role:&nbsp;
                                        <select
                                            className="user-settings-input"
                                            value={selectedRole}
                                            onChange={e => setSelectedRole(e.target.value)}
                                            required
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="guest">Guest</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </label>
                                </div>
                                {(selectedRole === "editor") && (
                                    <div style={{ marginBottom: "0.7rem" }}>
                                        <label>Assign Member (for lineage):&nbsp;</label>
                                        <input
                                            className="user-settings-input"
                                            type="text"
                                            placeholder="Search member by name"
                                            value={memberSearch}
                                            onChange={e => setMemberSearch(e.target.value)}
                                            style={{ marginBottom: "0.5rem" }}
                                            autoComplete="off"
                                        />
                                        {memberSearch && memberSearchResults.length > 0 && (
                                            <div className="user-settings-search-dropdown">
                                                {memberSearchResults.map(m => (
                                                    <div
                                                        key={m.id}
                                                        className={`user-settings-search-item${selectedMemberId === String(m.id) ? " selected" : ""}`}
                                                        onClick={() => {
                                                            setSelectedMemberId(m.id);
                                                            setMemberSearch(`${m.first_name} ${m.last_name} (ID: ${m.id})`);
                                                            setMemberSearchResults([]);
                                                        }}
                                                    >
                                                        {m.first_name} {m.last_name} (ID: {m.id})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button className="user-settings-btn" type="submit">
                                    Assign Role/Member
                                </button>
                                {roleAssignMsg && <div className="user-settings-success">{roleAssignMsg}</div>}
                                {roleAssignError && <div className="user-settings-error">{roleAssignError}</div>}
                            </form>
                        )}
                    </div>
                )}
                {/* --- End Role/Member Assignment Section --- */}
                {error && <div className="user-settings-error">{error}</div>}
                {successMsg && <div className="user-settings-success">{successMsg}</div>}
            </div>
        </div>
    );
};

export default UserSettings;
