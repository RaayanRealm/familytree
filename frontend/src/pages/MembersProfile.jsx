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
        <img
          src={
            member.profile_picture
              ? member.profile_picture.startsWith("http")
                ? member.profile_picture
                : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${member.profile_picture}`
              : ""
          }
          alt={member.first_name}
        />
        <div className="profile-info">
          <h2>{member.first_name} {member.last_name}</h2>
          <p><span className="profile-label">Nickname:</span> <span className="profile-value">{member.nickname}</span></p>
          <p>
            <span className="profile-label">Gender:</span> <span className="profile-value">{member.gender}</span>
          </p>
          <p>
            <span className="profile-label">Birth Date:</span> <span className="profile-value">{formatDate(member.dob)}
              {member.dob && (
                <> ({getAge(member.dob, member.death && member.death.date)} years)</>
              )}</span>
          </p>
          <p><span className="profile-label">Place of Birth:</span> <span className="profile-value">{member.place_of_birth}</span></p>
          <p><span className="profile-label">Current Location:</span> <span className="profile-value">{member.current_location}</span></p>
          {/* Marriage Anniversary */}
          {member.marriages && member.marriages.length > 0 && member.marriages[0].marriage_date && (
            <p>
              <span className="profile-label">Marriage :</span>{" "}
              <span className="profile-value">{formatDate(member.marriages[0].marriage_date)} {member.marriages[0].marriage_date && (
                <> ({yearsPassed(member.marriages[0].marriage_date)} years ago)</>
              )}</span>
            </p>
          )}
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
            let relType = relative.type;
            if (relType === "Grandparent" || relType === "Grandchild") {
              if (String(relative.id) === String(id)) {
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

      {member.death && (
        <div className="death-info">
          <h3>Death Information</h3>
          <div>
            <p>
              <strong>Date of Death:</strong> {formatDate(member.death.date)}
              {member.death.date && (
                <> ({yearsPassed(member.death.date)} years ago)</>
              )}
            </p>
            <p><strong>Cause of Death:</strong> {member.death.cause}</p>
            <p><strong>Burial Place:</strong> {member.death.place}</p>
            <p><strong>Obituary:</strong> {member.death.obituary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfile;