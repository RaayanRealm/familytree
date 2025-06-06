import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import FamilyTree from "./pages/FamilyTree";
import LandingPage from "./pages/LandingPage";
import MemberProfile from "./pages/MembersProfile";
import Header from "./components/Header";
import AddMember from "./pages/AddMember";
import Events from "./pages/Events";
import HelpFAQ from "./pages/HelpFAQ";
import HelpAbout from "./pages/HelpAbout";
import HelpContact from "./pages/HelpContact";
import FamilyTree from "./pages/FamilyTree";
import AddMarriage from "./pages/AddMarriage";
import EditMember from "./pages/EditMember";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import CreateAccount from "./pages/CreateAccount";
import UserSettings from "./pages/UserSettings";

function App() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    // Listen for login/logout events from LoginPage
    window.addEventListener("userChanged", () => {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    });
    return () => window.removeEventListener("userChanged", () => { });
  }, []);

  return (
    <Router>
      <Header user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/user/settings" element={<UserSettings />} />
        <Route path="/member/:id" element={<MemberProfile />} />
        <Route path="/add-member" element={user && (user.role === "admin" || user.role === "editor") ? <AddMember /> : <LoginPage setUser={setUser} />} />
        <Route path="/add-marriage" element={user && (user.role === "admin" || user.role === "editor") ? <AddMarriage /> : <LoginPage setUser={setUser} />} />
        <Route path="/events" element={<Events />} />
        <Route path="/family/tree" element={<FamilyTree />} />
        {/*<Route path="/family/maternal" element={<MaternalTree />} />
        //<Route path="/search" element={<SearchPage />} /> */}
        <Route path="/help/faq" element={<HelpFAQ />} />
        <Route path="/help/about" element={<HelpAbout />} />
        <Route path="/help/contact" element={<HelpContact />} />
        <Route path="/edit-member/:id" element={user && (user.role === "admin" || user.role === "editor") ? <EditMember /> : <LoginPage setUser={setUser} />} />
      </Routes>
    </Router>
  );
}

export default App;