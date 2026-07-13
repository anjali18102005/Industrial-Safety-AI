import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';
import Overview from '@/pages/overview';
import Hazards from '@/pages/hazards';
import HazardDetail from '@/pages/hazard-detail';
import Zones from '@/pages/zones';
import Sensors from '@/pages/sensors';
import Engines from '@/pages/engines';
import Activity from '@/pages/activity';
import Login from '@/pages/login';
import { AuthProvider, useAuth } from '@/lib/auth';

const queryClient = new QueryClient();

function AuthenticatedApp() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/hazards" component={Hazards} />
        <Route path="/hazards/:id" component={HazardDetail} />
        <Route path="/zones" component={Zones} />
        <Route path="/sensors" component={Sensors} />
        <Route path="/engines" component={Engines} />
        <Route path="/activity" component={Activity} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
