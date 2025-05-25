import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Search.css";

const Search = ({ members }) => {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    const handleSearch = (event) => {
        setQuery(event.target.value);
    };

    const handleSelect = (memberId) => {
        setQuery(""); // Clear the search input
        navigate(`/member/${memberId}`); // ✅ Redirect to selected member profile
    };

    const filteredMembers = members.filter((member) =>
        member.first_name.toLowerCase().includes(query.toLowerCase()) ||
        member.last_name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="search-container">
            <input
                type="text"
                placeholder=" &#128269; Search family members..."
                value={query}
                onChange={handleSearch}
            />
            {query && (
                <ul className="search-results">
                    {filteredMembers.map((member) => (
                        <li key={member.id} onClick={() => handleSelect(member.id)}>
                            {member.first_name} {member.last_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Search;