import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import { PieChart as PieChartIcon } from '@mui/icons-material';
import { colorPalette } from '../../../../utils/theme';

interface PieChartProps {
  properties: Record<string, unknown>;
}

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

// Dummy data for the pie chart
const dummyData: DataPoint[] = [
  { label: 'Contract Reviews', value: 35, color: colorPalette.nordic.sky },
  { label: 'Legal Research', value: 25, color: colorPalette.nordic.forest },
  { label: 'Client Meetings', value: 20, color: colorPalette.nordic.sun },
  { label: 'Documentation', value: 15, color: colorPalette.nordic.ice },
  { label: 'Other Tasks', value: 5, color: colorPalette.nordic.aurora },
];

const PieChart: React.FC<PieChartProps> = () => {
  
  // Calculate angles for each slice
  const total = dummyData.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const slices = dummyData.map((item) => {
    const sliceAngle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += sliceAngle;
    
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      percentage: Math.round((item.value / total) * 100),
    };
  });

  // Create SVG path for each slice
  const createSlicePath = (startAngle: number, endAngle: number, radius: number) => {
    const centerX = 120;
    const centerY = 120;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <Card sx={{ 
      maxWidth: 600, 
      margin: 'auto',
      backgroundColor: colorPalette.surface.primary,
      border: `0.5px solid ${colorPalette.border.primary}`,
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PieChartIcon sx={{ 
            mr: 1, 
            color: colorPalette.nordic.sky,
            fontSize: 24,
          }} />
          <Typography 
            variant="h6" 
            sx={{ 
              color: colorPalette.text.primary,
              fontWeight: 600,
            }}
          >
            Legal Department Activity Distribution
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Pie Chart SVG */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 240,
          }}>
            <svg width="240" height="240" viewBox="0 0 240 240">
              {slices.map((slice) => (
                <g key={slice.label}>
                  <path
                    d={createSlicePath(slice.startAngle, slice.endAngle, 100)}
                    fill={slice.color}
                    stroke={colorPalette.surface.primary}
                    strokeWidth={2}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(46, 52, 64, 0.08))',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(46, 52, 64, 0.12))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(46, 52, 64, 0.08))';
                    }}
                  />
                  {/* Percentage labels */}
                  {slice.percentage >= 8 && (
                    <text
                      x={120 + 60 * Math.cos(((slice.startAngle + slice.endAngle) / 2) * Math.PI / 180)}
                      y={120 + 60 * Math.sin(((slice.startAngle + slice.endAngle) / 2) * Math.PI / 180)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colorPalette.text.inverse}
                      fontSize="12"
                      fontWeight="600"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      {slice.percentage}%
                    </text>
                  )}
                </g>
              ))}
              {/* Center circle for donut effect */}
              <circle
                cx="120"
                cy="120"
                r="30"
                fill={colorPalette.surface.primary}
                stroke={colorPalette.border.primary}
                strokeWidth={1}
              />
              <text
                x="120"
                y="115"
                textAnchor="middle"
                fill={colorPalette.text.secondary}
                fontSize="11"
                fontWeight="500"
              >
                Total
              </text>
              <text
                x="120"
                y="130"
                textAnchor="middle"
                fill={colorPalette.text.primary}
                fontSize="14"
                fontWeight="600"
              >
                {total}h
              </text>
            </svg>
          </Box>

          {/* Legend */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1.5,
            mt: { xs: 2, md: 0 },
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: colorPalette.text.secondary,
                fontWeight: 600,
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem',
              }}
            >
              Activity Breakdown
            </Typography>
            {slices.map((slice) => (
              <Box 
                key={slice.label}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: colorPalette.surface.tertiary,
                  border: `0.5px solid ${colorPalette.border.accent}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: colorPalette.surface.secondary,
                    border: `0.5px solid ${colorPalette.border.secondary}`,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: slice.color,
                    mr: 2,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: colorPalette.text.primary,
                      fontWeight: 500,
                      lineHeight: 1.2,
                    }}
                  >
                    {slice.label}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: colorPalette.text.muted,
                      fontSize: '0.75rem',
                    }}
                  >
                    {slice.value} hours
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: colorPalette.text.primary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {slice.percentage}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: `0.5px solid ${colorPalette.border.accent}` }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: colorPalette.text.muted,
              textAlign: 'center',
              display: 'block',
            }}
          >
            Weekly activity distribution for the legal department
          </Typography>
        </Box>
      </CardContent>


    </Card>
  );
};

export default PieChart;
