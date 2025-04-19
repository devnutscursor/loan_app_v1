import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import MilestoneTimeline from './MilestoneTimeline';
import MilestoneDetails from './MilestoneDetails';
import { MilestoneService } from '../../../services';

/**
 * MilestoneManager Component
 * 
 * Main container component for milestone management functionality.
 * Manages milestone data, user interactions, and API integrations.
 */
const MilestoneManager = ({ 
  loanId, 
  userRole,
  milestoneData = null,
  onMilestoneUpdate = null,
  readOnly = false
}) => {
  // State for milestones
  const [milestones, setMilestones] = useState([]);
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  
  // State for selected milestone
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  
  // State for view configuration
  const [timelineOrientation, setTimelineOrientation] = useState('horizontal');

  // Load milestones when component mounts or loanId changes
  useEffect(() => {
    if (milestoneData) {
      // If milestone data is provided directly as a prop
      setMilestones(milestoneData);
      setIsLoading(false);
      
      // Select the current milestone by default
      const currentMilestone = milestoneData.find(m => m.status === 'current');
      if (currentMilestone) {
        setSelectedMilestone(currentMilestone);
      } else if (milestoneData.length > 0) {
        // If no current milestone, select the first incomplete one
        const firstIncompleteMilestone = milestoneData.find(m => m.status !== 'completed');
        setSelectedMilestone(firstIncompleteMilestone || milestoneData[milestoneData.length - 1]);
      }
    } else if (loanId) {
      // Otherwise fetch milestone data
      fetchMilestones();
    } else {
      // If neither data nor loanId provided, use sample data
      setMilestones(getSampleMilestones());
      setIsLoading(false);
      
      // Select the current milestone by default in sample data
      const sampleMilestones = getSampleMilestones();
      const currentMilestone = sampleMilestones.find(m => m.status === 'current');
      if (currentMilestone) {
        setSelectedMilestone(currentMilestone);
      }
    }
    
    // Set orientation based on screen size
    const handleResize = () => {
      setTimelineOrientation(window.innerWidth < 768 ? 'vertical' : 'horizontal');
    };
    
    handleResize(); // Call once to set initial state
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [loanId, milestoneData]);

  // Fetch milestones from API
  const fetchMilestones = async () => {
    setIsLoading(true);
    try {
      const response = await MilestoneService.getLoanMilestones(loanId);
      
      if (response.success) {
        const fetchedMilestones = response.data.milestones;
        setMilestones(fetchedMilestones);
        
        // Get overall progress from the API response
        const overallProgress = response.data.overallProgress;
        
        // Select the current milestone by default, fallback to first incomplete one
        const currentMilestone = response.data.currentMilestone || 
          fetchedMilestones.find(m => m.status === 'current');
          
        if (currentMilestone) {
          setSelectedMilestone(currentMilestone);
        } else if (fetchedMilestones.length > 0) {
          // If no current milestone is marked, find first non-completed milestone
          const firstIncompleteMilestone = fetchedMilestones.find(m => m.status !== 'completed');
          setSelectedMilestone(firstIncompleteMilestone || fetchedMilestones[fetchedMilestones.length - 1]);
        }
      } else {
        // If API call fails, fall back to sample data in development
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Using sample milestone data due to API error');
          const sampleMilestones = getSampleMilestones();
          setMilestones(sampleMilestones);
          
          const currentMilestone = sampleMilestones.find(m => m.status === 'current');
          if (currentMilestone) {
            setSelectedMilestone(currentMilestone);
          }
        } else {
          toast.error('Failed to load milestones');
        }
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to load milestones');
      
      // Fallback to sample data in development environment
      if (process.env.NODE_ENV !== 'production') {
        const sampleMilestones = getSampleMilestones();
        setMilestones(sampleMilestones);
        setSelectedMilestone(sampleMilestones.find(m => m.status === 'current'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle milestone click in timeline
  const handleMilestoneClick = (milestone, index) => {
    setSelectedMilestone(milestone);
  };

  // Handle marking a milestone as complete
  const handleCompleteMilestone = async (milestone) => {
    if (readOnly) return;
    
    try {
      // Call the API to update milestone status
      const response = await MilestoneService.updateMilestoneStatus(milestone._id, 'completed');
      
      if (response.success) {
        // Get the updated milestone data from the response
        const updatedMilestone = response.data;
        
        // Update the milestone in the local state
        const updatedMilestones = milestones.map(m => {
          if (m._id === milestone._id) {
            return updatedMilestone;
          }
          
          // If this was the current milestone, make the next one current
          if (m.status === 'pending' && milestone.status === 'current') {
            const currentIndex = milestones.findIndex(item => item._id === milestone._id);
            const nextIndex = milestones.findIndex(item => item._id === m._id);
            
            if (nextIndex === currentIndex + 1) {
              // Update the next milestone via API
              MilestoneService.updateMilestoneStatus(m._id, 'current');
              
              return {
                ...m,
                status: 'current'
              };
            }
          }
          
          return m;
        });
        
        setMilestones(updatedMilestones);
        setSelectedMilestone(updatedMilestone);
        
        toast.success(`Milestone '${milestone.name}' completed successfully!`);
        
        // Notify parent component if callback provided
        if (onMilestoneUpdate) {
          onMilestoneUpdate(updatedMilestones);
        }
        
        // Refresh milestone data to ensure we have latest state
        fetchMilestones();
      } else {
        toast.error('Failed to complete milestone');
      }
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone. Please try again.');
    }
  };

  // Handle marking a requirement as complete/incomplete
  const handleMarkRequired = async (reqIndex, completed) => {
    if (readOnly || !selectedMilestone) return;
    
    try {
      // Get the specific requirement ID
      const requirementId = selectedMilestone.requirements[reqIndex]._id;
      
      // Call the API to update the requirement status
      const response = await MilestoneService.updateRequirement(
        selectedMilestone._id,
        requirementId,
        completed
      );
      
      if (response.success) {
        // Get the updated milestone data from the response
        const updatedMilestone = response.data;
        
        // Update the local state
        const updatedMilestones = milestones.map(m => 
          m._id === selectedMilestone._id ? updatedMilestone : m
        );
        
        setMilestones(updatedMilestones);
        setSelectedMilestone(updatedMilestone);
        
        toast.success(`Requirement ${completed ? 'completed' : 'reopened'} successfully!`);
        
        // Notify parent component if callback provided
        if (onMilestoneUpdate) {
          onMilestoneUpdate(updatedMilestones);
        }
      } else {
        toast.error('Failed to update requirement');
      }
    } catch (error) {
      console.error('Error updating requirement:', error);
      toast.error('Failed to update requirement. Please try again.');
    }
  };

  // Sample milestone data for demonstration purposes
  const getSampleMilestones = () => ([
    {
      id: '1',
      order: 0,
      title: 'Application Submitted',
      description: 'Loan application has been successfully submitted and is ready for review.',
      status: 'completed',
      date: '2023-03-15T14:00:00Z',
      requirements: [
        { name: 'Complete application form', description: 'All required fields filled out.', completed: true },
        { name: 'Accept terms and conditions', description: 'Acknowledgment of loan terms.', completed: true }
      ],
      documents: [
        { name: 'Identification', description: 'Government-issued ID.', received: true }
      ],
      responsible: [
        { role: 'borrower' }
      ],
      nextSteps: 'Wait for initial review by loan officer.',
      borrowerCanComplete: true
    },
    {
      id: '2',
      order: 1,
      title: 'Initial Review',
      description: 'Preliminary review of application and documentation by loan officer.',
      status: 'completed',
      date: '2023-03-18T10:30:00Z',
      requirements: [
        { name: 'Credit check', description: 'Verify credit score and history.', completed: true },
        { name: 'Income verification', description: 'Confirm stated income.', completed: true }
      ],
      documents: [
        { name: 'Income documents', description: 'Pay stubs, W-2s, or tax returns.', received: true }
      ],
      responsible: [
        { role: 'lender', name: 'Loan Officer' }
      ],
      nextSteps: 'Application will move to document collection phase.',
      borrowerCanComplete: false
    },
    {
      id: '3',
      order: 2,
      title: 'Document Collection',
      description: 'Gather and verify all required documentation for loan processing.',
      status: 'current',
      date: null,
      requirements: [
        { name: 'Employment verification', description: 'Confirm employment status.', completed: true },
        { name: 'Bank statements', description: 'Review account balances and transaction history.', completed: false }
      ],
      documents: [
        { name: 'Bank statements', description: 'Last 3 months of statements.', received: false },
        { name: 'Tax returns', description: 'Last 2 years of tax returns.', received: true },
        { name: 'Proof of assets', description: 'Documentation of other assets.', received: false }
      ],
      responsible: [
        { role: 'borrower' },
        { role: 'lender', name: 'Loan Processor' }
      ],
      nextSteps: [
        'Upload remaining required documents',
        'Respond to any information requests from loan processor'
      ],
      borrowerCanComplete: false
    },
    {
      id: '4',
      order: 3,
      title: 'Underwriting',
      description: 'Detailed analysis of financial information and loan eligibility.',
      status: 'pending',
      date: null,
      requirements: [
        { name: 'Risk assessment', description: 'Evaluate risk factors.', completed: false },
        { name: 'Loan-to-value calculation', description: 'Determine LTV ratio.', completed: false }
      ],
      documents: [],
      responsible: [
        { role: 'lender', name: 'Underwriter' }
      ],
      nextSteps: 'Underwriter will evaluate your application against lending criteria.',
      borrowerCanComplete: false
    },
    {
      id: '5',
      order: 4,
      title: 'Loan Approval',
      description: 'Final review and decision on loan application.',
      status: 'pending',
      date: null,
      requirements: [
        { name: 'Final approval', description: 'Management sign-off on loan.', completed: false }
      ],
      documents: [],
      responsible: [
        { role: 'lender', name: 'Loan Manager' }
      ],
      nextSteps: 'Await final decision on loan application.',
      borrowerCanComplete: false
    },
    {
      id: '6',
      order: 5,
      title: 'Closing',
      description: 'Sign final paperwork and complete loan process.',
      status: 'pending',
      date: null,
      requirements: [
        { name: 'Schedule closing', description: 'Set appointment for signing.', completed: false },
        { name: 'Final walkthrough', description: 'Verify property condition.', completed: false },
        { name: 'Closing disclosure review', description: 'Review final terms.', completed: false }
      ],
      documents: [
        { name: 'Closing disclosure', description: 'Final loan terms document.', received: false },
        { name: 'Settlement statement', description: 'Breakdown of all costs.', received: false }
      ],
      responsible: [
        { role: 'borrower' },
        { role: 'lender', name: 'Closing Agent' }
      ],
      nextSteps: 'Prepare for closing day and review final documents.',
      borrowerCanComplete: false
    }
  ]);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Timeline Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <MilestoneTimeline 
          milestones={milestones}
          orientation={timelineOrientation}
          onMilestoneClick={handleMilestoneClick}
          expandedByDefault={true}
        />
      </div>
      
      {/* Selected Milestone Details */}
      {selectedMilestone && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <MilestoneDetails 
            milestone={selectedMilestone}
            onComplete={!readOnly ? handleCompleteMilestone : null}
            onMarkRequired={!readOnly ? handleMarkRequired : null}
            userRole={userRole}
            onClose={() => setSelectedMilestone(null)}
          />
        </div>
      )}
    </div>
  );
};

MilestoneManager.propTypes = {
  loanId: PropTypes.string,
  userRole: PropTypes.oneOf(['borrower', 'lender', 'admin']).isRequired,
  milestoneData: PropTypes.array,
  onMilestoneUpdate: PropTypes.func,
  readOnly: PropTypes.bool
};

export default MilestoneManager;
