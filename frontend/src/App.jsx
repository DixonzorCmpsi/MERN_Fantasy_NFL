import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { Button, ButtonBase } from '@mui/material';
import HomePage from "./pages/HomePage";
import TeamPage from './pages/TeamPage';

//import CreatePage from "./pages/CreatePage";
function App() {
  
  return (
    <Routes>
      {/* Auto-redirect to /signup when root path is hit */}
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/team" element={<TeamPage />} />

    </Routes>
  );
}
export default App
