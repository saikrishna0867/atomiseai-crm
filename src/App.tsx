import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ContactsPage from "@/pages/ContactsPage";
import ContactDetailPage from "@/pages/ContactDetailPage";
import PipelinePage from "@/pages/PipelinePage";
import TasksPage from "@/pages/TasksPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import CampaignsPage from "@/pages/CampaignsPage";
import AISummariesPage from "@/pages/AISummariesPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _forceRebuild = 1;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppSettingsProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/contacts/:leadId" element={<ContactDetailPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/ai-summaries" element={<AISummariesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AppSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
