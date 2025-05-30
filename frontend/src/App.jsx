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

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/member/:id" element={<MemberProfile />} />
        <Route path="/add-member" element={<AddMember />} />
        <Route path="/add-marriage" element={<AddMarriage />} />
        <Route path="/events" element={<Events />} />
        <Route path="/family/tree" element={<FamilyTree />} />
        {/*<Route path="/family/maternal" element={<MaternalTree />} />
        //<Route path="/search" element={<SearchPage />} /> */}
        <Route path="/help/faq" element={<HelpFAQ />} />
        <Route path="/help/about" element={<HelpAbout />} />
        <Route path="/help/contact" element={<HelpContact />} />
        <Route path="/edit-member/:id" element={<EditMember />} />
      </Routes>
    </Router>
  );
}

export default App;