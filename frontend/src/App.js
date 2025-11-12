import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages d'authentification
import LoginPage from './pages/login';
import RegisterPage from './pages/register';

// Dashboards
import AdminDashboard from './pages/admin/dashboard';
import CreateUser from './pages/admin/CreateUser';
import UsersList from './pages/admin/UsersList';
import EditUser from './pages/admin/EditUser';
import ClinicsList from './pages/admin/ClinicsList';
import CreateClinic from './pages/admin/CreateClinic';
import EditClinic from './pages/admin/EditClinic';
import ServicesList from './pages/admin/ServicesList';
import CreateService from './pages/admin/CreateService';
import EditService from './pages/admin/EditService';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import DoctorDashboard from './pages/doctor/dashboard';
import ReceptionistDashboard from './pages/receptionist/dashboard';
import ReceptionistPatientsList from './pages/receptionist/patients-list';
import ReceptionistPatientDetail from './pages/receptionist/patient-detail';
import PatientDashboard from './pages/patient/dashboard';

// Appointments
import AppointmentsList from './pages/appointments/index';
import AppointmentNew from './pages/appointments/AppointmentNew';
import AppointmentEdit from './pages/appointments/AppointmentEdit';
import AppointmentDetail from './pages/appointments/AppointmentDetail';

// Patients
import PatientNew from './pages/patients/PatientNew';

// Messagerie
import MessagingPage from './pages/messaging/index';
import ConversationDetail from './pages/messaging/ConversationDetail';
import NewConversation from './pages/messaging/NewConversation';


// Composants
import Layout from './components/Layout';

// Utilitaires
import { isAuthenticated, getUser } from './utils/auth';

/**
 * Composant ProtectedRoute pour protéger les routes authentifiées
 */
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * Composant AdminRoute pour protéger les routes admin
 */
const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();
  if (user?.user_type !== 'admin') {
    // Rediriger vers le dashboard approprié selon le rôle
    const dashboardPaths = {
      doctor: '/doctor/dashboard',
      receptionist: '/receptionist/dashboard',
      patient: '/patient/dashboard',
    };
    return <Navigate to={dashboardPaths[user?.user_type] || '/login'} replace />;
  }

  return children;
};

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Vérifier l'authentification au chargement
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <div>Chargement...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Routes protégées - Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/create-user"
          element={
            <AdminRoute>
              <Layout>
                <CreateUser />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users-list"
          element={
            <AdminRoute>
              <Layout>
                <UsersList />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users/:userId/edit"
          element={
            <AdminRoute>
              <Layout>
                <EditUser />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/clinics-list"
          element={
            <AdminRoute>
              <Layout>
                <ClinicsList />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/edit-clinic/:clinicId"
          element={
            <AdminRoute>
              <Layout>
                <EditClinic />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/create-clinic"
          element={
            <AdminRoute>
              <Layout>
                <CreateClinic />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/services-list"
          element={
            <AdminRoute>
              <Layout>
                <ServicesList />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/services/create"
          element={
            <AdminRoute>
              <Layout>
                <CreateService />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/services/:serviceId/edit"
          element={
            <AdminRoute>
              <Layout>
                <EditService />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <Layout>
                <Reports />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <Layout>
                <Settings />
              </Layout>
            </AdminRoute>
          }
        />

        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DoctorDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <ReceptionistDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/patients-list"
          element={
            <ProtectedRoute>
              <Layout>
                <ReceptionistPatientsList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/patients/:patientId"
          element={
            <ProtectedRoute>
              <Layout>
                <ReceptionistPatientDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <PatientDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Routes Rendez-vous */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Layout>
                <AppointmentsList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/new"
          element={
            <ProtectedRoute>
              <Layout>
                <AppointmentNew />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <AppointmentDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Routes Patients */}
        <Route
          path="/patients/new"
          element={
            <ProtectedRoute>
              <Layout>
                <PatientNew />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <AppointmentEdit />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Messagerie */}
        <Route
          path="/messaging"
          element={
            <ProtectedRoute>
              <Layout>
                <MessagingPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/messaging/new"
          element={
            <ProtectedRoute>
              <Layout>
                <NewConversation />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/messaging/:conversationId"
          element={
            <ProtectedRoute>
              <Layout>
                <ConversationDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Route dashboard générale - redirige selon le rôle */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {(() => {
                const user = getUser();
                if (!user) return <Navigate to="/login" replace />;

                const dashboardPaths = {
                  admin: '/admin/dashboard',
                  doctor: '/doctor/dashboard',
                  receptionist: '/receptionist/dashboard',
                  patient: '/patient/dashboard',
                };

                return <Navigate to={dashboardPaths[user.user_type] || '/login'} replace />;
              })()}
            </ProtectedRoute>
          }
        />

        {/* Redirection par défaut */}
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Route 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
