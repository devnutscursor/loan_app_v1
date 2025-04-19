import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Chart from 'chart.js/auto';

/**
 * Loan Distribution Chart Component
 * 
 * Visualizes the distribution of loans by type, providing both
 * donut chart and percentage breakdown for each loan category.
 */
const LoanDistributionChart = ({ distributionData, title = 'Loan Type Distribution' }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Color palette for chart segments
  const colorPalette = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(14, 165, 233, 0.8)',   // Light Blue
    'rgba(249, 115, 22, 0.8)',   // Orange
    'rgba(168, 85, 247, 0.8)'    // Indigo
  ];
  
  // Border colors (slightly darker than fill colors)
  const borderPalette = [
    'rgba(29, 78, 216, 1)',      // Darker Blue
    'rgba(4, 120, 87, 1)',       // Darker Green
    'rgba(109, 40, 217, 1)',     // Darker Purple
    'rgba(180, 83, 9, 1)',       // Darker Yellow
    'rgba(190, 24, 93, 1)',      // Darker Pink
    'rgba(3, 105, 161, 1)',      // Darker Light Blue
    'rgba(194, 65, 12, 1)',      // Darker Orange
    'rgba(126, 34, 206, 1)'      // Darker Indigo
  ];
  
  useEffect(() => {
    if (!chartRef.current || !distributionData || distributionData.length === 0) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Prepare chart data
    const labels = distributionData.map(item => item.type);
    const data = distributionData.map(item => item.percentage);
    const counts = distributionData.map(item => item.count);
    
    // Ensure we have enough colors for all loan types
    const backgroundColor = labels.map((_, i) => colorPalette[i % colorPalette.length]);
    const borderColor = labels.map((_, i) => borderPalette[i % borderPalette.length]);
    
    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 1,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw;
                const count = counts[context.dataIndex];
                return [
                  `${label}: ${value}%`,
                  `Count: ${count} loans`
                ];
              }
            }
          }
        },
        // Add center text plugin
        layout: {
          padding: 10
        }
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: function(chart) {
          if (chart.config.type !== 'doughnut') return;
          
          const width = chart.width;
          const height = chart.height;
          const ctx = chart.ctx;
          
          ctx.restore();
          
          // Total count of all loans
          const totalCount = counts.reduce((sum, count) => sum + count, 0);
          
          // Font settings
          const fontSize = (height / 200).toFixed(2);
          ctx.font = `${fontSize}em sans-serif`;
          ctx.textBaseline = 'middle';
          
          // Draw total loans text
          const text = `${totalCount}`;
          const textLabel = 'Total Loans';
          
          // Calculate text width for centering
          const textX = Math.round((width - ctx.measureText(text).width) / 2);
          const textLabelX = Math.round((width - ctx.measureText(textLabel).width) / 2);
          
          // Draw main number
          ctx.fillStyle = '#111827';
          ctx.fillText(text, textX, height / 2 - 10);
          
          // Draw label underneath
          ctx.font = `${fontSize * 0.6}em sans-serif`;
          ctx.fillStyle = '#6B7280';
          ctx.fillText(textLabel, textLabelX, height / 2 + 15);
          
          ctx.save();
        }
      }]
    });
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [distributionData, title]);
  
  return (
    <div className="h-80">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

LoanDistributionChart.propTypes = {
  distributionData: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      percentage: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired,
  title: PropTypes.string
};

export default LoanDistributionChart;
