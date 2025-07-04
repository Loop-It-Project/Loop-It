import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <header className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link
        to="/"
        className="flex items-center space-x-4 hover:opacity-80 transition-opacity group"
        >
        <div className="relative">
            <img
            src="/logo.png"
            alt="Loop-It Logo"
            className="h-8 w-8 sm:h-10 sm:w-10 transition-transform group-hover:scale-110"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-white text-xl sm:text-2xl md:text-3xl font-bold transition-colors">
            <span className="sm:hidden">L-It</span>
            <span className="hidden sm:inline text-white text-3xl font-bold">
            Loop<span className="group-hover:text-yellow-300">-It</span>
            </span>
        </span>
        </Link>
        <nav className="flex space-x-4">
          {user ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="text-white hover:opacity-80 transition-opacity"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate("/hobbies")}
                className="text-white hover:opacity-80 transition-opacity"
              >
                <Settings className="" size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="text-white hover:opacity-80 transition-opacity"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-white hover:opacity-80 transition-opacity"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="text-white hover:opacity-80 transition-opacity"
              >
                Register
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
