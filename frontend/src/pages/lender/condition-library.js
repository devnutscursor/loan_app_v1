import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import lenderService from '../../services/api/lender.service';

/**
 * Condition Library Management Page
 * Allows lenders to create, edit, and manage condition templates
 */
const ConditionLibraryPage = () => {
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);
  
  useEffect(() => {
    fetchLibraryItems();
  }, []);
  
  const fetchLibraryItems = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await lenderService.getConditionLibrary(filters);
      const items = response.data.data || [];
      setLibraryItems(items);
      
      // Extract unique tags
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
    
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (selectedTag) filters.tag = selectedTag;
    if (selectedCategory) filters.category = selectedCategory;
    
    await fetchLibraryItems(filters);
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedTag('');
    fetchLibraryItems();
  };
  
  const handleCreateItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };
  
  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };
  
  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this condition template? This action cannot be undone.')) {
      return;
    }
    
    try {
      await lenderService.deleteConditionLibraryItem(itemId);
      setLibraryItems(libraryItems.filter(item => item._id !== itemId));
      toast.success('Condition template deleted successfully');
    } catch (error) {
      console.error('Error deleting condition template:', error);
      toast.error('Failed to delete condition template');
    }
  };
  
  const handleSubmitForm = async (formData) => {
    try {
      if (editingItem) {
        // Update existing template
        const response = await lenderService.updateConditionLibraryItem(editingItem._id, formData);
        const updatedItem = response.data.data;
        
        setLibraryItems(prevItems => 
          prevItems.map(item => 
            item._id === updatedItem._id ? updatedItem : item
          )
        );
        
        toast.success('Condition template updated successfully');
      } else {
        // Create new template
        const response = await lenderService.createConditionLibraryItem(formData);
        const newItem = response.data.data;
        
        setLibraryItems(prevItems => [...prevItems, newItem]);
        toast.success('Condition template created successfully');
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving condition template:', error);
      toast.error('Failed to save condition template');
    }
  };
  
  // Template form component
  const ConditionTemplateForm = ({ template, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      title: template?.title || '',
      description: template?.description || '',
      category: template?.category || 'other',
      tags: template?.tags?.join(', ') || '',
      priority: template?.priority || 'medium',
    });
    
    const [errors, setErrors] = useState({});
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
      
      // Clear error when field is edited
      if (errors[name]) {
        setErrors({ ...errors, [name]: null });
      }
    };
    
    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      // Process tags from comma-separated string to array
      const processedData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      
      onSubmit(processedData);
    };
    
    return (
      <div className="fixed inset-0 overflow-y-auto z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                onClick={onCancel}
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
                  {template ? 'Edit Condition Template' : 'Create New Condition Template'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {template 
                    ? 'Update the details of this condition template.'
                    : 'Create a new reusable condition template for your loans.'}
                </p>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.title ? 'border-red-500' : ''}`}
                      placeholder="Enter condition title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter detailed description of the condition"
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      >
                        <option value="income">Income</option>
                        <option value="assets">Assets</option>
                        <option value="credit">Credit</option>
                        <option value="property">Property</option>
                        <option value="legal">Legal</option>
                        <option value="insurance">Insurance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Default Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      id="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g. important, follow-up, tax-related"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {template ? 'Save Changes' : 'Create Template'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Condition category badge color mapping
  const getCategoryBadgeColor = (category) => {
    const categoryColors = {
      'income': 'bg-indigo-100 text-indigo-800',
      'assets': 'bg-blue-100 text-blue-800',
      'credit': 'bg-purple-100 text-purple-800',
      'property': 'bg-green-100 text-green-800',
      'legal': 'bg-yellow-100 text-yellow-800',
      'insurance': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    
    return categoryColors[category] || 'bg-gray-100 text-gray-800';
  };
  
  // Priority badge color mapping
  const getPriorityBadgeColor = (priority) => {
    const priorityColors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-yellow-100 text-yellow-800',
      'critical': 'bg-red-100 text-red-800'
    };
    
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <ProtectedRoute roles={['lender', 'admin']}>
      <MainLayout title="Condition Library">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Condition Library
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create and manage reusable condition templates for your loans
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  type="button"
                  onClick={handleCreateItem}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create New Template
                </button>
              </div>
            </div>
            
            {/* Search and filter */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md p-4">
              <form onSubmit={handleSearch} className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="search-term" className="block text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="search-term"
                      id="search-term"
                      className="focus:ring-primary focus:border-primary flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      placeholder="Search condition templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
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
                
                <div className="self-end flex space-x-2">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
            
            {/* Library items list */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
              {loading ? (
                <div className="p-6 flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : libraryItems.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No condition templates</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new condition template.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleCreateItem}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create New Template
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {libraryItems.map((item) => (
                    <li key={item._id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-primary truncate">
                              {item.title}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeColor(item.category)}`}>
                                {item.category}
                              </span>
                              <span className={`ml-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(item.priority)}`}>
                                {item.priority}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <button
                              type="button"
                              onClick={() => handleEditItem(item)}
                              className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item._id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            {item.description && (
                              <p className="text-sm text-gray-500">
                                {item.description.length > 150 
                                  ? `${item.description.substring(0, 150)}...` 
                                  : item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        {/* Form modal */}
        {isModalOpen && (
          <ConditionTemplateForm
            template={editingItem}
            onSubmit={handleSubmitForm}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingItem(null);
            }}
          />
        )}
      </MainLayout>
    </ProtectedRoute>
  );
};

export default ConditionLibraryPage;
