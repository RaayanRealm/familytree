import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFamilyMembers } from "../services/api";

const FamilyTree = () => {
  const [family, setFamily] = useState([]);

  useEffect(() => {
    getFamilyMembers().then(setFamily);
  }, []);

  return (
    <div>
      <h2>Family Tree</h2>
      <ul>
        {family.map((member) => (
          <li key={member.id}>
            <Link to={`/member/${member.id}`}>
              {member.first_name} {member.last_name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FamilyTree;