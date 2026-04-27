import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgressWithLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { fetchAPI } from '@/utils/api';
import { getLoanProgramDisplayLabel } from '@/utils/programType';
import Link from 'next/link';

// Custom circular progress component with label
function CircularProgressWithLabel(props) {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" {...props} thickness={5} size={100} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          variant="h5"
          component="div"
          color="textPrimary"
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

export default function BorrowerScenario({ loanId, refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qualification, setQualification] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    if (loanId) {
      fetchPrograms();
      fetchLoanDetails();
    }
  }, [loanId, refreshTrigger]);

  const fetchPrograms = async () => {
    try {
      const response = await fetchAPI('/loan-programs');
      if (response.status === 'success') {
        setPrograms(response.data.filter(p => p.isAvailableToBorrower));
      } else {
        setError('Failed to load loan programs');
      }
    } catch (err) {
      setError(err.message || 'Failed to load loan programs');
    }
  };

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      
      // Get loan details first
      const loanResponse = await fetchAPI(`/loans/${loanId}`);
      if (loanResponse.status !== 'success') {
        setError('Failed to load loan details');
        return;
      }
      
      // Calculate qualification for the primary program
      // This would normally check for a preferred program or use a default one
      const availablePrograms = programs.length > 0 ? programs : await fetchDefaultPrograms();
      
      if (availablePrograms.length === 0) {
        setError('No loan programs available');
        return;
      }
      
      // Use the first program as default
      const primaryProgram = availablePrograms[0];
      
      const qualificationResponse = await fetchAPI(`/loan-programs/qualification/${loanId}/${primaryProgram._id}`);
      
      if (qualificationResponse.status === 'success') {
        setQualification(qualificationResponse.data);
        setSelectedProgram(primaryProgram);
      } else {
        setError('Failed to calculate qualification');
      }
    } catch (err) {
      setError(err.message || 'Failed to load scenario details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultPrograms = async () => {
    try {
      const response = await fetchAPI('/loan-programs');
      if (response.status === 'success') {
        setPrograms(response.data.filter(p => p.isAvailableToBorrower));
        return response.data.filter(p => p.isAvailableToBorrower);
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  const changeProgram = async (programId) => {
    try {
      setLoading(true);
      
      const program = programs.find(p => p._id === programId);
      if (!program) return;
      
      const qualificationResponse = await fetchAPI(`/loan-programs/qualification/${loanId}/${programId}`);
      
      if (qualificationResponse.status === 'success') {
        setQualification(qualificationResponse.data);
        setSelectedProgram(program);
      } else {
        setError('Failed to calculate qualification for selected program');
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate qualification');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = () => {
    setDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialog(false);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Borrower Scenario
        </Typography>
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Borrower Scenario
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!qualification || !selectedProgram) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Borrower Scenario
        </Typography>
        <Alert severity="info">No qualification data available.</Alert>
      </Paper>
    );
  }

  const { isQualified, disqualificationReasons, loanMetrics } = qualification;
  const { dti, downPaymentPercentage, totalMonthlyPayment, loanAmount } = loanMetrics || {};

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Typography variant="h6">
          Borrower Scenario
        </Typography>
        <Chip 
          label={isQualified ? "Qualified" : "Not Qualified"} 
          color={isQualified ? "success" : "error"}
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '0.9rem',
            py: 2,
            px: 1
          }}
        />
      </Box>

      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" mb={3}>
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center"
          mr={{ xs: 0, sm: 4 }}
          mb={{ xs: 3, sm: 0 }}
        >
          <CircularProgressWithLabel 
            value={Math.min(downPaymentPercentage || 0, 100)}
            color={isQualified ? "success" : "error"}
          />
          <Typography variant="subtitle1" mt={1}>DTI: {dti ? dti.toFixed(2) : 0}%</Typography>
        </Box>

        <Box flexGrow={1}>
          <List dense disablePadding>
            <ListItem disableGutters>
              <ListItemText 
                primary="Monthly Payment:" 
                secondary={`$${totalMonthlyPayment ? totalMonthlyPayment.toFixed(2) : '0.00'}`}
              />
            </ListItem>
            <Divider />
            <ListItem disableGutters>
              <ListItemText 
                primary="Purchase Price:" 
                secondary={`$${loanAmount ? (loanAmount / (1 - downPaymentPercentage / 100)).toFixed(2) : '0.00'}`}
              />
            </ListItem>
            <Divider />
            <ListItem disableGutters>
              <ListItemText 
                primary="Down Payment:" 
                secondary={`$${loanAmount ? ((loanAmount / (1 - downPaymentPercentage / 100)) * (downPaymentPercentage / 100)).toFixed(2) : '0.00'}`}
              />
            </ListItem>
            <Divider />
            <ListItem disableGutters>
              <ListItemText 
                primary="Loan Program:" 
                secondary={selectedProgram.displayName}
              />
            </ListItem>
          </List>
        </Box>
      </Box>

      {!isQualified && disqualificationReasons.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Reason(s) for Not Qualifying:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {disqualificationReasons.map((reason, index) => (
              <li key={index}>{reason.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Box display="flex" justifyContent="flex-end">
        <Button 
          variant="outlined" 
          color="primary"
          startIcon={<EditIcon />}
          onClick={handleShowDetails}
        >
          View/Edit Borrower Scenario
        </Button>
      </Box>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Loan Program Details
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Available Programs
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
            {programs.map(program => (
              <Chip
                key={program._id}
                label={getLoanProgramDisplayLabel(program)}
                onClick={() => changeProgram(program._id)}
                color={selectedProgram._id === program._id ? "primary" : "default"}
                variant={selectedProgram._id === program._id ? "filled" : "outlined"}
                clickable
              />
            ))}
          </Box>

          {selectedProgram && (
            <>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Program Restrictions
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Max DTI:" 
                    secondary={`${selectedProgram.restrictions?.dtiRestriction?.max || 'No Limit'}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Down Payment Range:" 
                    secondary={`Min: ${selectedProgram.restrictions?.downPaymentRestriction?.min || 'No Minimum'}% - Max: ${selectedProgram.restrictions?.downPaymentRestriction?.max || 'No Maximum'}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Loan Amount Range:" 
                    secondary={`Min: $${selectedProgram.restrictions?.loanAmountRestriction?.min?.toLocaleString() || 'No Minimum'} - Max: $${selectedProgram.restrictions?.loanAmountRestriction?.max?.toLocaleString() || 'No Maximum'}`}
                  />
                </ListItem>
              </List>

              <Typography variant="subtitle1" gutterBottom fontWeight="bold" mt={2}>
                Current Metrics
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="DTI:" 
                    secondary={`${dti?.toFixed(2) || '0.00'}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Down Payment:" 
                    secondary={`${downPaymentPercentage?.toFixed(2) || '0.00'}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Loan Amount:" 
                    secondary={`$${loanAmount?.toLocaleString() || '0.00'}`}
                  />
                </ListItem>
              </List>
            </>
          )}

          {!isQualified && disqualificationReasons.length > 0 && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Reasons for Not Qualifying:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                {disqualificationReasons.map((reason, index) => (
                  <li key={index}>{reason.message}</li>
                ))}
              </ul>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>
            Close
          </Button>
          <Link href={`/lender/loans/${loanId}/edit`} passHref>
            <Button color="primary" variant="contained">
              Edit Loan Details
            </Button>
          </Link>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
