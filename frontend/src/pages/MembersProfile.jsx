import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getFamilyMember, getMemberRelations } from "../services/api";
import "../styles/MembersProfile.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.toLocaleDateString(undefined, { weekday: "long" });
  const dayNum = date.getDate();
  const daySuffix =
    dayNum === 1 || dayNum === 21 || dayNum === 31
      ? "st"
      : dayNum === 2 || dayNum === 22
        ? "nd"
        : dayNum === 3 || dayNum === 23
          ? "rd"
          : "th";
  const month = date.toLocaleDateString(undefined, { month: "long" });
  const year = date.getFullYear();
  return `${day}, ${dayNum}${daySuffix} ${month}, ${year}`;
};

const getAge = (dob, deathDate) => {
  if (!dob) return "";
  const birth = new Date(dob);
  const end = deathDate ? new Date(deathDate) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const yearsPassed = (deathDate) => {
  if (!deathDate) return "";
  const death = new Date(deathDate);
  const now = new Date();
  let years = now.getFullYear() - death.getFullYear();
  const m = now.getMonth() - death.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < death.getDate())) {
    years--;
  }
  return years;
};

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
          <p><span className="profile-label">Nickname:</span> <span className="profile-value">{member.nickname}</span></p>
          <p>
            <span className="profile-label">Gender:</span> <span className="profile-value">{member.gender}</span>
          </p>
          <p>
            <span className="profile-label">Birth Date:</span> <span className="profile-value">{formatDate(member.dob)}
              {member.dob && (
                <> ({getAge(member.dob, member.deaths && member.deaths[0]?.death_date)} years)</>
              )}</span>
          </p>
          <p><span className="profile-label">Place of Birth:</span> <span className="profile-value">{member.place_of_birth}</span></p>
          <p><span className="profile-label">Current Location:</span> <span className="profile-value">{member.current_location}</span></p>
        </div>
      </div>

      <div className="profile-contact">
        <h3>Contact & Details</h3>
        <div className="profile-contact-grid">
          <div>
            <span className="profile-label">Occupation: </span>
            <span className="profile-value occupation">{member.occupation}</span>
          </div>
          <div>
            <span className="profile-label">Nationality: </span>
            <span className="profile-value nationality">{member.nationality}</span>
          </div>
          <div>
            <span className="profile-label">Phone: </span>
            <span className="profile-value phone">{member.phone}</span>
          </div>
          <div>
            <span className="profile-label">Email: </span>
            <span className="profile-value email">{member.email}</span>
          </div>
        </div>
      </div>

      <div className="biography">
        <h3>Biography</h3>
        <p>{member.biography}</p>
      </div>

      <div className="relations">
        <h3>Relations</h3>
        <ul>
          {relations.map((relative, index) => {
            // Correct relationship display for Grandparent/Grandchild
            let relType = relative.type;
            if (relType === "Grandparent" || relType === "Grandchild") {
              // If the current member is the grandchild, show "Grandparent"
              // If the current member is the grandparent, show "Grandchild"
              if (String(relative.id) === String(id)) {
                // This should never happen, but just in case
                relType = relative.type;
              } else if (relType === "Grandparent") {
                relType = "Grandchild";
              } else if (relType === "Grandchild") {
                relType = "Grandparent";
              }
            }
            return (
              <li key={relative.id || index}>
                {relative.id ? (
                  <Link to={`/member/${relative.id}`}>{relative.name} ({relType})</Link>
                ) : (
                  <span>{relative.name} ({relType})</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {member.deaths && member.deaths.length > 0 && (
        <div className="death-info">
          <h3>Death Information</h3>
          {member.deaths.map((death, idx) => (
            <div key={idx}>
              <p>
                <strong>Date of Death:</strong> {formatDate(death.date)}
                {death.date && (
                  <> ({yearsPassed(death.date)} years ago)</>
                )}
              </p>
              <p><strong>Cause of Death:</strong> {death.cause}</p>
              <p><strong>Burial Place:</strong> {death.place}</p>
              <p><strong>Obituary:</strong> {death.obituary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberProfile;