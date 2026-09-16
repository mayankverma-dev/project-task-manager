import { useContext } from 'react';
import { WebSocketContext } from '../context/WebSocketContext.jsx';

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
