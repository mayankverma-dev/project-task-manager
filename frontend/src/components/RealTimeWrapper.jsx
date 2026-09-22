import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates.js';

export const RealTimeWrapper = ({ children }) => {
  useRealTimeUpdates();
  return children;
};
