import { BrowserRouter } from "react-router-dom";
import Router from "./routes";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

function App() {
  return (
    <BrowserRouter>
      <Router />
      <PWAInstallPrompt />
    </BrowserRouter>
  );
}

export default App;
