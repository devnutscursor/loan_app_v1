import React from 'react';

const TabNavigation = ({ 
  mainTabs, 
  activeTab, 
  onTabClick, 
  loan 
}) => {
  return (
    <div className="w-60 flex-shrink-0 mr-6">
      <div className="rounded-xl bg-white p-3 shadow-lg border border-gray-100 sticky top-4">
        <nav className="flex flex-col space-y-2" aria-label="Tabs">
          {mainTabs.map((tab) => {
            const isActive = tab.id === activeTab;

            // Skip Military tab if no military service data
            if (tab.id === "military" && !loan.militaryService) {
              return null;
            }

            return (
              <div key={tab.id} className="group">
                <button
                  onClick={() => onTabClick(tab.id)}
                  className={`
                  relative w-full flex items-center justify-between py-3 px-4 rounded-lg text-sm font-medium
                  transform transition-all duration-300 ease-in-out
                  ${
                    isActive
                      ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-xs hover:scale-[1.015]"
                  }
                `}
                >
                  <div className="flex items-center">
                    <span
                      className={`mr-3 transition-all duration-300 ${
                        isActive
                          ? "text-blue-700 opacity-100 scale-110"
                          : "opacity-70 group-hover:opacity-90"
                      }`}
                    >
                      <tab.icon
                        className={`h-5 w-5 ${
                          isActive ? "drop-shadow-sm" : ""
                        }`}
                      />
                    </span>
                    <span
                      className={isActive ? "font-semibold" : ""}
                    >
                      {tab.label}
                    </span>
                  </div>

                  {/* Active indicator with enhanced styling */}
                  {isActive && (
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-sm"></span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;
