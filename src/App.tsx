import { BrowserRouter } from 'react-router-dom';
import Router from './routes';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import DevHelper from './components/DevHelper';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <ErrorBoundary>
      <DevHelper />
      <BrowserRouter>
        <Router />
        <PWAInstallPrompt />
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
