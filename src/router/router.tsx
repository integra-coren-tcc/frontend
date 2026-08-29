import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { DefaultLayout } from '../layouts/DefaultLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'

// Pages
import Login from '../pages/Login/Login'
import AdminDashboard from '../pages/AdminDashboard/AdminDashboard'
import FiscalDashboard from '../pages/FiscalDashboard/FiscalDashboard'
import RTDashboard from '../pages/RTDashboard/RTDashboard'
import InspectionHistory from '../pages/rt/InspectionHistory'
import InspectionHistoryDetail from '../pages/rt/InspectionHistoryDetail'
import Profile from '../pages/Profile/Profile'
import InstitutionManagement from '../pages/InstitutionManagementAdmin/InstitutionManagement'
import FiscalManagement from '../pages/FiscalManagementAdmin/FiscalManagement'
import RTManagement from '../pages/RTManagementAdmin/RTManagement'
import NewInstitution from '../pages/NewInstitutionAdmin/NewInstitution'
import EditInstitution from '../pages/EditInstitutionAdmin/EditInstitution'
import NewFiscal from '../pages/NewFiscalAdmin/NewFiscal'
import NewRT from '../pages/NewRTAdmin/NewRT'
import ScheduleFiscalization from '../pages/fiscal/ScheduleFiscalization'
import PendingByInstitution from '../pages/fiscal/PendingByInstitution'
import Goals from '../pages/fiscal/Goals'
import EditFiscalization from '../pages/fiscal/EditFiscalization'
import Checklist from '../pages/ChecklistFiscal/ChecklistFiscal'
import ChecklistRT from '../pages/ChecklistRT/ChecklistRT'
import GeneralReports from '../pages/GeneralReportsAdmin/GeneralReports'

import StandardChecklist from '../pages/StandardChecklist/StandardChecklist'
import NotFound from '../pages/NotFound/NotFound'
import ChangePassword from '../pages/Auth/ChangePassword'

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/change-password',
    element: (
      <ProtectedRoute ignorePasswordChange={true}>
        <ChangePassword />
      </ProtectedRoute>
    ),
  },

  // Protected routes with layout
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      // Admin routes
      {
        path: 'dashboard/admin',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/institutions',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <InstitutionManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/institutions/new',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <NewInstitution />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/institutions/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <EditInstitution />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/fiscals',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <FiscalManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/fiscals/new',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <NewFiscal />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/rts',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <RTManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/rts/new',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <NewRT />
          </ProtectedRoute>
        ),
      },

      // Fiscal routes
      {
        path: 'dashboard/fiscal',
        element: (
          <ProtectedRoute allowedRoles={['INSPECTOR']}>
            <FiscalDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'fiscal/schedule',
        element: (
          <ProtectedRoute allowedRoles={['INSPECTOR']}>
            <ScheduleFiscalization />
          </ProtectedRoute>
        ),
      },
      {
        path: 'fiscal/schedule/:id',
        element: (
          <ProtectedRoute allowedRoles={['INSPECTOR']}>
            <EditFiscalization />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/fiscal/pendencias',
        element: (
          <ProtectedRoute allowedRoles={['INSPECTOR']}>
            <PendingByInstitution />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/fiscal/metas',
        element: (
          <ProtectedRoute allowedRoles={['INSPECTOR']}>
            <Goals />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/standard-checklist',
        element: (
          <ProtectedRoute allowedRoles={['INSPECTOR']}>
            <StandardChecklist />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checklist/:id?',
        element: (
          <ProtectedRoute allowedRoles={['INSPECTOR']}>
            <Checklist />
          </ProtectedRoute>
        ),
      },

      // RT routes
      {
        path: 'dashboard/rt',
        element: (
          <ProtectedRoute allowedRoles={['RT']}>
            <RTDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checklistRT/:id?',
        element: (
          <ProtectedRoute allowedRoles={['RT']}>
            <ChecklistRT />
          </ProtectedRoute>
        ),
      },
      {
        path: 'rt/history',
        element: (
          <ProtectedRoute allowedRoles={['RT']}>
            <InspectionHistory />
          </ProtectedRoute>
        ),
      },
      {
        path: 'rt/history/:id',
        element: (
          <ProtectedRoute allowedRoles={['RT']}>
            <InspectionHistoryDetail />
          </ProtectedRoute>
        ),
      },

      // Reports
      {
        path: 'admin/reports',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <GeneralReports />
          </ProtectedRoute>
        ),
      },


      // Shared routes
      {
        path: 'profile',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'INSPECTOR', 'RT']}>
            <Profile />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <NotFound />,
  },
])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
