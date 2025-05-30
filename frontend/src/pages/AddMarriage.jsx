import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFamilyMembers } from "../services/api";
import "../styles/AddMember.css";
import AsyncSelect from "react-select/async";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AddMarriage = () => {
    const [allMembers, setAllMembers] = useState([]);
    const [spouse1, setSpouse1] = useState(null);
    const [spouse2, setSpouse2] = useState(null);
    const [marriageDate, setMarriageDate] = useState(null);
    const [divorceDate, setDivorceDate] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        getFamilyMembers().then(setAllMembers);
    }, []);

    const loadMemberOptions = (inputValue, callback) => {
        if (!inputValue) {
            callback([]);
            return;
        }
        const filtered = allMembers
            .filter(m =>
                `${m.first_name} ${m.last_name}`.toLowerCase().includes(inputValue.toLowerCase())
            )
            .map(m => ({
                value: m.id,
                label: `${m.first_name} ${m.last_name}`
            }));
        callback(filtered);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!spouse1 || !spouse2 || spouse1 === spouse2) {
            setError("Please select two different spouses.");
            return;
        }
        if (!marriageDate) {
            setError("Marriage date is required.");
            return;
        }
        // Call backend API to add marriage (implement this endpoint in backend)
        try {
            await fetch("http://localhost:5000/api/family/marriages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    person_id: spouse1,
                    spouse_id: spouse2,
                    marriage_date: marriageDate ? marriageDate.toISOString().split("T")[0] : null,
                    divorce_date: divorceDate ? divorceDate.toISOString().split("T")[0] : null
                })
            });
            navigate("/members");
        } catch (err) {
            setError("Failed to add marriage. Please check your input.");
        }
    };

    return (
        <div className="add-member-container">
            <h2>Add Marriage</h2>
            <form className="add-member-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <label>Spouse 1*</label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadMemberOptions}
                        defaultOptions={false}
                        value={
                            spouse1
                                ? {
                                    value: spouse1,
                                    label:
                                        allMembers.find(m => m.id === spouse1)
                                            ? `${allMembers.find(m => m.id === spouse1).first_name} ${allMembers.find(m => m.id === spouse1).last_name}`
                                            : ""
                                }
                                : null
                        }
                        onChange={option => setSpouse1(option ? option.value : "")}
                        placeholder="Search & select member"
                        classNamePrefix="relation-async-select"
                        isClearable
                    />
                </div>
                <div className="form-row">
                    <label>Spouse 2*</label>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={loadMemberOptions}
                        defaultOptions={false}
                        value={
                            spouse2
                                ? {
                                    value: spouse2,
                                    label:
                                        allMembers.find(m => m.id === spouse2)
                                            ? `${allMembers.find(m => m.id === spouse2).first_name} ${allMembers.find(m => m.id === spouse2).last_name}`
                                            : ""
                                }
                                : null
                        }
                        onChange={option => setSpouse2(option ? option.value : "")}
                        placeholder="Search & select member"
                        classNamePrefix="relation-async-select"
                        isClearable
                    />
                </div>
                <div className="form-row">
                    <label>Marriage Date*</label>
                    <DatePicker
                        selected={marriageDate}
                        onChange={setMarriageDate}
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
                    <label>Divorce Date</label>
                    <DatePicker
                        selected={divorceDate}
                        onChange={setDivorceDate}
                        dateFormat="dd MMMM yyyy"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        placeholderText="Select date"
                        className="date-picker-input"
                    />
                </div>
                {error && <div className="form-error">{error}</div>}
                <button type="submit" className="submit-btn">Add Marriage</button>
            </form>
        </div>
    );
};

export default AddMarriage;
