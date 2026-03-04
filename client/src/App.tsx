import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Rank from "./pages/Rank";
import Destiny from "./pages/Destiny";
import Daily from "./pages/Daily";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import LanternRiddle from "./pages/LanternRiddle";
import V2Map from "./pages/V2Map";
import V2Stage from "./pages/V2Stage";
import V2Cards from "./pages/V2Cards";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game" component={Game} />
      <Route path="/rank" component={Rank} />
      <Route path="/destiny" component={Destiny} />
      <Route path="/daily" component={Daily} />
      <Route path="/profile" component={Profile} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/lantern-riddle" component={LanternRiddle} />
      <Route path="/v2" component={V2Map} />
      <Route path="/v2/stage/:stageId" component={V2Stage} />
      <Route path="/v2/cards" component={V2Cards} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
