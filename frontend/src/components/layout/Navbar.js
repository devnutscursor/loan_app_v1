import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

const Navbar = ({ user, sidebarOpen, setSidebarOpen }) => {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Mobile menu button */}
            {user && (
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
                >
                  <svg
                    className={`${sidebarOpen ? 'hidden' : 'block'} h-6 w-6`}
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <svg
                    className={`${sidebarOpen ? 'block' : 'hidden'} h-6 w-6`}
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-primary">LoanApp</span>
              </Link>
            </div>
            
            {/* Main navigation for desktop */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link href="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 ${
                router.pathname === '/' 
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition duration-150 ease-in-out`}>
                Home
              </Link>
              
              <Link href="/about" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 ${
                router.pathname === '/about' 
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition duration-150 ease-in-out`}>
                About
              </Link>
              
              <Link href="/contact" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 ${
                router.pathname === '/contact' 
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition duration-150 ease-in-out`}>
                Contact
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {!user ? (
              <div className="flex-shrink-0">
                <Link href="/login" className="mr-2 inline-flex items-center px-4 py-2 border border-primary text-sm leading-5 font-medium rounded-md text-primary bg-white hover:text-primary-dark hover:bg-gray-50 focus:outline-none focus:shadow-outline-blue focus:border-primary-dark active:bg-gray-100 active:text-primary-dark transition ease-in-out duration-150">
                  Sign In
                </Link>
                
                <Link href="/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:shadow-outline-blue focus:border-primary-dark active:bg-primary-dark transition ease-in-out duration-150">
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out"
                  >
                    <div className="flex items-center">
                      {user.profilePicture ? (
                        <Image
                          className="h-8 w-8 rounded-full"
                          src={user.profilePicture}
                          alt="User Profile"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                          {user.firstName && user.firstName[0]}
                          {user.lastName && user.lastName[0]}
                        </div>
                      )}
                      <span className="ml-2 text-gray-700">{user.firstName}</span>
                      <svg
                        className="ml-1 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
                
                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg">
                    <div className="py-1 rounded-md bg-white shadow-xs" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                      {user.role === 'borrower' && (
                        <Link href="/borrower/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                          Dashboard
                        </Link>
                      )}
                      
                      {user.role === 'lender' && (
                        <Link href="/lender/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                          Dashboard
                        </Link>
                      )}
                      
                      {user.role === 'admin' && (
                        <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                        Your Profile
                      </Link>
                      
                      <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                        Settings
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
                        role="menuitem"
                      >
                        Sign out
                      </button>
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
