import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed, user }) => {
  const router = useRouter();

  // Navigation items based on user role
  const getNavItems = () => {
    if (!user) return [];

    if (user.role === 'borrower') {
      return [
        { name: 'Dashboard', href: '/borrower/dashboard', icon: 'home' },
        { name: 'My Loans', href: '/borrower/loans', icon: 'document-text' },
        { name: 'Apply for Loan', href: '/borrower/apply', icon: 'plus-circle' },
        { name: 'Milestones', href: '/borrower/milestones', icon: 'flag' },
        { name: 'Messages', href: '/borrower/messages', icon: 'chat' },
        { name: 'Calculators', href: '/borrower/calculators', icon: 'calculator' },
        { name: 'Documents', href: '/borrower/documents', icon: 'document-duplicate' },
        { name: 'Profile', href: '/borrower/profile', icon: 'user' },
        // { name: 'Settings', href: '/borrower/settings', icon: 'cog' }
      ];
    }

    if (user.role === 'lender') {
      return [
        { name: 'Dashboard', href: '/lender/dashboard', icon: 'home' },
        // { name: 'Loan Applications', href: '/lender/applications', icon: 'clipboard-list' },
        { name: 'Active Loans', href: '/lender/loans', icon: 'cash' },
        { name: 'Loan Programs', href: '/lender/programs', icon: 'template' },
        // { name: 'Conditions', href: '/lender/conditions', icon: 'check-circle' },
        { name: 'Borrowers', href: '/lender/borrowers', icon: 'users' },
        { name: 'Messages', href: '/lender/messages', icon: 'chat' },
        { name: 'Referral Links', href: '/lender/referrals', icon: 'link' },
        { name: 'Profile', href: '/lender/profile', icon: 'user' },
        
        // { name: 'Documents', href: '/lender/documents', icon: 'document-duplicate' },
        // { name: 'Company', href: '/lender/company', icon: 'office-building' },
        // { name: 'Settings', href: '/lender/settings', icon: 'cog' }
      ];
    }

    if (user.role === 'company') {
      return [
        { name: 'Dashboard', href: '/company/dashboard', icon: 'home' },
        { name: 'Lenders', href: '/company/lenders', icon: 'users' }
      ];
    }

    if (user.role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: 'home' },
        { name: 'Create User', href: '/register', icon: 'user-plus' },
        { name: 'Users', href: '/admin/users', icon: 'users' },
        { name: 'Loans', href: '/admin/loans', icon: 'cash' }
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  // Icon mapping
  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'home':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'document-text':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'plus-circle':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'document-duplicate':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        );
      case 'user':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'cog':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'clipboard-list':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6" />
          </svg>
        );
      case 'cash':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'users':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'office-building':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'calculator':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'check-circle':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'template':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        );
      case 'link':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'flag':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'chat':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'user-plus':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <div
        className={`${isOpen ? 'block' : 'hidden'} fixed inset-0 z-20 transition-opacity bg-gray-600 opacity-75 md:hidden`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 overflow-y-auto overflow-x-hidden transition-all duration-300 transform 
          bg-gradient-to-b from-blue-800 to-blue-600 text-white shadow-lg
          md:translate-x-0 md:static md:inset-0
          pb-10
          ${isOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'}
          ${isCollapsed ? 'w-16 md:w-16 group hover:w-64' : 'w-64'}
          no-scrollbar
        `}
        style={{ 
          minWidth: isCollapsed ? '4rem' : '16rem',
          scrollbarWidth: 'none',  
          msOverflowStyle: 'none'  
        }}
      >
        <style jsx>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex justify-between items-center px-4 py-4 border-b border-blue-600">
          {!isCollapsed && (
            <div className="text-lg font-semibold text-white">
              
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-blue-200 hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-blue-700 focus:ring-white"
            aria-label="Toggle sidebar width"
          >
            {isCollapsed ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* User profile */}
        {user && (
          <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-col'} items-center mt-6 px-4`}>
            <div className="relative">
              {user.profilePicture ? (
                <Image
                  className="h-10 w-10 rounded-full object-cover"
                  src={user.profilePicture}
                  alt="User Profile"
                  width={40}
                  height={40}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                  {user.firstName && user.firstName[0]}
                  {user.lastName && user.lastName[0]}
                </div>
              )}
            </div>
            <h4 className={`mt-2 font-semibold text-white whitespace-nowrap overflow-hidden ${isCollapsed ? 'hidden group-hover:block' : 'block'}`}>
              {user.firstName} {user.lastName}
            </h4>
            <p className={`text-sm tracking-wider text-white-500 capitalize whitespace-nowrap overflow-hidden ${isCollapsed ? 'hidden group-hover:block' : 'block'}`}>
              {user.role}
            </p>
          </div>
        )}


        {/* Navigation */}
        <nav className={`mt-10 ${isCollapsed ? 'px-2' : 'px-6'}`}>
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`
                flex items-center ${isCollapsed ? 'justify-center group-hover:justify-start' : ''} px-4 py-3 mt-2 text-sm transition-colors duration-200 transform rounded-lg 
                ${router.pathname === item.href || (router.pathname.startsWith(item.href + '/') && item.href !== '/')
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-blue-600 hover:text-white'
                }
                relative
              `}
            >
              <span className={`${isCollapsed ? 'text-center' : 'text-blue-200'}`}>
                {renderIcon(item.icon)}
              </span>
              <span className={`mx-4 font-medium whitespace-nowrap overflow-hidden ${isCollapsed ? 'hidden group-hover:inline' : 'inline'}`}>
                {item.name}
              </span>

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-6 px-2 py-1 bg-blue-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
                  {item.name}
                </div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
