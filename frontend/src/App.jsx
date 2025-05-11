import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/Layout";
import BooksPage from "./pages/BooksPage";
import SwapsPage from "./pages/SwapsPage";
import ChatPage from "./pages/ChatPage";
import Logout from "./pages/Logout";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Wrapped routes (only for logged-in users later) */}
        <Route element={<Layout />}>
          <Route path="/books" element={<BooksPage />} />
          <Route path="/my-books" element={<BooksPage />} />
          <Route path="/swaps" element={<SwapsPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/logout" element={<Logout />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
