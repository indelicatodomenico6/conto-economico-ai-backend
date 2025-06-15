import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Star, 
  Zap,
  Check,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Calendar,
  Settings,
  ExternalLink
} from 'lucide-react';

const Subscription = () => {
  const { user, token, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [plans, setPlans] = useState({});
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    loadPlansAndSubscription();
    
    // Gestisci i parametri URL per success/cancel
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      setMessage('Abbonamento attivato con successo!');
      setMessageType('success');
    } else if (canceled === 'true') {
      setMessage('Pagamento annullato. Puoi riprovare quando vuoi.');
      setMessageType('info');
    }
  }, [searchParams]);

  const loadPlansAndSubscription = async () => {
    try {
      // Carica i piani
      const plansResponse = await fetch(`${API_BASE_URL}/api/stripe/plans`);
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.plans);
      }

      // Carica lo stato dell'abbonamento
      const subResponse = await fetch(`${API_BASE_URL}/api/stripe/subscription-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setCurrentSubscription(subData);
      }
    } catch (error) {
      console.error('Errore nel caricamento:', error);
      setMessage('Errore nel caricamento dei dati');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planKey) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planKey })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkout_url;
      } else {
        const error = await response.json();
        setMessage(error.error || 'Errore nella creazione del checkout');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Errore:', error);
      setMessage('Errore di connessione');
      setMessageType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.portal_url, '_blank');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Errore nell\'apertura del portale');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Errore:', error);
      setMessage('Errore di connessione');
      setMessageType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getPlanIcon = (planKey) => {
    switch (planKey) {
      case 'free':
        return <Star className="h-6 w-6" />;
      case 'pro':
        return <Zap className="h-6 w-6" />;
      case 'premium':
        return <Crown className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planKey) => {
    switch (planKey) {
      case 'free':
        return 'text-gray-600';
      case 'pro':
        return 'text-blue-600';
      case 'premium':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeVariant = (planKey) => {
    switch (planKey) {
      case 'free':
        return 'secondary';
      case 'pro':
        return 'default';
      case 'premium':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Torna alla Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <span>Gestione Abbonamento</span>
              </h1>
              <p className="text-gray-600">Gestisci il tuo piano e le funzionalità</p>
            </div>
          </div>
        </div>

        {message && (
          <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
            {messageType === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Stato Abbonamento Attuale */}
        {currentSubscription && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Abbonamento Attuale</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <div className={getPlanColor(currentSubscription.plan)}>
                    {getPlanIcon(currentSubscription.plan)}
                  </div>
                  <div>
                    <p className="font-medium">Piano Attuale</p>
                    <Badge variant={getBadgeVariant(currentSubscription.plan)}>
                      {plans[currentSubscription.plan]?.name || currentSubscription.plan}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Stato</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {currentSubscription.status === 'active' ? 'Attivo' : currentSubscription.status}
                    </p>
                  </div>
                </div>

                {currentSubscription.current_period_end && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Rinnovo</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(currentSubscription.current_period_end)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {currentSubscription.plan !== 'free' && currentSubscription.stripe_customer_id && (
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={handleManageSubscription}
                    disabled={actionLoading}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Gestisci Abbonamento</span>
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Modifica metodo di pagamento, visualizza fatture o cancella l'abbonamento
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Piani Disponibili */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Piani Disponibili</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(plans).map(([planKey, plan]) => (
              <Card 
                key={planKey} 
                className={`relative ${
                  currentSubscription?.plan === planKey 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : ''
                }`}
              >
                {currentSubscription?.plan === planKey && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="bg-blue-600">
                      Piano Attuale
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div className={`mx-auto mb-4 ${getPlanColor(planKey)}`}>
                    {getPlanIcon(planKey)}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-gray-900">
                      €{plan.price}
                    </span>
                    {plan.price > 0 && <span className="text-gray-600">/mese</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {currentSubscription?.plan !== planKey && planKey !== 'free' && (
                    <Button
                      onClick={() => handleUpgrade(planKey)}
                      disabled={actionLoading}
                      className="w-full"
                      variant={planKey === 'premium' ? 'default' : 'outline'}
                    >
                      {actionLoading ? 'Caricamento...' : `Passa a ${plan.name}`}
                    </Button>
                  )}

                  {planKey === 'free' && currentSubscription?.plan !== 'free' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Downgrade tramite Gestione
                    </Button>
                  )}

                  {currentSubscription?.plan === planKey && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      disabled
                    >
                      Piano Attuale
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Informazioni Aggiuntive */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni sui Piani</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Pagamenti Sicuri</h4>
                <p className="text-sm text-gray-600">
                  Tutti i pagamenti sono elaborati in modo sicuro tramite Stripe. 
                  Non memorizziamo i dati della tua carta di credito.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cancellazione</h4>
                <p className="text-sm text-gray-600">
                  Puoi cancellare il tuo abbonamento in qualsiasi momento. 
                  Continuerai ad avere accesso alle funzionalità fino alla fine del periodo pagato.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Supporto</h4>
                <p className="text-sm text-gray-600">
                  Il nostro team di supporto è disponibile per aiutarti con qualsiasi domanda 
                  sui piani o sulla fatturazione.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Aggiornamenti</h4>
                <p className="text-sm text-gray-600">
                  Puoi aggiornare o declassare il tuo piano in qualsiasi momento. 
                  Le modifiche avranno effetto nel prossimo ciclo di fatturazione.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Subscription;

