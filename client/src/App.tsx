import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// 使用lazy加载非首屏页面，减少初始bundle大小
const Game = lazy(() => import("./pages/Game"));
const Rank = lazy(() => import("./pages/Rank"));
const Destiny = lazy(() => import("./pages/Destiny"));
const Daily = lazy(() => import("./pages/Daily"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LanternRiddle = lazy(() => import("./pages/LanternRiddle"));
const V2Map = lazy(() => import("./pages/V2Map"));
const V2Stage = lazy(() => import("./pages/V2Stage"));
const V2Cards = lazy(() => import("./pages/V2Cards"));

// 加载中的占位符
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <Game />
          </Suspense>
        )}
      </Route>
      <Route path="/rank">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <Rank />
          </Suspense>
        )}
      </Route>
      <Route path="/destiny">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <Destiny />
          </Suspense>
        )}
      </Route>
      <Route path="/daily">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <Daily />
          </Suspense>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        )}
      </Route>
      <Route path="/leaderboard">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <Leaderboard />
          </Suspense>
        )}
      </Route>
      <Route path="/lantern-riddle">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <LanternRiddle />
          </Suspense>
        )}
      </Route>
      <Route path="/v2">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <V2Map />
          </Suspense>
        )}
      </Route>
      <Route path="/v2/stage/:stageId">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <V2Stage />
          </Suspense>
        )}
      </Route>
      <Route path="/v2/cards">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <V2Cards />
          </Suspense>
        )}
      </Route>
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
