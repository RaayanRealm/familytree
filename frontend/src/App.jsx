import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import FamilyTree from "./pages/FamilyTree";
import LandingPage from "./pages/LandingPage";
import MemberProfile from "./pages/MembersProfile";
import Header from "./components/Header";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/member/:id" element={<MemberProfile />} />
        {/* <Route path="/family/paternal" element={<PaternalTree />} />
        <Route path="/family/maternal" element={<MaternalTree />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/help/faq" element={<FAQ />} />
        <Route path="/help/contact" element={<Contact />} />
        <Route path="/help/about" element={<AboutFamilyTree />} /> */}
      </Routes>
    </Router>
  );
}

export default App;