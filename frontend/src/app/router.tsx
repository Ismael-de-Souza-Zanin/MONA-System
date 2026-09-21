import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { RequireAuth } from './RequireAuth'
import { RequirePermission, RequirePermissionRedirect } from './RequirePermission'
import { LoginPage } from '../features/auth/LoginPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { ClientsPage } from '../features/clients/ClientsPage'
import { ClientDetailPage } from '../features/clients/ClientDetailPage'
import { EmployeesPage } from '../features/employees/EmployeesPage'
import { EmployeeSummaryPage } from '../features/employees/EmployeeSummaryPage'
import { PyramidPage } from '../features/pyramid/PyramidPage'
import { FinancePage } from '../features/finance/FinancePage'
import { PartnersPage } from '../features/partners/PartnersPage'
import { ServicesPage } from '../features/services/ServicesPage'
import { ContractsPage } from '../features/contracts/ContractsPage'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { AgendaPage } from '../features/agenda/AgendaPage'
import { EmailsPage } from '../features/emails/EmailsPage'
import { WhatsAppPage } from '../features/whatsapp/WhatsAppPage'
import { ChatPage } from '../features/chat/ChatPage'
import { NotificationsPage } from '../features/notifications/NotificationsPage'
import { OperationsPage } from '../features/operations/OperationsPage'
import {
  SopsListPage,
  SopDetailPage,
  SopFormPage,
} from '../features/sops/SopsPages'
import { AppsPage } from '../features/apps/AppsPage'
import { TodosPage } from '../features/todos/TodosPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { ShareLinksPage } from '../features/share/ShareLinksPage'
import { FaqsPage } from '../features/faqs/FaqsPage'
import { ContractorPortalPage } from '../features/portal/ContractorPortalPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { MorePage } from '../features/more/MorePage'
import { LandingPage } from '../features/landing/LandingPage'
import { Permissions } from '../shared/permissions/constants'

export function AppRouter() {
  // Electron empacota via file:// — HashRouter evita rotas quebradas no .exe.
  // Web e `npm run dev` (Vite) seguem com BrowserRouter.
  const Router = import.meta.env.VITE_DESKTOP === '1' ? HashRouter : BrowserRouter

  return (
    <Router>
      <Routes>
        <Route path="/conheca" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/s/:token" element={<ContractorPortalPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />

            <Route element={<RequirePermission permission={Permissions.Dashboard} />}>
              <Route path="operacao" element={<OperationsPage />} />
              <Route path="relatorios" element={<ReportsPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.ClientsRead} />}>
              <Route path="clientes" element={<ClientsPage />} />
              <Route path="clientes/:id" element={<ClientDetailPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.EmployeesRead} />}>
              <Route path="prestadores" element={<EmployeesPage />} />
              <Route path="prestadores/:id" element={<EmployeeSummaryPage />} />
            </Route>

            <Route element={<RequirePermissionRedirect permission={Permissions.PyramidView} />}>
              <Route path="piramide" element={<PyramidPage />} />
            </Route>

            <Route element={<RequirePermission permission={[Permissions.FinanceOwn, Permissions.FinanceAll]} />}>
              <Route path="financeiro" element={<FinancePage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.PartnersRead} />}>
              <Route path="parceiras" element={<PartnersPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.ServicesRead} />}>
              <Route path="servicos" element={<ServicesPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.ContractsRead} />}>
              <Route path="contratos" element={<ContractsPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.OnboardingRead} />}>
              <Route path="onboarding" element={<OnboardingPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.AgendaRead} />}>
              <Route path="agenda" element={<AgendaPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.EmailsRead} />}>
              <Route path="emails" element={<EmailsPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.ClientsRead} />}>
              <Route path="whatsapp" element={<WhatsAppPage />} />
            </Route>

            <Route path="chat" element={<ChatPage />} />
            <Route path="notificacoes" element={<NotificationsPage />} />

            <Route element={<RequirePermission permission={Permissions.SopsRead} />}>
              <Route path="sops" element={<SopsListPage />} />
              <Route path="sops/nova" element={<SopFormPage />} />
              <Route path="sops/:id" element={<SopDetailPage />} />
              <Route path="sops/:id/editar" element={<SopFormPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.AppsRead} />}>
              <Route path="apps" element={<AppsPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.TodosRead} />}>
              <Route path="todos" element={<TodosPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.ShareLinks} />}>
              <Route path="compartilhar" element={<ShareLinksPage />} />
            </Route>

            <Route element={<RequirePermission permission={Permissions.Settings} />}>
              <Route path="configuracoes" element={<SettingsPage />} />
            </Route>

            <Route path="faqs" element={<FaqsPage />} />
            <Route path="mais" element={<MorePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
