import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/api';

export const useAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all'
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminService.getUsers({ limit: 1000 }); // Get all users
        console.log('Admin users response:', response.data);
        const data = response.data.data || [];
        
        // Debug: Check if Asad Ali is in the users list
        const asadAli = data.find(user => 
          user.firstName?.toLowerCase() === 'asad' && 
          user.lastName?.toLowerCase() === 'ali'
        );
        console.log('Asad Ali found in users:', asadAli);
        console.log('All user IDs:', data.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}` })));
        
        setUsers(data);
      } catch (e) {
        console.error('Error fetching admin users:', e);
        toast.error('Failed to load users');
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (column) => {
    if (sortBy === column) {
      toggleSortDirection();
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, { isActive: newStatus });
      toast.success('User status updated successfully');
      
      // Update user in state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ role: 'all', status: 'all' });
  };

  const filteredUsers = useMemo(() => {
    if (!users.length) return [];

    let results = [...users];

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      results = results.filter(user =>
        (user.firstName + ' ' + user.lastName).toLowerCase().includes(search) ||
        (user.email || '').toLowerCase().includes(search) ||
        (user.role || '').toLowerCase().includes(search)
      );
    }

    // Apply role filter
    if (filters.role !== 'all') {
      results = results.filter(user => user.role === filters.role);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      results = results.filter(user => user.isActive === isActive);
    }
    
    // Create local variables for sorting
    let localSortBy = sortBy;
    let localSortDirection = sortDirection;

    // Apply sorting
    results.sort((a, b) => {
      let compareA, compareB;

      switch (localSortBy) {
        case 'name':
          compareA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
          compareB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
          break;
        case 'role':
          compareA = a.role || '';
          compareB = b.role || '';
          break;
        case 'status':
          compareA = a.isActive ? 1 : 0;
          compareB = b.isActive ? 1 : 0;
          break;
        case 'date':
          compareA = new Date(a.createdAt || 0).getTime();
          compareB = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      const compareResult = compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return localSortDirection === 'asc' ? compareResult : -compareResult;
    });

    return results;
  }, [users, searchTerm, filters, sortBy, sortDirection]);

  return {
    users,
    loading,
    error,
    searchTerm,
    filters,
    sortBy,
    sortDirection,
    filteredUsers,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    handleUserStatusChange,
    clearFilters
  };
};
