import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addFamilyMember, getFamilyMembersPaginated } from "../services/api";
import "../styles/AddMember.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AsyncSelect from "react-select/async";

const initialState = {
    first_name: "",
    last_name: "",
    nickname: "",
    gender: "",
    dob: "",
    place_of_birth: "",
    current_location: "",
    occupation: "",
    nationality: "Indian",
    phone: "",
    email: "",
    profile_picture: "",
    biography: "",
    death: {
        hasDied: false,
        date: "",
        cause: "",
        place: "",
        obituary: ""
    },
    relationships: [
        // { relative_id: "", relationship_type: "" }
    ]
};

const AddMember = () => {
    const [form, setForm] = useState(initialState);
    const [dob, setDob] = useState(null);
    const [error, setError] = useState("");
    const [profileFile, setProfileFile] = useState(null);
    const [death, setDeath] = useState(initialState.death);
    const [deathDate, setDeathDate] = useState(null);
    const [relationships, setRelationships] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch first page of members for relationship selection
        getFamilyMembersPaginated().then(data => setAllMembers(data.members || []));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDobChange = (date) => {
        setDob(date);
        setForm((prev) => ({
            ...prev,
            dob: date ? date.toISOString().split("T")[0] : ""
        }));
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        setProfileFile(file);
        if (file) {
            // Only allow image files
            if (!file.type.startsWith("image/")) {
                setError("Only image files are allowed for profile picture.");
                return;
            }
            // Check minimum pixel size (e.g., 120x120)
            const img = new window.Image();
            img.onload = function () {
                if (img.width < 120 || img.height < 120) {
                    setError("Profile picture must be at least 120x120 pixels.");
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                    setForm((prev) => ({
                        ...prev,
                        profile_picture: reader.result
                    }));
                };
                reader.readAsDataURL(file);
            };
            img.onerror = function () {
                setError("Invalid image file.");
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const handleDeathChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDeath(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleDeathDateChange = (date) => {
        setDeathDate(date);
        setDeath(prev => ({
            ...prev,
            date: date ? date.toISOString().split("T")[0] : ""
        }));
    };

    // Relationship handlers
    const handleAddRelation = () => {
        setRelationships([...relationships, { relative_id: "", relationship_type: "" }]);
    };

    const handleRelationChange = (idx, e) => {
        const { name, value } = e.target;
        setRelationships(rel =>
            rel.map((r, i) => i === idx ? { ...r, [name]: value } : r)
        );
    };

    const handleRelationMemberChange = (idx, value) => {
        setRelationships(rel =>
            rel.map((r, i) => i === idx ? { ...r, relative_id: value } : r)
        );
    };

    const handleRemoveRelation = (idx) => {
        setRelationships(rel => rel.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.place_of_birth || !form.current_location) {
            setError("Place of Birth and Current Location are required.");
            return;
        }
        // Prepare payload
        const payload = {
            ...form,
            death: death.hasDied && death.date ? {
                date: death.date,
                cause: death.cause,
                place: death.place,
                obituary: death.obituary
            } : {},
            relationships: relationships.filter(r => r.relative_id && r.relationship_type)
        };
        try {
            await addFamilyMember(payload);
            navigate("/members");
        } catch (err) {
            setError("Failed to add member. Please check your input.");
        }
    };

    // For react-select async search
    const loadMemberOptions = (inputValue, callback) => {
        if (!inputValue) {
            callback([]);
            return;
        }
        // Find all members matching the search
        const filtered = allMembers
            .filter(m =>
                `${m.first_name} ${m.last_name}`.toLowerCase().includes(inputValue.toLowerCase())
            )
            .map(m => ({
                value: m.id,
                label: `${m.first_name} ${m.last_name}`
            }));

        // Find duplicates by name
        const nameCount = {};
        filtered.forEach(opt => {
            nameCount[opt.label] = (nameCount[opt.label] || 0) + 1;
        });

        // Enhance label for duplicates
        const enhanced = filtered.map(opt => {
            if (nameCount[opt.label] > 1) {
                // Find the member
                const member = allMembers.find(m => m.id === opt.value);
                // Show occupation and/or relationship count for distinction
                let extra = [];
                if (member.occupation) extra.push(member.occupation);
                if (member.nickname) extra.push(`"${member.nickname}"`);
                if (member.current_location) extra.push(member.current_location);
                return {
                    ...opt,
                    label: `${opt.label} (${extra.join(", ") || "ID: " + member.id})`
                };
            }
            return opt;
        });

        callback(enhanced);
    };

    return (
        <div className="add-member-container main-card">
            <h2>Add New Family Member</h2>
            <form className="add-member-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <label>First Name*</label>
                    <input name="first_name" value={form.first_name} onChange={handleChange} required />
                </div>
                <div className="form-row">
                    <label>Last Name*</label>
                    <input name="last_name" value={form.last_name} onChange={handleChange} required />
                </div>
                <div className="form-row">
                    <label>Nickname</label>
                    <input name="nickname" value={form.nickname} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Gender*</label>
                    <select name="gender" value={form.gender} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="form-row">
                    <label>Date of Birth*</label>
                    <DatePicker
                        selected={dob}
                        onChange={handleDobChange}
                        dateFormat="dd MMMM yyyy"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        placeholderText="Select date"
                        className="date-picker-input"
                        required
                    />
                </div>
                <div className="form-row">
                    <label>Place of Birth*</label>
                    <input name="place_of_birth" value={form.place_of_birth} onChange={handleChange} required />
                </div>
                <div className="form-row">
                    <label>Current Location*</label>
                    <input name="current_location" value={form.current_location} onChange={handleChange} required />
                </div>
                <div className="form-row">
                    <label>Occupation</label>
                    <input name="occupation" value={form.occupation} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Nationality</label>
                    <input name="nationality" value={form.nationality} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} />
                </div>
                <div className="form-row">
                    <label>Profile Picture</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePicChange}
                        className="profile-file-input"
                    />
                    <div className="profile-or-text">or</div>
                    <input
                        name="profile_picture"
                        value={form.profile_picture && form.profile_picture.startsWith("data:") ? "" : form.profile_picture}
                        onChange={handleChange}
                        placeholder="Paste image URL"
                    />
                    {form.profile_picture && (
                        <img
                            src={form.profile_picture}
                            alt="Preview"
                            className="profile-picture-preview"
                        />
                    )}
                </div>
                <div className="form-row">
                    <label>Biography</label>
                    <textarea name="biography" value={form.biography} onChange={handleChange} rows={3} />
                </div>
                <div className="form-row">
                    <label>Relationships</label>
                    {relationships.map((rel, idx) => (
                        <div key={idx} className="relation-row">
                            <AsyncSelect
                                cacheOptions
                                loadOptions={loadMemberOptions}
                                defaultOptions={false}
                                value={
                                    rel.relative_id
                                        ? {
                                            value: rel.relative_id,
                                            label:
                                                allMembers.find(m => m.id === rel.relative_id)
                                                    ? `${allMembers.find(m => m.id === rel.relative_id).first_name} ${allMembers.find(m => m.id === rel.relative_id).last_name}`
                                                    : ""
                                        }
                                        : null
                                }
                                onChange={option => handleRelationMemberChange(idx, option ? option.value : "")}
                                placeholder="Search & select member"
                                classNamePrefix="relation-async-select"
                                isClearable
                            />
                            <select
                                name="relationship_type"
                                value={rel.relationship_type}
                                onChange={e => handleRelationChange(idx, e)}
                                className="relation-type-select"
                                required
                            >
                                <option value="">Type*</option>
                                <option value="Parent">Parent</option>
                                <option value="Child">Child</option>
                                <option value="Sibling">Sibling</option>
                                <option value="Spouse">Spouse</option>
                            </select>
                            <button type="button" onClick={() => handleRemoveRelation(idx)} className="relation-remove-btn">Remove</button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddRelation} className="relation-add-btn">Add Relationship</button>
                </div>
                <div className="form-row form-row-checkbox align-death-checkbox">
                    <label htmlFor="hasDied" className="death-label">
                        Add Death Information
                    </label>
                    <input
                        type="checkbox"
                        id="hasDied"
                        name="hasDied"
                        checked={death.hasDied}
                        onChange={handleDeathChange}
                        className="death-checkbox"
                    />
                </div>
                {death.hasDied && (
                    <>
                        <div className="form-row">
                            <label>Date of Death*</label>
                            <DatePicker
                                selected={deathDate}
                                onChange={handleDeathDateChange}
                                dateFormat="dd MMMM yyyy"
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                placeholderText="Select date"
                                className="date-picker-input"
                                required
                            />
                        </div>
                        <div className="form-row">
                            <label>Cause of Death</label>
                            <input name="cause" value={death.cause} onChange={handleDeathChange} />
                        </div>
                        <div className="form-row">
                            <label>Burial Place</label>
                            <input name="place" value={death.place} onChange={handleDeathChange} />
                        </div>
                        <div className="form-row">
                            <label>Obituary</label>
                            <textarea name="obituary" value={death.obituary} onChange={handleDeathChange} rows={2} />
                        </div>
                    </>
                )}
                {error && <div className="form-error">{error}</div>}
                <button type="submit" className="submit-btn main-btn">Add Member</button>
            </form>
        </div>
    );
};

export default AddMember;
