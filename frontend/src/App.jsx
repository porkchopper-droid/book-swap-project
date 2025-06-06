import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MyAccount from "./pages/MyAccount";
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

import ProtectedRoutes from "./routes/ProtectedRoutes";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/contact-us" element={<ContactUsPage />} />


        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/my-account" element={<MyAccount />} />
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
