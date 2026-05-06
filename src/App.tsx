import { Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { CoursePage } from './pages/CoursePage';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentError } from './pages/PaymentError';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/cours/:slug" element={<CoursePage />} />
      <Route path="/paiement/succes" element={<PaymentSuccess />} />
      <Route path="/paiement/erreur" element={<PaymentError />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
