import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa'; // ✅ User icon

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center text-2xl font-bold text-indigo-400 hover:text-indigo-300 transition">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill="currentColor" className="w-8 h-8 mr-2 text-emerald-400">
            <path fillRule="evenodd" d="M12 2.25c-.414 0-.75.336-.75.75v.379l-7.864 3.497A.75.75 0 003 7.25v1.065a.75.75 0 001.5 0V8.065l7.5-3.333 7.5 3.333v10.045H4.5v-3.06a.75.75 0 00-1.5 0v3.81c0 .414.336.75.75.75H9v1.5H6.75a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H15v-1.5h5.25a.75.75 0 00.75-.75v-11a.75.75 0 00-.444-.685l-8.25-3.667V3c0-.414-.336-.75-.75-.75zm.75 17.25v1.5h-1.5v-1.5h1.5z"
              clipRule="evenodd" />
            <path d="M8 10.5a1.5 1.5 0 113 0v1.5H8v-1.5zM5.5 14.25v-2.25A3 3 0 0111 12v2.25H5.5zm9-3.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
          </svg>
          Hostella
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-8 font-medium items-center">
          <li>
            <Link to="/" className="hover:text-indigo-300 transition">Home</Link>
          </li>

          <li className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="hover:text-indigo-300 transition focus:outline-none flex items-center"
            >
              Complaints
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <ul className="absolute top-10 left-0 w-52 bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <li>
                  <Link to="/raise-complaint" className="block px-4 py-2 hover:bg-slate-700">Raise Complaint</Link>
                </li>
                <li>
                  <Link to="/track-complaint" className="block px-4 py-2 hover:bg-slate-700">Track Complaint</Link>
                </li>
              </ul>
            )}
          </li>

        {!localStorage.getItem("shid") && (
          <li>
            <Link to="/register" className="hover:text-indigo-300 transition">
              Login
            </Link>
          </li>
        )}


          <li>
            <Link to="/about" className="hover:text-indigo-300 transition">About</Link>
          </li>

          {localStorage.getItem("shid") && (
              <div className="flex items-center space-x-2">
                <Link to="/dashboard" className="flex items-center gap-2 text-white hover:text-indigo-300 transition">
                  <FaUserCircle className="text-xl" />
                  <span className="text-base">Dashboard</span>
                </Link>
              </div>
            )}

        </ul>

        {/* Mobile Toggle */}
        <button
          className="md:hidden focus:outline-none text-indigo-300 text-2xl"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-800 px-4 py-3 space-y-3 text-sm font-medium transition-all duration-300">
          <Link to="/" className="block hover:text-indigo-300">Home</Link>

          <details className="group">
            <summary className="cursor-pointer hover:text-indigo-300">Complaints</summary>
            <ul className="ml-4 mt-2 space-y-2">
              <li>
                <Link to="/raise-complaint" className="block hover:text-indigo-300">Raise Complaint</Link>
              </li>
              <li>
                <Link to="/track-complaint" className="block hover:text-indigo-300">Track Complaint</Link>
              </li>
            </ul>
          </details>

          <Link to="/register" className="block hover:text-indigo-300">Login</Link>
          <Link to="/about" className="block hover:text-indigo-300">About</Link>
          <Link to="/dashboard" className="block flex items-center gap-2 hover:text-indigo-300">
            <FaUserCircle className="text-lg" /> Profile
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
