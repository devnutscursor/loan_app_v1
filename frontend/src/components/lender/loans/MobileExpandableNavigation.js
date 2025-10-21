import React from "react";

const MobileExpandableNavigation = ({
  isOpen,
  onToggle,
  onClose,
  mainTabs,
  applicationSubTabs,
  activeTab,
  handleTabClick,
}) => {
  // Find the active tab to get its icon
  const allTabs = [...mainTabs.filter(tab => tab.id !== "application"), ...applicationSubTabs];
  const currentTab = allTabs.find(tab => tab.id === activeTab);
  const ActiveIcon = currentTab?.icon;

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
      {/* The button that transforms into navigation */}
      <div
        className={`relative rounded-full shadow-lg transition-all duration-600 ease-out overflow-hidden ${
          isOpen 
            ? "bg-white rounded-xl min-h-[400px] w-[280px] border-t-[3px] border-blue-700" 
            : "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-lg h-12 w-[280px]"
        }`}
      >
        
        {/* Button Content - Only visible when collapsed */}
        {!isOpen && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-start gap-4 px-8 py-3 text-white transition-all duration-300"
            aria-label="Open Navigation"
          >
            {ActiveIcon && <ActiveIcon className="h-5 w-5" />}
            <span className="text-base font-semibold ">
              {activeTab === "dashboard" && "Loan Dashboard"}
              {activeTab === "documents" && "Documents"}
              {activeTab === "milestones" && "Milestones"}
              {activeTab === "borrower" && "Borrower Information"}
              {activeTab === "loan" && "Loan Details"}
              {activeTab === "property" && "Property Information"}
              {activeTab === "financial" && "Financial Information"}
              {activeTab === "additional" && "Additional Information"}
            </span>
            <span className="absolute right-6 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-sm"></span>
          </button>
        )}

        {/* Navigation Items - Expand from button */}
        <div
          className={`transition-all duration-500 ease-out overflow-hidden ${
            isOpen 
              ? "max-h-[650px] opacity-100" 
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-3 py-4 space-y-2">
            {/* Main tabs (excluding application) */}
            {mainTabs
              .filter(tab => tab.id !== "application")
              .map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      handleTabClick(tab.id);
                      onClose();
                    }}
                    className={`relative w-full flex items-center justify-start py-2 px-4 text-base font-medium transition-all duration-300 ease-in-out rounded-lg ${
                      isActive 
                        ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-xs hover:scale-[1.015]"
                    }`}
                  >
                    <div className="flex items-center justify-center">
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
                    
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute right-2 w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-sm"></span>
                    )}
                    {tab.id !== "dashboard" && tab.id !== "documents" && tab.id !== "milestones" && (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            
            {/* Application sub-tabs (flattened) */}
            {applicationSubTabs.map((subTab) => {
              const isActive = subTab.id === activeTab;
              return (
                <button
                  key={subTab.id}
                  onClick={() => {
                    handleTabClick(subTab.id);
                    onClose();
                  }}
                  className={`relative w-full flex items-center justify-start py-2 px-4 text-base font-medium transition-all duration-300 ease-in-out rounded-lg ${
                    isActive 
                      ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-xs hover:scale-[1.015]"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <span
                      className={`mr-3 transition-all duration-300 ease-in-out ${
                        isActive
                          ? "text-blue-700 opacity-100 scale-110"
                          : "opacity-70"
                      }`}
                    >
                      <subTab.icon className="h-5 w-5" />
                    </span>
                    <span
                      className={`transition-colors duration-300 ${
                        isActive
                          ? "font-semibold text-gray-900"
                          : ""
                      }`}
                    >
                      {subTab.label}
                    </span>
                  </div>
                  
                  {/* Active indicator for sub-tabs */}
                  {isActive && (
                    <span className="absolute right-2 w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-sm"></span>
                  )}
                </button>
              );
            })}
            
            {/* Close Button at Bottom */}
            <div className="flex justify-center pt-2">
              <button
                onClick={onClose}
                className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-200 "
                aria-label="Close Navigation"
              >
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileExpandableNavigation;
