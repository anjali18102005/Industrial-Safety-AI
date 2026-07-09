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
import Activity from '@/pages/activity';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/hazards" component={Hazards} />
        <Route path="/hazards/:id" component={HazardDetail} />
        <Route path="/zones" component={Zones} />
        <Route path="/sensors" component={Sensors} />
        <Route path="/activity" component={Activity} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
