import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { axiosInstance } from '../../../api/axiosInstance.js';
import { setCredentials, setInitialized } from '../authSlice.js';

export const useAuthInit = () => {
  const dispatch = useDispatch();
  const isInitialized = useSelector((state) => state.auth.isInitialized);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const response = await axiosInstance.post('/auth/refresh');
        const { user, accessToken } = response.data.data;
        if (isMounted) {
          dispatch(setCredentials({ user, accessToken }));
        }
      } catch (error) {
        if (isMounted) {
          dispatch(setInitialized());
        }
      }
    };

    if (!isInitialized) {
      initAuth();
    }
  }, [dispatch, isInitialized]);

  return isInitialized;
};
