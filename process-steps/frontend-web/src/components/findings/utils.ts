import { Finding, FindingType } from './components/FindingsPane';

// Calculate finding counts by type
export const calculateFindingCounts = (findings: Finding[]): Record<FindingType, number> => {
  return findings.reduce((acc, finding) => {
    acc[finding.type] = (acc[finding.type] || 0) + 1;
    return acc;
  }, {} as Record<FindingType, number>);
}; 