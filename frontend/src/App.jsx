import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import BooksPage from "./pages/BooksPage";
import ChatsPage from "./pages/ChatsPage";
import SwapsPage from "./pages/SwapsPage";
import SwapPage from "./pages/SwapProposal";
import Landing from "./pages/Landing";
import Logout from "./pages/Logout";
import SetLocation from "./pages/SetLocation";
import MapComponent from "./components/MapComponent";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ContactUsPage from "./pages/ContactUsPage";
import FlaggedUser from "./components/FlaggedUser";
import AboutUsPage from "./pages/AboutUs";
import CareersPage from "./pages/Careers";

import ProtectedRoutes from "./routes/ProtectedRoutes";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    console.log("🌍 API:", import.meta.env.VITE_API_URL);
    console.log("🔌 Socket:", import.meta.env.VITE_SOCKET_URL);
    console.log("🔧 MODE:", import.meta.env.MODE);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/careers" element={<CareersPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/account" element={<Account />} />
          <Route path="/account/profile" element={<Profile />} />
          <Route path="/account/restricted" element={<FlaggedUser />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/chats/:swapId" element={<ChatsPage />} />
          <Route path="/swaps" element={<SwapsPage />} />
          <Route path="/swap/:userId" element={<SwapPage />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/set-location" element={<SetLocation />} />
          <Route path="/map" element={<MapComponent />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
