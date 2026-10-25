import React from 'react';
import { ParentHomeFeeSummary, ParentHomeFeeSummaryProps } from './ParentHomeFeeSummary';

export const ParentFeesView: React.FC<ParentHomeFeeSummaryProps> = (props) => {
  return <ParentHomeFeeSummary {...props} />;
};

export default ParentFeesView;
