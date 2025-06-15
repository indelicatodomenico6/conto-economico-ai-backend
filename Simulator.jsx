import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react';

const Simulator = () => {
  const { user, token, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  
  // Dati base attuali (simulati)
  const baseData = {
    ricavi_totali: 27500,
    costi_variabili: 8250,
    costi_fissi: 8000,
    utile_netto: 11250,
    margine_percentuale: 40.91
  };

  const [ricaviIncrease, setRicaviIncrease] = useState([0]);
  const [costiDecrease, setCostiDecrease] = useState([0]);
  const [simulatedData, setSimulatedData] = useState(baseData);
  const [loading, setLoading] = useState(false);

  // Calcola i dati simulati
  useEffect(() => {
    const ricaviIncreasePercent = ricaviIncrease[0];
    const costiDecreasePercent = costiDecrease[0];

    const newRicavi = baseData.ricavi_totali * (1 + ricaviIncreasePercent / 100);
    const newCostiVariabili = baseData.costi_variabili * (1 - costiDecreasePercent / 100);
    const newCostiFissi = baseData.costi_fissi * (1 - costiDecreasePercent / 100);
    const newTotaleCosti = newCostiVariabili + newCostiFissi;
    const newUtileNetto = newRicavi - newTotaleCosti;
    const newMarginePercentuale = newRicavi > 0 ? (newUtileNetto / newRicavi) * 100 : 0;

    setSimulatedData({
      ricavi_totali: newRicavi,
      costi_variabili: newCostiVariabili,
      costi_fissi: newCostiFissi,
      utile_netto: newUtileNetto,
      margine_percentuale: newMarginePercentuale
    });
  }, [ricaviIncrease, costiDecrease]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const getDifference = (current, base) => {
    return current - base;
  };

  const getDifferencePercent = (current, base) => {
    return base !== 0 ? ((current - base) / base) * 100 : 0;
  };

  const resetSimulation = () => {
    setRicaviIncrease([0]);
    setCostiDecrease([0]);
  };

  // Dati per il grafico comparativo
  const comparisonData = [
    {
      name: 'Scenario Attuale',
      ricavi: baseData.ricavi_totali,
      costi: baseData.costi_variabili + baseData.costi_fissi,
      utile: baseData.utile_netto
    },
    {
      name: 'Scenario Simulato',
      ricavi: simulatedData.ricavi_totali,
      costi: simulatedData.costi_variabili + simulatedData.costi_fissi,
      utile: simulatedData.utile_netto
    }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
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
                <Zap className="h-8 w-8 text-yellow-500" />
                <span>Simulatore "E se..."</span>
              </h1>
              <p className="text-gray-600">Testa scenari alternativi per {user?.business_name}</p>
            </div>
          </div>

          <Button
            onClick={resetSimulation}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controlli Simulazione */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Parametri Simulazione</span>
                </CardTitle>
                <CardDescription>
                  Modifica i parametri per vedere l'impatto sui risultati
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Slider Ricavi */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-green-700">
                      Aumenta Ricavi
                    </Label>
                    <span className="text-sm font-bold text-green-700">
                      +{ricaviIncrease[0]}%
                    </span>
                  </div>
                  <Slider
                    value={ricaviIncrease}
                    onValueChange={setRicaviIncrease}
                    max={100}
                    min={-50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+100%</span>
                  </div>
                </div>

                {/* Slider Costi */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-red-700">
                      Riduci Costi
                    </Label>
                    <span className="text-sm font-bold text-red-700">
                      -{costiDecrease[0]}%
                    </span>
                  </div>
                  <Slider
                    value={costiDecrease}
                    onValueChange={setCostiDecrease}
                    max={50}
                    min={-50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>+50%</span>
                    <span>0%</span>
                    <span>-50%</span>
                  </div>
                </div>

                {/* Suggerimenti */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Suggerimento:</strong> Prova diversi scenari per capire quale strategia può massimizzare i tuoi profitti.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Scenario Attuale */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scenario Attuale</CardTitle>
                <CardDescription>
                  Dati del mese corrente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ricavi Totali</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(baseData.ricavi_totali)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Costi Totali</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(baseData.costi_variabili + baseData.costi_fissi)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Utile Netto</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(baseData.utile_netto)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Margine %</span>
                  <span className="font-bold text-blue-600">
                    {formatPercentage(baseData.margine_percentuale)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risultati Simulazione */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPI Simulati */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Utile Netto Simulato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatCurrency(simulatedData.utile_netto)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDifference(simulatedData.utile_netto, baseData.utile_netto) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      getDifference(simulatedData.utile_netto, baseData.utile_netto) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {getDifference(simulatedData.utile_netto, baseData.utile_netto) >= 0 ? '+' : ''}
                      {formatCurrency(getDifference(simulatedData.utile_netto, baseData.utile_netto))}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({getDifferencePercent(simulatedData.utile_netto, baseData.utile_netto) >= 0 ? '+' : ''}
                      {formatPercentage(getDifferencePercent(simulatedData.utile_netto, baseData.utile_netto))})
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Margine % Simulato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {formatPercentage(simulatedData.margine_percentuale)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDifference(simulatedData.margine_percentuale, baseData.margine_percentuale) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      getDifference(simulatedData.margine_percentuale, baseData.margine_percentuale) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {getDifference(simulatedData.margine_percentuale, baseData.margine_percentuale) >= 0 ? '+' : ''}
                      {formatPercentage(getDifference(simulatedData.margine_percentuale, baseData.margine_percentuale))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grafico Comparativo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Confronto Scenari</span>
                </CardTitle>
                <CardDescription>
                  Confronto tra scenario attuale e simulato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `€${value/1000}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), '']}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Legend />
                    <Bar dataKey="ricavi" fill="#3b82f6" name="Ricavi Totali" />
                    <Bar dataKey="costi" fill="#ef4444" name="Costi Totali" />
                    <Bar dataKey="utile" fill="#10b981" name="Utile Netto" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Dettaglio Simulazione */}
            <Card>
              <CardHeader>
                <CardTitle>Dettaglio Simulazione</CardTitle>
                <CardDescription>
                  Confronto dettagliato tra scenario attuale e simulato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Voce</th>
                        <th className="text-right p-2">Attuale</th>
                        <th className="text-right p-2">Simulato</th>
                        <th className="text-right p-2">Differenza</th>
                        <th className="text-right p-2">Variazione %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">Ricavi Totali</td>
                        <td className="p-2 text-right">{formatCurrency(baseData.ricavi_totali)}</td>
                        <td className="p-2 text-right">{formatCurrency(simulatedData.ricavi_totali)}</td>
                        <td className={`p-2 text-right font-medium ${
                          getDifference(simulatedData.ricavi_totali, baseData.ricavi_totali) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {getDifference(simulatedData.ricavi_totali, baseData.ricavi_totali) >= 0 ? '+' : ''}
                          {formatCurrency(getDifference(simulatedData.ricavi_totali, baseData.ricavi_totali))}
                        </td>
                        <td className={`p-2 text-right font-medium ${
                          getDifferencePercent(simulatedData.ricavi_totali, baseData.ricavi_totali) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {getDifferencePercent(simulatedData.ricavi_totali, baseData.ricavi_totali) >= 0 ? '+' : ''}
                          {formatPercentage(getDifferencePercent(simulatedData.ricavi_totali, baseData.ricavi_totali))}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">Costi Totali</td>
                        <td className="p-2 text-right">{formatCurrency(baseData.costi_variabili + baseData.costi_fissi)}</td>
                        <td className="p-2 text-right">{formatCurrency(simulatedData.costi_variabili + simulatedData.costi_fissi)}</td>
                        <td className={`p-2 text-right font-medium ${
                          getDifference(simulatedData.costi_variabili + simulatedData.costi_fissi, baseData.costi_variabili + baseData.costi_fissi) <= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {getDifference(simulatedData.costi_variabili + simulatedData.costi_fissi, baseData.costi_variabili + baseData.costi_fissi) >= 0 ? '+' : ''}
                          {formatCurrency(getDifference(simulatedData.costi_variabili + simulatedData.costi_fissi, baseData.costi_variabili + baseData.costi_fissi))}
                        </td>
                        <td className={`p-2 text-right font-medium ${
                          getDifferencePercent(simulatedData.costi_variabili + simulatedData.costi_fissi, baseData.costi_variabili + baseData.costi_fissi) <= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {getDifferencePercent(simulatedData.costi_variabili + simulatedData.costi_fissi, baseData.costi_variabili + baseData.costi_fissi) >= 0 ? '+' : ''}
                          {formatPercentage(getDifferencePercent(simulatedData.costi_variabili + simulatedData.costi_fissi, baseData.costi_variabili + baseData.costi_fissi))}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50 bg-blue-50">
                        <td className="p-2 font-bold">Utile Netto</td>
                        <td className="p-2 text-right font-bold">{formatCurrency(baseData.utile_netto)}</td>
                        <td className="p-2 text-right font-bold">{formatCurrency(simulatedData.utile_netto)}</td>
                        <td className={`p-2 text-right font-bold ${
                          getDifference(simulatedData.utile_netto, baseData.utile_netto) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {getDifference(simulatedData.utile_netto, baseData.utile_netto) >= 0 ? '+' : ''}
                          {formatCurrency(getDifference(simulatedData.utile_netto, baseData.utile_netto))}
                        </td>
                        <td className={`p-2 text-right font-bold ${
                          getDifferencePercent(simulatedData.utile_netto, baseData.utile_netto) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {getDifferencePercent(simulatedData.utile_netto, baseData.utile_netto) >= 0 ? '+' : ''}
                          {formatPercentage(getDifferencePercent(simulatedData.utile_netto, baseData.utile_netto))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Simulator;

