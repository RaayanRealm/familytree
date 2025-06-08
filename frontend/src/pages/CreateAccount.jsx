import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/CreateAccount.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CreateAccount = () => {
    const [form, setForm] = useState({
        username: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        profile_picture: null,
    });
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = e => {
        const { name, value, files } = e.target;
        if (name === "profile_picture") {
            setForm(f => ({ ...f, profile_picture: files[0] }));
        } else {
            setForm(f => ({ ...f, [name]: value }));
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);
        try {
            const formData = new FormData();
            for (const key of ["username", "password", "name", "email", "phone"]) {
                formData.append(key, form[key]);
            }
            if (form.profile_picture) {
                formData.append("profile_picture_file", form.profile_picture);
            }
            const res = await fetch(`${API_BASE_URL}/users`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok && data.user) {
                setSuccessMsg("Account created! You can now sign in.");
                setTimeout(() => navigate("/login"), 1200);
            } else {
                setError(data.error || "Account creation failed");
            }
        } catch (err) {
            setError("Network error");
        }
        setLoading(false);
    };

    return (
        <div className="create-account-bg">
            <div className="create-account-container">
                <h1 className="create-account-title">Create Account</h1>
                <form className="create-account-form" onSubmit={handleSubmit} encType="multipart/form-data">
                    <input
                        className="create-account-input"
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={form.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="create-account-input"
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="create-account-input"
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="create-account-input"
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="create-account-input"
                        type="tel"
                        name="phone"
                        placeholder="Phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="create-account-input"
                        type="file"
                        name="profile_picture"
                        accept="image/*"
                        onChange={handleChange}
                    />
                    <button className="create-account-btn" type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                    {error && <div className="create-account-error">{error}</div>}
                    {successMsg && <div className="create-account-success">{successMsg}</div>}
                </form>
                <div className="create-account-footer">
                    <button className="create-account-link" onClick={() => navigate("/login")}>
                        Back to Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateAccount;
