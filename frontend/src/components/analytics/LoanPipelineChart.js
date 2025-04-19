import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Chart from 'chart.js/auto';

/**
 * Loan Pipeline Chart Component
 * 
 * Visualizes the loan application pipeline showing the number of applications
 * and total amounts at each stage of the process.
 */
const LoanPipelineChart = ({ pipelineData, timeframe = 'month' }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Format currency for axis labels and tooltips
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  useEffect(() => {
    if (!chartRef.current || !pipelineData || pipelineData.length === 0) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Prepare chart data
    const labels = pipelineData.map(item => item.stage);
    const counts = pipelineData.map(item => item.count);
    const amounts = pipelineData.map(item => item.amount);
    
    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Number of Applications',
            data: counts,
            backgroundColor: 'rgba(59, 130, 246, 0.7)', // Blue
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            label: 'Total Amount ($)',
            data: amounts,
            backgroundColor: 'rgba(16, 185, 129, 0.7)', // Green
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            borderRadius: 4,
            type: 'bar',
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `Loan Pipeline Overview (${timeframe})`,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.raw;
                if (label.includes('Amount')) {
                  return `${label}: ${formatCurrency(value)}`;
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
              text: 'Pipeline Stage'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Number of Applications'
            },
            grid: {
              drawOnChartArea: false,
            },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Total Amount ($)'
            },
            grid: {
              drawOnChartArea: false,
            },
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000000) {
                  return '$' + (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return '$' + (value / 1000).toFixed(0) + 'K';
                }
                return '$' + value;
              }
            }
          }
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [pipelineData, timeframe]);
  
  return (
    <div className="h-80">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

LoanPipelineChart.propTypes = {
  pipelineData: PropTypes.arrayOf(
    PropTypes.shape({
      stage: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
      amount: PropTypes.number.isRequired
    })
  ).isRequired,
  timeframe: PropTypes.oneOf(['day', 'week', 'month', 'quarter', 'year'])
};

export default LoanPipelineChart;
