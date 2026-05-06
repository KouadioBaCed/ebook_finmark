import { useNavigate, useSearchParams } from 'react-router-dom';

export function PaymentError() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const course = params.get('course');

  return (
    <div className="page">
      <div className="page-icon page-icon-err">✕</div>
      <h1 className="page-h">Paiement non finalisé</h1>
      <p className="page-p">
        Le paiement {course ? `pour la formation ${course} ` : ''}n'a pas pu être finalisé.
        Aucun montant n'a été débité. Vous pouvez réessayer ou choisir un autre moyen de paiement.
      </p>
      <button className="page-btn" onClick={() => navigate('/')}>← Réessayer</button>
    </div>
  );
}
