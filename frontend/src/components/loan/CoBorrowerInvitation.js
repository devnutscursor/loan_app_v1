import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiUserPlus, FiX, FiMail, FiUser, FiClock, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { LoanService } from '../../services';

/**
 * Co-Borrower Invitation Component
 * 
 * Allows borrowers to invite co-borrowers to their loan application
 * and tracks invitation status.
 */
const CoBorrowerInvitation = ({ loanId, onInvitationUpdate, initialInvitations = [] }) => {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [newInvitation, setNewInvitation] = useState({
    firstName: '',
    lastName: '',
    email: '',
    relationship: 'spouse'
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  useEffect(() => {
    if (loanId) {
      loadInvitations();
    }
  }, [loanId]);
  
  const loadInvitations = async () => {
    if (!loanId) return;
    
    try {
      setLoading(true);
      const response = await LoanService.getCoBorrowerInvitations(loanId);
      
      if (response.success) {
        setInvitations(response.data);
        if (onInvitationUpdate) {
          onInvitationUpdate(response.data);
        }
      } else {
        console.error('Failed to load co-borrower invitations:', response.message);
      }
    } catch (error) {
      console.error('Error loading co-borrower invitations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvitation(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const handleInviteCoBorrower = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newInvitation.firstName.trim() || !newInvitation.lastName.trim()) {
      toast.error('Please enter the co-borrower\'s name');
      return;
    }
    
    if (!validateEmail(newInvitation.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Check for duplicate emails
    if (invitations.some(invite => invite.email === newInvitation.email)) {
      toast.error('This email has already been invited');
      return;
    }
    
    try {
      setLoading(true);
      const response = await LoanService.inviteCoBorrower(loanId, newInvitation);
      
      if (response.success) {
        toast.success('Co-borrower invitation sent successfully');
        setInvitations(prev => [...prev, response.data]);
        setNewInvitation({
          firstName: '',
          lastName: '',
          email: '',
          relationship: 'spouse'
        });
        setShowForm(false);
        
        if (onInvitationUpdate) {
          onInvitationUpdate([...invitations, response.data]);
        }
      } else {
        toast.error(response.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting co-borrower:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelInvitation = async (invitationId) => {
    try {
      setLoading(true);
      const response = await LoanService.cancelCoBorrowerInvitation(loanId, invitationId);
      
      if (response.success) {
        toast.success('Invitation cancelled successfully');
        setInvitations(prev => prev.filter(invite => invite._id !== invitationId));
        
        if (onInvitationUpdate) {
          onInvitationUpdate(invitations.filter(invite => invite._id !== invitationId));
        }
      } else {
        toast.error(response.message || 'Failed to cancel invitation');
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendInvitation = async (invitationId) => {
    try {
      setLoading(true);
      const response = await LoanService.resendCoBorrowerInvitation(loanId, invitationId);
      
      if (response.success) {
        toast.success('Invitation resent successfully');
        
        // Update invitation with new status
        setInvitations(prev => prev.map(invite => 
          invite._id === invitationId 
            ? { ...invite, status: 'pending', lastSent: new Date().toISOString() }
            : invite
        ));
      } else {
        toast.error(response.message || 'Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheck className="mr-1" /> Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiX className="mr-1" /> Declined
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FiAlertTriangle className="mr-1" /> Expired
          </span>
        );
      default:
        return null;
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Co-Borrowers</h3>
        
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none"
          >
            <FiUserPlus className="mr-2" />
            Add Co-Borrower
          </button>
        )}
      </div>
      
      {showForm && (
        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Invite a Co-Borrower</h4>
          
          <form onSubmit={handleInviteCoBorrower}>
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={newInvitation.firstName}
                    onChange={handleInputChange}
                    required
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={newInvitation.lastName}
                    onChange={handleInputChange}
                    required
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={newInvitation.email}
                    onChange={handleInputChange}
                    required
                    className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="co-borrower@example.com"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <div className="mt-1">
                  <select
                    id="relationship"
                    name="relationship"
                    value={newInvitation.relationship}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="spouse">Spouse</option>
                    <option value="partner">Partner</option>
                    <option value="relative">Relative</option>
                    <option value="business_partner">Business Partner</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="mr-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading && invitations.length === 0 ? (
        <div className="text-center py-4">
          <div className="animate-spin inline-block h-6 w-6 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 rounded-md">
          <FiUser className="h-8 w-8 text-gray-400 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">No co-borrowers added yet</p>
          <p className="text-xs text-gray-400">
            Adding a co-borrower can strengthen your application and may help you qualify for better terms
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
          {invitations.map((invitation) => (
            <li key={invitation._id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white">
                      {invitation.firstName.charAt(0)}{invitation.lastName.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-4 truncate">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {invitation.firstName} {invitation.lastName}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {invitation.email}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Relationship: {invitation.relationship.charAt(0).toUpperCase() + invitation.relationship.slice(1).replace('_', ' ')}
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                  {getStatusBadge(invitation.status)}
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {invitation.lastSent ? `Sent: ${formatDate(invitation.lastSent)}` : ''}
                  </div>
                  
                  <div className="mt-2 flex space-x-2">
                    {invitation.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleResendInvitation(invitation._id)}
                          className="text-xs text-primary hover:text-primary-dark"
                        >
                          Resend
                        </button>
                        <span className="text-gray-300">|</span>
                      </>
                    )}
                    
                    {(invitation.status === 'pending' || invitation.status === 'expired') && (
                      <button
                        type="button"
                        onClick={() => handleCancelInvitation(invitation._id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CoBorrowerInvitation;
