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
      // If initialBorrowers are provided and not empty, use them (pre-filtered matches)
      if (initialBorrowers && Array.isArray(initialBorrowers) && initialBorrowers.length > 0) {
        console.log('Using initial borrowers:', initialBorrowers);
        console.log('Sample borrower object:', initialBorrowers[0]);
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
      
      const response = await axios.get(
        `${API_URL}/api/v1/lenders/borrowers`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        const borrowerList = response.data.data || [];
        console.log('Fetched borrowers:', borrowerList);
        if (borrowerList.length > 0) {
          console.log('Sample fetched borrower:', borrowerList[0]);
        }
        
        setBorrowers(borrowerList);
        
        // Check if there's a matching borrower in the list
        if (borrowerDataFromXml && borrowerDataFromXml.email) {
          const match = borrowerList.find(
            b => b.email && b.email.toLowerCase() === borrowerDataFromXml.email.toLowerCase()
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
    
    const firstName = borrower.firstName || '';
    const lastName = borrower.lastName || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase().trim();
    const email = (borrower.email || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || 
           email.includes(searchLower) ||
           (borrower.phone && borrower.phone.includes(searchTerm));
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
    
    // If we have first and last name, use them
    if (borrower.firstName && borrower.lastName) {
      return `${borrower.firstName} ${borrower.lastName}`;
    }
    
    // If we only have first name
    if (borrower.firstName) {
      return borrower.firstName;
    }
    
    // If we only have last name
    if (borrower.lastName) {
      return borrower.lastName;
    }
    
    // If we have email but no name
    if (borrower.email) {
      return borrower.email.split('@')[0]; // Use part before @ as name
    }
    
    return 'Unknown';
  };

  // Get initials for avatar with fallbacks
  const getBorrowerInitials = (borrower) => {
    if (!borrower) return '?';
    
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
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* Show matched title if using initialBorrowers */}
          {initialBorrowers && Array.isArray(initialBorrowers) && initialBorrowers.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-green-700 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                <span>{initialBorrowers.length} potential {initialBorrowers.length === 1 ? 'match' : 'matches'} found from XML data</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                We found {initialBorrowers.length} {initialBorrowers.length === 1 ? 'borrower' : 'borrowers'} that might match the information in your XML file.
              </p>
            </div>
          )}
          
          {/* Show "no exact matches" message when initialBorrowers is empty array (not null/undefined) */}
          {initialBorrowers && Array.isArray(initialBorrowers) && initialBorrowers.length === 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-amber-700 flex items-center">
                <Search className="h-4 w-4 mr-1" />
                <span>No exact matches found</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                No borrowers exactly match the information in your XML file. You can select from existing borrowers or create a new one.
              </p>
            </div>
          )}
        
          {borrowerDataFromXml && (
            <div className="mb-5 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Borrower from XML File</h3>
              <div className="text-sm">
                <p><span className="font-medium">Name:</span> {borrowerDataFromXml.firstName} {borrowerDataFromXml.lastName}</p>
                <p><span className="font-medium">Email:</span> {borrowerDataFromXml.email || 'Not provided'}</p>
                {borrowerDataFromXml.phone && (
                  <p><span className="font-medium">Phone:</span> {borrowerDataFromXml.phone}</p>
                )}
                {matchFound && (
                  <div className="mt-2 text-green-700 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    <span>Matching borrower found!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Search borrowers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Borrower List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-500">Loading borrowers...</span>
              </div>
            ) : filteredBorrowers.length > 0 ? (
              <>
                <p className="text-xs text-gray-500 mb-2">Select an existing borrower or create a new one:</p>
                {filteredBorrowers.map((borrower) => (
                  <div
                    key={borrower._id || Math.random().toString()}
                    className={`flex items-center p-3 rounded-lg cursor-pointer ${
                      selectedBorrowerId === borrower._id
                        ? 'bg-blue-50 border-blue-300 border'
                        : 'hover:bg-gray-50 border border-gray-100'
                    }`}
                    onClick={() => setSelectedBorrowerId(borrower._id)}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      selectedBorrowerId === borrower._id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {getBorrowerInitials(borrower)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getBorrowerDisplayName(borrower)}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Mail className="h-3 w-3 mr-1" />
                        {borrower.email || 'No email'}
                      </div>
                    </div>
                    {selectedBorrowerId === borrower._id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No borrowers found</p>
              </div>
            )}

            {/* Create new borrower option */}
            <div
              className={`flex items-center p-3 rounded-lg cursor-pointer mt-4 ${
                selectedBorrowerId === 'new'
                  ? 'bg-green-50 border-green-300 border'
                  : 'hover:bg-gray-50 border border-gray-200 border-dashed'
              }`}
              onClick={() => setSelectedBorrowerId('new')}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                selectedBorrowerId === 'new' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Create New Borrower</p>
                <p className="text-xs text-gray-500">
                  {borrowerDataFromXml 
                    ? `Create new borrower for ${borrowerDataFromXml.firstName || ''} ${borrowerDataFromXml.lastName || ''}` 
                    : 'Create borrower from XML data'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          
          {selectedBorrowerId === 'new' ? (
            <button
              onClick={handleCreateNewBorrower}
              disabled={creatingNewBorrower}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {creatingNewBorrower ? (
                <>
                  <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create New Borrower'
              )}
            </button>
          ) : (
            <button
              onClick={handleSelectBorrower}
              disabled={!selectedBorrowerId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Use Selected Borrower
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BorrowerSelectionModal;
