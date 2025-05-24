import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MyAccount from "./pages/MyAccount";
import BooksPage from "./pages/Bookspage";
import SwapsPage from "./pages/SwapsPage";
import ChatsPage from "./pages/ChatsPage";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Logout from "./pages/Logout";
import SetLocation from "./pages/SetLocation";
import MapPage from "./pages/MapPage";

import ProtectedRoutes from "./routes/ProtectedRoutes";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/swaps" element={<SwapsPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/chats/:swapId" element={<ChatsPage />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/set-location" element={<SetLocation />} />
          <Route path="/map" element={<MapPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
