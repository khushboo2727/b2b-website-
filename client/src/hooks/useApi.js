import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { setApiContexts } from '../services/apiWithToast';

export const useApi = () => {
  const toast = useToast();
  const loading = useLoading();

  useEffect(() => {
    // Set the contexts for the API service
    setApiContexts(toast, loading);
  }, [toast, loading]);

  return {
    toast,
    loading,
  };
};