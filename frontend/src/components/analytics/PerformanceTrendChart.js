import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Chart from 'chart.js/auto';

/**
 * Performance Trend Chart Component
 * 
 * Visualizes loan application trends over time, showing applications submitted,
 * approvals, and loan volume to help lenders identify patterns and performance.
 */
const PerformanceTrendChart = ({ 
  trendData, 
  timeframe = 'month',
  showVolume = true
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Format currency for axis labels and tooltips
  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return '$' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return '$' + (value / 1000).toFixed(1) + 'K';
    }
    return '$' + value;
  };
  
  // Generate time labels based on timeframe
  const generateTimeLabels = () => {
    const now = new Date();
    const labels = [];
    
    switch (timeframe) {
      case 'day':
        // Last 24 hours
        for (let i = 23; i >= 0; i--) {
          const date = new Date(now);
          date.setHours(now.getHours() - i);
          labels.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        break;
      case 'week':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          labels.push(date.toLocaleDateString([], { weekday: 'short' }));
        }
        break;
      case 'month':
        // Last 30 days grouped by week
        for (let i = 4; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - (i * 7));
          labels.push(`Week ${4-i}`);
        }
        break;
      case 'quarter':
        // Last 3 months
        for (let i = 2; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
          labels.push(date.toLocaleDateString([], { month: 'short' }));
        }
        break;
      case 'year':
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
          labels.push(date.toLocaleDateString([], { month: 'short' }));
        }
        break;
      default:
        // Default to month view
        for (let i = 4; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - (i * 7));
          labels.push(`Week ${4-i}`);
        }
    }
    
    return labels;
  };
  
  useEffect(() => {
    if (!chartRef.current || !trendData) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Get time labels
    const labels = trendData.labels || generateTimeLabels();
    
    // Prepare datasets
    const datasets = [
      {
        label: 'Applications',
        data: trendData.applications,
        borderColor: 'rgb(59, 130, 246)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Approvals',
        data: trendData.approvals,
        borderColor: 'rgb(16, 185, 129)', // Green
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: 'y'
      }
    ];
    
    // Add volume dataset if enabled
    if (showVolume && trendData.volumes) {
      datasets.push({
        label: 'Loan Volume',
        data: trendData.volumes,
        borderColor: 'rgb(245, 158, 11)', // Yellow
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        borderDash: [5, 5],
        fill: false,
        yAxisID: 'y1',
        type: 'line'
      });
    }
    
    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `Performance Trends (${timeframe})`,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.raw;
                
                if (label === 'Loan Volume') {
                  return `${label}: ${formatCurrency(value * 1000000)}`; // Convert to millions for display
                }
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: getTimeframeLabel()
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Count'
            },
            beginAtZero: true
          },
          y1: showVolume ? {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Volume (in Millions)'
            },
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              callback: function(value) {
                return '$' + value + 'M';
              }
            }
          } : undefined
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [trendData, timeframe, showVolume]);
  
  // Get appropriate label for the X-axis based on timeframe
  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'day':
        return 'Hour';
      case 'week':
        return 'Day';
      case 'month':
        return 'Week';
      case 'quarter':
        return 'Month';
      case 'year':
        return 'Month';
      default:
        return 'Time Period';
    }
  };
  
  return (
    <div className="h-80">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

PerformanceTrendChart.propTypes = {
  trendData: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string),
    applications: PropTypes.arrayOf(PropTypes.number).isRequired,
    approvals: PropTypes.arrayOf(PropTypes.number).isRequired,
    volumes: PropTypes.arrayOf(PropTypes.number)
  }).isRequired,
  timeframe: PropTypes.oneOf(['day', 'week', 'month', 'quarter', 'year']),
  showVolume: PropTypes.bool
};

export default PerformanceTrendChart;
