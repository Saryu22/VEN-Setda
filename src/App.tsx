import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import ItemDetails from './pages/ItemDetails';
import Scanner from './pages/Scanner';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route path="/scan" element={<Scanner />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
