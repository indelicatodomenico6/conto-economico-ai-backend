import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PlusCircle, 
  BarChart3, 
  Calculator, 
  FileText, 
  TrendingUp,
  Building,
  Crown
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const mainActions = [
    {
      title: 'Inserisci dati mensili',
      description: 'Aggiungi i ricavi e costi del mese per calcolare automaticamente l\'utile netto',
      icon: PlusCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => navigate('/data-entry'),
    },
    {
      title: 'Visualizza dashboard',
      description: 'Analizza i tuoi KPI, grafici e l\'andamento finanziario della tua attività',
      icon: BarChart3,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => navigate('/analytics'),
    },
    {
      title: 'Simulatore "E se..."',
      description: 'Simula scenari diversi modificando ricavi e costi per prevedere i risultati',
      icon: Calculator,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => navigate('/simulator'),
      disabled: user?.subscription_plan === 'free',
    },
    {
      title: 'Esporta PDF',
      description: 'Genera e invia via email un report completo con tabelle e grafici',
      icon: FileText,
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => navigate('/export'),
      disabled: user?.subscription_plan === 'free',
    },
  ];

  const getPlanBadge = (plan) => {
    const badges = {
      free: { text: 'GRATUITO', color: 'bg-gray-100 text-gray-800' },
      pro: { text: 'PRO', color: 'bg-blue-100 text-blue-800' },
      premium: { text: 'PREMIUM', color: 'bg-purple-100 text-purple-800' },
    };
    return badges[plan] || badges.free;
  };

  const planBadge = getPlanBadge(user?.subscription_plan);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Benvenuto, {user?.first_name}!
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Gestisci la contabilità di <strong>{user?.business_name || 'la tua attività'}</strong> in modo semplice e professionale
          </p>
          
          {/* Business Info Card */}
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-4">
                <Building className="h-8 w-8 text-gray-500" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{user?.business_name}</p>
                  <p className="text-sm text-gray-600">{user?.business_type}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${planBadge.color}`}>
                  {planBadge.text}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {mainActions.map((action, index) => {
            const Icon = action.icon;
            const isDisabled = action.disabled;
            
            return (
              <Card 
                key={index} 
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  isDisabled ? 'opacity-60' : 'hover:scale-105 cursor-pointer'
                }`}
                onClick={!isDisabled ? action.onClick : undefined}
              >
                {isDisabled && (
                  <div className="absolute top-3 right-3">
                    <Crown className="h-5 w-5 text-yellow-500" />
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${action.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {action.description}
                  </CardDescription>
                  
                  {isDisabled && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <Crown className="h-4 w-4 inline mr-1" />
                        Funzionalità disponibile nei piani Pro e Premium
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      className={`w-full ${action.color} text-white`}
                      disabled={isDisabled}
                    >
                      {isDisabled ? 'Aggiorna Piano' : 'Inizia'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Stato del tuo piano</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {user?.subscription_plan === 'free' ? '3' : '∞'}
                  </p>
                  <p className="text-sm text-gray-600">Mesi di storico</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {user?.subscription_plan === 'free' ? '❌' : '✅'}
                  </p>
                  <p className="text-sm text-gray-600">Export PDF</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {user?.subscription_plan === 'premium' ? '✅' : '❌'}
                  </p>
                  <p className="text-sm text-gray-600">Simulatore Avanzato</p>
                </div>
              </div>
              
              {user?.subscription_plan === 'free' && (
                <div className="mt-6 text-center">
                  <Button 
                    onClick={() => navigate('/subscription')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Aggiorna a Pro o Premium
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

