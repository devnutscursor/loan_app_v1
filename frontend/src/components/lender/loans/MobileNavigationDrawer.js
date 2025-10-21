import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import VerticalTabNavigation from "./VerticalTabNavigation";

const MobileNavigationDrawer = ({
  isOpen,
  onClose,
  mainTabs,
  applicationSubTabs,
  activeTab,
  isApplicationExpanded,
  handleTabClick,
  setActiveTab,
  router,
  id,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Enhanced handleTabClick that also closes the drawer
  const handleTabClickAndClose = (tabId) => {
    handleTabClick(tabId);
    // Close drawer after a short delay to allow for visual feedback
    setTimeout(() => {
      onClose();
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      // First show the component
      setIsAnimating(true);
      // Then trigger the modal animation after a brief moment
      setTimeout(() => {
        setShowModal(true);
      }, 10);
    } else {
      // First hide the modal
      setShowModal(false);
      // Then hide the component after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isAnimating) return null;

  return (
    <>
      {/* Backdrop with smooth fade */}
      <div
        className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ${
          showModal ? "bg-opacity-50" : "bg-opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Floating Modal Card with smooth scale and fade animation */}
      <div
        className={`fixed bottom-24 right-6 w-80 max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl z-50 lg:hidden overflow-hidden flex flex-col transform transition-all duration-300 ease-out ${
          showModal
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white hover:bg-gray-100 shadow-md transition-all duration-200 hover:rotate-90 transform"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Navigation Content with fade-in animation */}
        <div
          className={`flex-1 p-4 pt-14 overflow-y-auto transition-all duration-300 delay-100 ${
            showModal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div className="space-y-2">
            {/* Main tabs (excluding application) */}
            {mainTabs
              .filter(tab => tab.id !== "application")
              .map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClickAndClose(tab.id)}
                    className={`w-full flex items-center py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            
            {/* Application sub-tabs (flattened) */}
            {applicationSubTabs.map((subTab) => {
              const isActive = subTab.id === activeTab;
              return (
                <button
                  key={subTab.id}
                  onClick={() => handleTabClickAndClose(subTab.id)}
                  className={`w-full flex items-center py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-100 text-blue-900 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <subTab.icon className="h-5 w-5 mr-3" />
                  {subTab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigationDrawer;

