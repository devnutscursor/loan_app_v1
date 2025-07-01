import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { X, Search, UserPlus, Loader2, Check, Mail } from 'lucide-react';

const BorrowerSelectionModal = ({ isOpen, onClose, onBorrowerSelected, borrowerDataFromXml, initialBorrowers = [] }) => {
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(null);
  const [matchFound, setMatchFound] = useState(false);
  const [creatingNewBorrower, setCreatingNewBorrower] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset selection when modal opens
      setSelectedBorrowerId(null);
      
      // If initialBorrowers are provided and not empty, use them (pre-filtered matches)
      if (initialBorrowers && Array.isArray(initialBorrowers) && initialBorrowers.length > 0) {
        console.log('Using initial borrowers:', initialBorrowers.length);
        console.log('Sample borrower object structure:', JSON.stringify(initialBorrowers[0], null, 2));
        setBorrowers(initialBorrowers);
        setLoading(false);
        
        // Auto-select the first match if there's exactly one match
        if (initialBorrowers.length === 1) {
          setSelectedBorrowerId(initialBorrowers[0]._id);
          setMatchFound(true);
        }
      } else {
        // Otherwise fetch all borrowers
        console.log('Fetching all borrowers - no matches provided');
        fetchBorrowers();
      }
    }
  }, [isOpen, initialBorrowers]);

  // Fetch lender's borrowers
  const fetchBorrowers = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      console.log('Fetching borrowers from API endpoint...');
      const response = await axios.get(
        `${API_URL}/api/v1/lenders/borrowers`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        const borrowerList = response.data.data || [];
        console.log('Fetched borrowers:', borrowerList.length);
        if (borrowerList.length > 0) {
          console.log('Sample fetched borrower structure:', JSON.stringify(borrowerList[0], null, 2));
        } else {
          console.log('No borrowers found in API response');
        }
        
        setBorrowers(borrowerList);
        
        // Check if there's a matching borrower in the list
        if (borrowerDataFromXml && borrowerDataFromXml.email) {
          const match = borrowerList.find(
            b => (b.user?.email && borrowerDataFromXml.email && 
                 b.user.email.toLowerCase() === borrowerDataFromXml.email.toLowerCase()) ||
                 (b.email && borrowerDataFromXml.email && 
                 b.email.toLowerCase() === borrowerDataFromXml.email.toLowerCase())
          );
          
          if (match) {
            setSelectedBorrowerId(match._id);
            setMatchFound(true);
            toast.success('Found matching borrower by email!');
          }
        }
      } else {
        console.error('Failed response from API:', response.data);
        toast.error('Failed to load borrowers');
      }
    } catch (error) {
      console.error('Error fetching borrowers:', error);
      toast.error('Could not load borrowers');
    } finally {
      setLoading(false);
    }
  };

  // Filter borrowers based on search term
  const filteredBorrowers = borrowers.filter(borrower => {
    if (!borrower) return false;
    
    // Get values from user object or borrower object
    const firstName = borrower.user?.firstName || borrower.firstName || '';
    const lastName = borrower.user?.lastName || borrower.lastName || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
    const email = (borrower.user?.email || borrower.email || '').toLowerCase();
    const phone = borrower.user?.phone || borrower.phone || '';
    
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || 
           email.includes(searchLower) ||
           (phone && phone.includes(searchTerm));
  });

  // Handle creating a new borrower from XML data
  const handleCreateNewBorrower = async () => {
    if (!borrowerDataFromXml) {
      toast.error('No borrower data available from XML');
      return;
    }
    
    try {
      setCreatingNewBorrower(true);
      
      // Signal to parent component to create a new borrower
      onBorrowerSelected({
        action: 'create',
        data: borrowerDataFromXml
      });
      
      // Don't close modal here - parent component will handle showing referral link
    } catch (error) {
      console.error('Error creating new borrower:', error);
      toast.error('Failed to create new borrower');
      setCreatingNewBorrower(false);
    }
  };

  // Select existing borrower
  const handleSelectBorrower = () => {
    if (!selectedBorrowerId) {
      toast.error('Please select a borrower');
      return;
    }
    
    // Special handling for "new" borrower option
    if (selectedBorrowerId === 'new') {
      console.log('Selected "Create New Borrower" option');
      handleCreateNewBorrower();
      return;
    }
    
    const selectedBorrower = borrowers.find(b => b._id === selectedBorrowerId);
    
    if (!selectedBorrower) {
      toast.error('Selected borrower not found');
      return;
    }
    
    console.log('Selected existing borrower:', selectedBorrower);
    
    onBorrowerSelected({
      action: 'select',
      borrowerId: selectedBorrowerId,
      borrower: selectedBorrower
    });
    
    onClose();
  };

  // Get borrower display name with fallbacks
  const getBorrowerDisplayName = (borrower) => {
    if (!borrower) return 'Unknown';
    
    // Access user object for name
    if (borrower.user) {
      // If we have first and last name in user object
      if (borrower.user.firstName && borrower.user.lastName) {
        return `${borrower.user.firstName} ${borrower.user.lastName}`;
      }
      
      // If we only have first name
      if (borrower.user.firstName) {
        return borrower.user.firstName;
      }
      
      // If we only have last name
      if (borrower.user.lastName) {
        return borrower.user.lastName;
      }
      
      // If we have email but no name
      if (borrower.user.email) {
        return borrower.user.email.split('@')[0]; // Use part before @ as name
      }
    }
    
    // Fallback to borrower direct properties (in case they exist)
    if (borrower.firstName && borrower.lastName) {
      return `${borrower.firstName} ${borrower.lastName}`;
    }
    
    if (borrower.firstName) {
      return borrower.firstName;
    }
    
    if (borrower.lastName) {
      return borrower.lastName;
    }
    
    if (borrower.email) {
      return borrower.email.split('@')[0];
    }
    
    return 'Unknown';
  };

  // Get initials for avatar with fallbacks
  const getBorrowerInitials = (borrower) => {
    if (!borrower) return '?';
    
    // Access user object for initials
    if (borrower.user) {
      const firstInitial = borrower.user.firstName ? borrower.user.firstName.charAt(0).toUpperCase() : '?';
      const lastInitial = borrower.user.lastName ? borrower.user.lastName.charAt(0).toUpperCase() : '';
      
      return `${firstInitial}${lastInitial}`;
    }
    
    // Fallback to borrower direct properties
    const firstInitial = borrower.firstName ? borrower.firstName.charAt(0).toUpperCase() : '?';
    const lastInitial = borrower.lastName ? borrower.lastName.charAt(0).toUpperCase() : '';
    
    return `${firstInitial}${lastInitial}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Select Borrower</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Borrower from XML info */}
        {borrowerDataFromXml && (
          <div className="bg-blue-50 p-4 border-b border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Borrower from XML File</h3>
            <div className="text-sm text-blue-700">
              <p><strong>Name:</strong> {borrowerDataFromXml.firstName} {borrowerDataFromXml.lastName}</p>
              <p><strong>Email:</strong> {borrowerDataFromXml.email || 'Not provided'}</p>
              <p><strong>Phone:</strong> {borrowerDataFromXml.phone || 'Not provided'}</p>
            </div>
          </div>
        )}
        
        {/* Search input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search borrowers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Select an existing borrower or create a new one:
          </p>
        </div>
        
        {/* Borrower list */}
        <div className="overflow-y-auto max-h-[40vh]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
              <span className="text-gray-600">Loading borrowers...</span>
            </div>
          ) : filteredBorrowers.length === 0 && searchTerm === '' ? (
            <div className="p-8 text-center text-gray-500">
              <p>No borrowers found</p>
            </div>
          ) : filteredBorrowers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No borrowers match your search</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredBorrowers.map(borrower => (
                <div
                  key={borrower._id}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedBorrowerId === borrower._id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedBorrowerId(borrower._id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    selectedBorrowerId === borrower._id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {selectedBorrowerId === borrower._id ? (
                      <Check size={16} />
                    ) : (
                      getBorrowerInitials(borrower)
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{getBorrowerDisplayName(borrower)}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      {(borrower.user?.email || borrower.email) && (
                        <div className="flex items-center mr-4">
                          <Mail size={14} className="mr-1" />
                          <span>{borrower.user?.email || borrower.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Create new borrower option */}
        <div className="border-t border-gray-200 p-4">
          <div
            className={`flex items-center p-4 rounded-md cursor-pointer ${
              selectedBorrowerId === 'new' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            }`}
            onClick={() => setSelectedBorrowerId('new')}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
              selectedBorrowerId === 'new' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              <UserPlus size={16} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Create New Borrower</h3>
              <p className="text-sm text-gray-500">
                Create new borrower for {borrowerDataFromXml ? `${borrowerDataFromXml.firstName} ${borrowerDataFromXml.lastName}` : 'this loan'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer with actions */}
        <div className="border-t border-gray-200 p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectBorrower}
            disabled={!selectedBorrowerId || creatingNewBorrower}
            className={`px-4 py-2 rounded-md text-white ${
              !selectedBorrowerId || creatingNewBorrower
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {creatingNewBorrower ? (
              <>
                <Loader2 size={16} className="animate-spin inline mr-2" />
                Creating...
              </>
            ) : selectedBorrowerId === 'new' ? (
              'Use Selected Borrower'
            ) : (
              'Use Selected Borrower'
            )}
          </button>
        </div>
        
        {/* Debug info - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="border-t border-gray-200 p-2 text-xs text-gray-500 text-center">
            {loading ? (
              'Loading borrowers...'
            ) : (
              <>
                Loaded {borrowers.length} borrowers
                {borrowers.length > 0 && (
                  <> | First borrower: {getBorrowerDisplayName(borrowers[0])}</>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowerSelectionModal;
