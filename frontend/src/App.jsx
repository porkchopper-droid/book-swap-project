import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import MyAccount from "./pages/MyAccount";
import BooksPage from "./pages/Bookspage";
import SwapsPage from "./pages/SwapsPage";
import ChatsPage from "./pages/ChatsPage";
import Logout from "./pages/Logout";
import SetLocation from "./pages/SetLocation";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />

        {/* Wrapped routes (only for logged-in users later) */}
        <Route element={<Layout />}>
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/swaps" element={<SwapsPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/set-location" element={<SetLocation />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
