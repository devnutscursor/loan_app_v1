import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import milestoneService from '../../../services/api/milestone.service';

// Icons for different milestone statuses
const StatusIcons = {
  pending: (
    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  ),
  
  in_progress: (
    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </div>
  ),
  
  completed: (
    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-green-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  ),
};

const BorrowerLoanMilestones = ({ loanId }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate the overall progress based on milestone status
  const calculateProgress = (milestones) => {
    if (!milestones || milestones.length === 0) return 0;
    
    // Completed milestones count for 100% of their weight
    const completedCount = milestones.filter(m => m.status === 'completed' || m.isCompleted).length;
    
    // In-progress milestones count for 50% of their weight
    const inProgressCount = milestones.filter(m => m.status === 'in_progress').length;
    
    // Calculate weighted progress (completed = 100%, in_progress = 50%)
    const progressValue = (completedCount + (inProgressCount * 0.5)) / milestones.length;
    return Math.round(progressValue * 100);
  };

  // Fetch milestones when component mounts or loanId changes
  useEffect(() => {
    if (!loanId) return;
    
    const fetchMilestones = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching milestones for loan ID:', loanId);
        const response = await milestoneService.getLoanMilestones(loanId);
        console.log('Milestones response:', response);
        
        if (response.status === 'success') {
          const { milestones = [] } = response.data || {};
          console.log(`Retrieved ${milestones.length} milestones`);
          
          // Sort milestones by order field
          const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);
          setMilestones(sortedMilestones);
        } else {
          console.error('Failed to fetch milestones:', response?.message || 'Unknown error');
          setError(response?.message || 'Failed to load milestones');
        }
      } catch (err) {
        console.error('Error fetching milestones:', err);
        setError('An error occurred while loading milestones');
        toast.error('Failed to load milestones');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMilestones();
  }, [loanId]);

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <span className="mr-2">🏆</span>
          Loan Milestones
        </h3>
      </div>
      
      {/* Overall Progress */}
      <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
        <h4 className="text-base font-medium text-gray-900 mb-2">Overall Progress</h4>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-800  h-2.5 rounded-full" 
            style={{ width: `${calculateProgress(milestones)}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-600 text-right">{calculateProgress(milestones)}% Complete</p>
      </div>
      
      {/* Milestones List */}
      <div className="px-4 py-5 sm:p-6">
        {loading ? (
          <div className="relative">
      {/* Skeleton vertical timeline line */}
      <div className="absolute top-0 left-4 h-full w-0.5 bg-gray-200 z-0"></div>
      
      {/* Skeleton Milestones */}
      <div className="space-y-4 relative z-10">
        {[1, 2, 3, 4, 5].map((_, index) => (
          <div key={index} className="relative animate-pulse">
            <div className="flex items-start">
              {/* Skeleton status icon */}
              <div className="flex-shrink-0 z-10">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center"></div>
              </div>
              
              {/* Skeleton milestone card */}
              <div className="ml-6 flex-1">
                <div className="rounded-lg shadow-sm overflow-hidden border-l-4 border-l-gray-200 bg-white">
                  <div className="py-2 px-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-5 w-32 bg-gray-200 rounded"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
                    </div>
                    
                    <div className="h-3 w-full bg-gray-200 rounded mt-2"></div>
                    <div className="h-3 w-2/3 bg-gray-200 rounded mt-1"></div>
                  </div>
                  
                  {/* Skeleton completed date - show on random items for realism */}
                  {index % 2 === 0 && (
                    <div className="bg-gray-50 px-3 py-1 border-t border-gray-100">
                      <div className="h-3 w-32 bg-gray-200 rounded"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
        ) : error ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Milestones</h3>
            <p className="mt-1 text-sm text-red-500 mb-3">{error}</p>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No milestones found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no milestones defined for this loan yet.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute top-0 left-4 h-full w-0.5 bg-gray-200 z-0"></div>
            
            {/* Milestones */}
            <div className="space-y-4 relative z-10">
              {milestones.map((milestone, index) => (
                <div key={milestone._id} className="relative">
                  <div className="flex items-start">
                    {/* Status icon */}
                    <div className="flex-shrink-0 z-10">
                      {StatusIcons[milestone.status]}
                    </div>
                    
                    {/* Milestone card */}
                    <div className="ml-6 flex-1">
                      <div 
                        className={`rounded-lg shadow-sm overflow-hidden border-l-4 ${milestone.status === 'completed'
                          ? 'border-l-green-500 bg-white' 
                          : milestone.status === 'in_progress'
                            ? 'border-l-blue-500 bg-blue-50' 
                            : 'border-l-gray-300 bg-white'}`}
                      >
                        <div className="py-2 px-3">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-base font-medium text-gray-900">{milestone.name}</h4>
                            <div>
                              {milestone.status === 'completed' ? (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center">
                                  <svg className="w-2.5 h-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Completed
                                </span>
                              ) : milestone.status === 'in_progress' ? (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center">
                                  <svg className="w-2.5 h-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  In Progress
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center">
                                  <svg className="w-2.5 h-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-0.5">
                            {milestone.description || 'No description provided'}
                          </p>
                        </div>
                        
                        {milestone.completedDate && (
                          <div className="bg-gray-50 px-3 py-1 border-t border-gray-100 text-xs text-gray-500 flex items-center">
                            <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Completed on {new Date(milestone.completedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowerLoanMilestones;
