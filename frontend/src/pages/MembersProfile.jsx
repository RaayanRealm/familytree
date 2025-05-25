import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getFamilyMember, getMemberRelations } from "../services/api";
import "../styles/MembersProfile.css";

const MemberProfile = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [relations, setRelations] = useState([]);

  useEffect(() => {
    getFamilyMember(id).then(setMember);
    getMemberRelations(id).then(setRelations);
  }, [id]);

  if (!member) return <p>Loading...</p>;

  return (
    <div className="member-profile">
      <div className="profile-header">
        <img src={`http://localhost:5000${member.profile_picture}`} alt={member.first_name} />
        <div className="profile-info">
          <h2>{member.first_name} {member.last_name}</h2>
          <p><strong>Birth Date:</strong> {member.dob}</p>
          <p><strong>Occupation:</strong> {member.occupation}</p>
          <p><strong>Location:</strong> {member.current_location}</p>
        </div>
      </div>

      <div className="biography">
        <h3>Biography</h3>
        <p>{member.biography}</p>
      </div>

      <div className="relations">
        <h3>Relations</h3>
        <ul>
          {relations.map((relative, index) => (
            <li key={relative.id || index}>
              {relative.id ? (
                <Link to={`/member/${relative.id}`}>{relative.name} ({relative.type})</Link>
              ) : (
                <span>{relative.name} ({relative.type})</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MemberProfile;