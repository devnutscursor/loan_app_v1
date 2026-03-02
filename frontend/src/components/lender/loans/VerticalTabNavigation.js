import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const VerticalTabNavigation = ({
  mainTabs,
  applicationSubTabs,
  activeTab,
  isApplicationExpanded,
  handleTabClick,
  setActiveTab,
  router,
  id,
}) => {
  return (
    <div className="w-full lg:w-60 lg:flex-shrink-0 lg:mr-6">
      <div className="rounded-xl bg-white p-3 shadow-lg border border-gray-100 sticky top-4">
        <nav
          className="flex flex-col space-y-2"
          aria-label="Tabs"
        >
          {mainTabs.map((tab, index) => {
            const isActive = tab.id === activeTab;
            const isExpanded =
              tab.id === "application" && isApplicationExpanded;
            // Show MCR separator before first MCR tab
            const isFirstMCR = tab.isMCR && (index === 0 || !mainTabs[index - 1]?.isMCR);
            return (
              <div key={tab.id} className="group">
                {isFirstMCR && (
                  <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">MCR</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                )}
                <button
                  onClick={() => handleTabClick(tab.id)}
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

                  {/* Show chevron only for Application tab */}
                  {tab.id === "application" && (
                    <span className="text-gray-500 transition-transform duration-200">
                      {isApplicationExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                  )}

                  {/* Active indicator with enhanced styling */}
                  {isActive && (
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-sm"></span>
                  )}
                </button>

                {/* Display sub-tabs when Application is expanded */}
                {tab.id === "application" && (
                  <div
                    className={`
                      pl-4 mt-2 space-y-1.5 overflow-hidden
                      transition-[max-height,opacity,transform] duration-300 ease-in-out
                      ${
                        isApplicationExpanded
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                      }
                    `}
                  >
                    {applicationSubTabs.map((subTab) => {
                      const isSubActive = activeTab === subTab.id;
                      return (
                        <button
                          key={subTab.id}
                          onClick={() => {
                            router.push(
                              `/lender/loans/${id}?tab=${subTab.id}`,
                              undefined,
                              { shallow: true }
                            );
                            setActiveTab(subTab.id);
                          }}
                          className={`
                            relative w-full flex items-center py-2.5 px-4 rounded-lg text-sm font-medium
                            transform transition-all duration-300 ease-in-out
                            ${
                              isSubActive
                                ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:shadow-xs hover:scale-[1.015]"
                            }
                          `}
                        >
                          <span
                            className={`
                              mr-3 transition-all duration-300 ease-in-out
                              ${
                                isSubActive
                                  ? "text-blue-700 opacity-100 scale-110"
                                  : "opacity-70"
                              }
                            `}
                          >
                            <subTab.icon className="h-4 w-4" />
                          </span>
                          <span
                            className={`text-xs transition-colors duration-300 ${
                              isSubActive
                                ? "font-medium text-gray-900 "
                                : ""
                            }`}
                          >
                            {subTab.label}
                          </span>
                          {isSubActive && (
                            <span className="absolute right-2 w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-sm"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default VerticalTabNavigation;

