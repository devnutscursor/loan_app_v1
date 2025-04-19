import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import lenderService from '../../services/api/lender.service';

/**
 * Condition Library Modal Component
 * Allows users to search and select conditions from a library
 */
const ConditionLibraryModal = ({ onClose, onAddConditions }) => {
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    fetchLibraryItems();
  }, []);
  
  const fetchLibraryItems = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await lenderService.getConditionLibrary(filters);
      const items = response.data.data || [];
      
      setLibraryItems(items);
      
      // Extract unique tags from all items for tag filter
      const tags = new Set();
      items.forEach(item => {
        if (item.tags && item.tags.length > 0) {
          item.tags.forEach(tag => tags.add(tag));
        }
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error fetching condition library:', error);
      toast.error('Failed to load condition library');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (selectedTag) filters.tag = selectedTag;
    if (selectedCategory) filters.category = selectedCategory;
    
    await fetchLibraryItems(filters);
    setIsSearching(false);
  };
  
  const handleCheckboxChange = (itemId) => {
    setSelectedConditions(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };
  
  const selectAllConditions = () => {
    setSelectedConditions(libraryItems.map(item => item._id));
  };
  
  const clearAllConditions = () => {
    setSelectedConditions([]);
  };
  
  const handleAddSelected = () => {
    if (selectedConditions.length === 0) {
      toast.error('Please select at least one condition');
      return;
    }
    
    onAddConditions(selectedConditions);
  };
  
  return (
    <div className="fixed inset-0 overflow-y-auto z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Add Conditions from Library
              </h3>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="search-term" className="block text-sm font-medium text-gray-700">
                      Search Term
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="search-term"
                        id="search-term"
                        className="focus:ring-primary focus:border-primary flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                        placeholder="Search conditions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700">
                      Tag
                    </label>
                    <select
                      id="tag-filter"
                      name="tag-filter"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                    >
                      <option value="">All Tags</option>
                      {allTags.map((tag, index) => (
                        <option key={index} value={tag}>#{tag}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="category-filter"
                      name="category-filter"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      <option value="income">Income</option>
                      <option value="assets">Assets</option>
                      <option value="credit">Credit</option>
                      <option value="property">Property</option>
                      <option value="legal">Legal</option>
                      <option value="insurance">Insurance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {isSearching ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                          Search
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
              
              <div className="mt-2 flex justify-between text-sm">
                <div>
                  <button
                    type="button"
                    onClick={selectAllConditions}
                    className="text-primary hover:text-primary-dark"
                  >
                    Select All Conditions
                  </button>
                </div>
                {selectedConditions.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={clearAllConditions}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Clear Selection ({selectedConditions.length})
                    </button>
                  </div>
                )}
              </div>
              
              {/* Results */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900">Results</h4>
                <div className="mt-1 border-t border-gray-200">
                  {loading ? (
                    <div className="py-6 flex justify-center">
                      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : libraryItems.length === 0 ? (
                    <p className="py-6 text-center text-gray-500">No conditions found in the library. Try a different search or adjust filters.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {libraryItems.map((item) => (
                        <li key={item._id} className="py-4 flex items-start">
                          <div className="mr-3 pt-1">
                            <input
                              id={`condition-${item._id}`}
                              name={`condition-${item._id}`}
                              type="checkbox"
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              checked={selectedConditions.includes(item._id)}
                              onChange={() => handleCheckboxChange(item._id)}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <label htmlFor={`condition-${item._id}`} className="block text-sm font-medium text-gray-700 cursor-pointer">
                              {item.title}
                            </label>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                                item.category === 'income' ? 'bg-indigo-100 text-indigo-800' :
                                item.category === 'assets' ? 'bg-blue-100 text-blue-800' :
                                item.category === 'credit' ? 'bg-purple-100 text-purple-800' :
                                item.category === 'property' ? 'bg-green-100 text-green-800' :
                                item.category === 'legal' ? 'bg-yellow-100 text-yellow-800' :
                                item.category === 'insurance' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.category}
                              </span>
                              {item.tags?.map((tag, index) => (
                                <span key={index} className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddSelected}
                  disabled={selectedConditions.length === 0}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm ${
                    selectedConditions.length === 0 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  Add Selected ({selectedConditions.length})
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionLibraryModal;
