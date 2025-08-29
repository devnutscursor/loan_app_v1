import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ user, sidebarOpen, setSidebarOpen }) => {
  const router = useRouter();
  const { logout } = useAuth(); // Use AuthContext logout
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    logout(); // Use AuthContext logout function
  };

  const navLinks = [
    // { name: 'Home', path: '/' },
    // { name: 'About', path: '/about' },
    // { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav 
      className={`sticky top-0 z-40 bg-white/80 backdrop-blur-sm transition-all duration-300 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            {user && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            {/* Logo */}
            <Link href="/" className="flex items-center ml-2 md:ml-0">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                LoanApp
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`relative px-1 py-2 text-sm font-medium transition-colors duration-200 ${
                    router.pathname === link.path
                      ? 'text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {link.name}
                  {router.pathname === link.path && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            {!user ? (
              <div className="flex space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="relative ml-4" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                  aria-label="User menu"
                >
                  <div className="relative">
                    {user.profilePicture ? (
                      <Image
                        className="h-8 w-8 rounded-full"
                        src={user.profilePicture}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white font-medium text-sm">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-gray-700">
                    {user.firstName}
                  </span>
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                      dropdownOpen ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm text-gray-700">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email}
                        </p>
                      </div>
                      
                      <div className="py-1">
                        {user.role === 'borrower' && (
                          <Link 
                            href="/borrower/dashboard" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Dashboard
                          </Link>
                        )}
                        
                        {user.role === 'lender' && (
                          <Link 
                            href="/lender/dashboard" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Dashboard
                          </Link>
                        )}
                        
                        {user.role === 'admin' && (
                          <Link 
                            href="/admin/dashboard" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        
                        {user.role === 'borrower' && (
                          <Link 
                            href="/borrower/profile" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Your Profile
                          </Link>
                        )}
                        
                        {user.role === 'lender' && (
                          <Link 
                            href="/lender/profile" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Your Profile
                          </Link>
                        )}
                        
                        {user.role === 'admin' && (
                          <Link 
                            href="/admin/dashboard" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setDropdownOpen(false)}
                          >
                            Your Profile
                          </Link>
                        )}
                        
                        {/* <Link 
                          href="/settings" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Settings
                        </Link> */}
                      </div>
                      
                      <div className="py-1 border-t border-gray-100">
                        <button
                          onClick={() => {
                            handleLogout();
                            setDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
