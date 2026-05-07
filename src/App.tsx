import { Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { CoursePage } from './pages/CoursePage';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentError } from './pages/PaymentError';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccountPage } from './pages/AccountPage';
import { ParcoursPage } from './pages/ParcoursPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/cours/:slug" element={<CoursePage />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<RegisterPage />} />
      <Route path="/mon-compte" element={<AccountPage />} />
      <Route path="/parcours" element={<ParcoursPage />} />
      <Route path="/paiement/succes" element={<PaymentSuccess />} />
      <Route path="/paiement/erreur" element={<PaymentError />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
