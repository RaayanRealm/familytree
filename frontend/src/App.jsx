import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FamilyTree from "./pages/FamilyTree";
import MemberProfile from "./pages/MembersProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FamilyTree />} />  {/* ✅ Default page */}
        <Route path="/member/:id" element={<MemberProfile />} />
      </Routes>
    </Router>
  );
}

export default App;