import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store.js';
import { AppRoutes } from './routes/index.jsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/queryClient.js';
import { Toaster } from 'sonner';

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
