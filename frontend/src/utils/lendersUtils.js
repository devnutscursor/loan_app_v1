import { ChevronDown } from 'lucide-react';

/**
 * Get sort icon for table headers
 * @param {string} field - The field being sorted
 * @param {string} sortBy - Current sort field
 * @param {string} sortOrder - Current sort order
 * @returns {JSX.Element} Sort icon component
 */
export const getSortIcon = (field, sortBy, sortOrder) => {
  if (sortBy !== field) return <ChevronDown className="h-4 w-4 text-gray-400" />;
  return sortOrder === 'asc' ? 
    <ChevronDown className="h-4 w-4 text-primary" /> : 
    <ChevronDown className="h-4 w-4 text-primary rotate-180" />;
};

/**
 * Format date string to readable format
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date or 'N/A'
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Handle sort functionality
 * @param {string} field - Field to sort by
 * @param {string} currentSortBy - Current sort field
 * @param {string} currentSortOrder - Current sort order
 * @param {Function} setSortBy - Function to set sort field
 * @param {Function} setSortOrder - Function to set sort order
 * @param {Function} setCurrentPage - Function to reset to page 1
 */
export const handleSort = (field, currentSortBy, currentSortOrder, setSortBy, setSortOrder, setCurrentPage) => {
  if (currentSortBy === field) {
    setSortOrder(currentSortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    setSortBy(field);
    setSortOrder('asc');
  }
  setCurrentPage(1);
};

/**
 * Handle search input change
 * @param {Event} e - Input change event
 * @param {Function} setSearchTerm - Function to set search term
 * @param {Function} setCurrentPage - Function to reset to page 1
 * @param {Function} setFilteredLenders - Function to set filtered lenders
 * @param {Array} lenders - Array of lenders
 * @returns {void}
 */
export const handleSearch = (e, setSearchTerm, setCurrentPage, setFilteredLenders, lenders) => {
  const searchTerm = e.target.value;
  setSearchTerm(searchTerm);
  setCurrentPage(1);

  if (searchTerm.trim() === '') {
    setFilteredLenders(lenders);
    return;
  }

  const filteredLenders = lenders.filter(lender => {

    const user = lender?.user;

    if (!user) return false;

    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();

    return (
    fullName.includes(searchLower) 
    || ((user.email || '').toLowerCase().includes(searchLower))
    || ((user.phone || '').toLowerCase().includes(searchLower))
    );
  });
  setFilteredLenders(filteredLenders);
};

/**
 * Handle page change with smooth scroll
 * @param {number} page - Page number to navigate to
 * @param {Function} setCurrentPage - Function to set current page
 */
export const handlePageChange = (page, setCurrentPage) => {
  setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
