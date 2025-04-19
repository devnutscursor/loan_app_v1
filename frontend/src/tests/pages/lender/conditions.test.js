import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import ConditionsDashboardPage from '../../../pages/lender/conditions';
import lenderService from '../../../services/api/lender.service';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

jest.mock('../../../services/api/lender.service', () => ({
  getAllConditions: jest.fn(),
  getConditionTags: jest.fn(),
  updateConditionStatus: jest.fn(),
  deleteCondition: jest.fn()
}));

jest.mock('../../../components/layout/MainLayout', () => {
  return ({ children }) => <div data-testid="main-layout">{children}</div>;
});

jest.mock('../../../components/auth/ProtectedRoute', () => {
  return ({ children }) => <div data-testid="protected-route">{children}</div>;
});

describe('ConditionsDashboardPage', () => {
  const mockRouter = {
    push: jest.fn(),
    query: { status: '' }
  };

  const mockConditions = [
    {
      _id: '1',
      title: 'Income Verification',
      description: 'Need W2 and last 2 paystubs',
      loanId: { _id: 'loan1' },
      loanNumber: 'LN12345',
      borrowerName: 'John Doe',
      status: 'pending',
      priority: 'high',
      category: 'income',
      dueDate: new Date('2025-05-01'),
      tags: ['income', 'documentation']
    },
    {
      _id: '2',
      title: 'Property Appraisal',
      description: 'Schedule property appraisal',
      loanId: { _id: 'loan2' },
      loanNumber: 'LN54321',
      borrowerName: 'Jane Smith',
      status: 'in_progress',
      priority: 'medium',
      category: 'property',
      dueDate: new Date('2025-04-20'),
      tags: ['property', 'appraisal']
    }
  ];

  const mockTags = ['income', 'documentation', 'property', 'appraisal'];

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    
    lenderService.getAllConditions.mockResolvedValue({
      data: {
        data: mockConditions,
        totalCount: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
    
    lenderService.getConditionTags.mockResolvedValue({
      data: {
        data: mockTags
      }
    });
    
    lenderService.updateConditionStatus.mockResolvedValue({
      data: {
        success: true
      }
    });
    
    lenderService.deleteCondition.mockResolvedValue({
      data: {
        success: true
      }
    });

    // Mock confirm
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the conditions dashboard', async () => {
    render(<ConditionsDashboardPage />);
    
    // Check page title is rendered
    expect(screen.getByText('Conditions Dashboard')).toBeInTheDocument();
    
    // Wait for conditions to be loaded
    await waitFor(() => {
      // Check if both conditions are rendered
      expect(screen.getByText('Income Verification')).toBeInTheDocument();
      expect(screen.getByText('Property Appraisal')).toBeInTheDocument();
    });
    
    // Verify filter controls are present
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('allows filtering conditions', async () => {
    render(<ConditionsDashboardPage />);
    
    // Wait for conditions to be loaded
    await waitFor(() => {
      expect(screen.getByText('Income Verification')).toBeInTheDocument();
    });
    
    // Select status filter
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'pending' } });
    
    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Verify API was called with correct filters
    expect(lenderService.getAllConditions).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' })
    );
  });

  it('allows changing condition status', async () => {
    render(<ConditionsDashboardPage />);
    
    // Wait for conditions to be loaded
    await waitFor(() => {
      expect(screen.getByText('Income Verification')).toBeInTheDocument();
    });
    
    // Find status dropdown for the first condition
    const statusDropdowns = screen.getAllByRole('combobox');
    const firstConditionStatusDropdown = statusDropdowns[4]; // The first few are filter dropdowns
    
    // Change status to cleared
    fireEvent.change(firstConditionStatusDropdown, { target: { value: 'cleared' } });
    
    // Verify API was called to update status
    expect(lenderService.updateConditionStatus).toHaveBeenCalledWith(
      '1', 
      { status: 'cleared' }
    );
  });

  it('allows deleting a condition', async () => {
    render(<ConditionsDashboardPage />);
    
    // Wait for conditions to be loaded
    await waitFor(() => {
      expect(screen.getByText('Income Verification')).toBeInTheDocument();
    });
    
    // Find and click delete button for the first condition
    const deleteButtons = screen.getAllByRole('button').filter(
      button => button.className.includes('text-red-600')
    );
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    expect(window.confirm).toHaveBeenCalled();
    
    // Verify API was called to delete condition
    expect(lenderService.deleteCondition).toHaveBeenCalledWith('1');
  });

  it('navigates to loan details when condition title is clicked', async () => {
    render(<ConditionsDashboardPage />);
    
    // Wait for conditions to be loaded
    await waitFor(() => {
      expect(screen.getByText('Income Verification')).toBeInTheDocument();
    });
    
    // Click on condition title
    fireEvent.click(screen.getByText('Income Verification'));
    
    // Verify router push was called with correct parameters
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/lender/application-details',
      query: { id: 'loan1', tab: 'conditions', highlight: '1' }
    });
  });
});
