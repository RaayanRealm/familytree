import axios from "axios";

const API_URL = "http://localhost:5000/api/family"; // Adjust backend URL if needed

export const getFamilyMembers = async () => {
  const response = await axios.get(`${API_URL}/members`);
  return response.data;
};

export const getFamilyMember = async (id) => {
  const response = await axios.get(`${API_URL}/members/${id}`);
  return response.data;
};

export const getMemberRelations = async (id) => {
  const response = await axios.get(`${API_URL}/relationships/${id}`);
  return response.data.map(relation => ({
    id: relation.id,
    name: `${relation.first_name} ${relation.last_name}`,
    type: relation.relationship_type,
  }));
};

export const getRelationships = async () => {
  const response = await axios.get(`${API_URL}/relationships`);
  return response.data;
};

export const addFamilyMember = async (data) => {
  // If data.profile_picture is a base64 string, upload as multipart/form-data
  if (data.profile_picture && data.profile_picture.startsWith("data:")) {
    const formData = new FormData();
    // Convert base64 to Blob
    const arr = data.profile_picture.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const ext = mime.split("/")[1] || "png";
    const filename = `profile_${Date.now()}.${ext}`;
    const file = new File([u8arr], filename, { type: mime });

    formData.append("profile_picture_file", file);
    // Remove profile_picture from data, will be set by backend
    const { profile_picture, ...rest } = data;
    formData.append("personData", JSON.stringify(rest));
    const response = await axios.post(`${API_URL}/members`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  } else {
    // Send as JSON (no file upload)
    const response = await axios.post(`${API_URL}/members`, data);
    return response.data;
  }
};

export const updateFamilyMember = async (id, data) => {
  // If data.profile_picture is a base64 string, upload as multipart/form-data
  if (data.profile_picture && data.profile_picture.startsWith("data:")) {
    const formData = new FormData();
    const arr = data.profile_picture.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const ext = mime.split("/")[1] || "png";
    const filename = `profile_${Date.now()}.${ext}`;
    const file = new File([u8arr], filename, { type: mime });

    formData.append("profile_picture_file", file);
    const { profile_picture, ...rest } = data;
    formData.append("personData", JSON.stringify(rest));
    const response = await axios.put(`${API_URL}/members/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  } else {
    // Send as JSON (no file upload)
    const response = await axios.put(`${API_URL}/members/${id}`, data);
    return response.data;
  }
};

export const deleteFamilyMember = async (id) => {
  const response = await axios.delete(`${API_URL}/members/${id}`);
  return response.data;
};

export const getRecentMembers = async () => {
  const response = await axios.get(`${API_URL}/members/recent`);
  return response.data.slice(0, 5); // Return only the last 5 members
};

export const getFamilyEvents = async () => {
  const response = await axios.get(`${API_URL}/events`);
  return response.data;
};

export const getHelpFAQ = async () => {
  const response = await axios.get(`${API_URL}/help/faq`);
  return response.data;
};

export const getHelpAbout = async () => {
  const response = await axios.get(`${API_URL}/help/about`);
  return response.data.about;
};

export const getHelpContact = async () => {
  const response = await axios.get(`${API_URL}/help/contact`);
  return response.data.contact;
};

export const getFamilyTree = async (personId) => {
  const response = await axios.get(`${API_URL}/tree/${personId}`);
  return response.data;
};

export const addMarriage = async ({ person_id, spouse_id, marriage_date, divorce_date }) => {
  const response = await axios.post(`${API_URL}/marriages`, {
    person_id,
    spouse_id,
    marriage_date,
    divorce_date,
  });
  return response.data;
};