import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  Euro, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

const DataEntry = () => {
  const { user, token, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    ricavi_servizi: '',
    ricavi_prodotti: '',
    altri_ricavi: '',
    costo_merci: '',
    provvigioni: '',
    marketing_variabile: '',
    affitto: '',
    stipendi: '',
    utenze: '',
    marketing_fisso: '',
    altri_costi_fissi: '',
  });
  
  const [calculations, setCalculations] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    calculateTotals({ ...formData, [name]: value });
    setError('');
    setSuccess('');
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
  };

  const calculateTotals = (data) => {
    const ricaviServizi = parseFloat(data.ricavi_servizi) || 0;
    const ricaviProdotti = parseFloat(data.ricavi_prodotti) || 0;
    const altriRicavi = parseFloat(data.altri_ricavi) || 0;
    
    const costoMerci = parseFloat(data.costo_merci) || 0;
    const provvigioni = parseFloat(data.provvigioni) || 0;
    const marketingVariabile = parseFloat(data.marketing_variabile) || 0;
    
    const affitto = parseFloat(data.affitto) || 0;
    const stipendi = parseFloat(data.stipendi) || 0;
    const utenze = parseFloat(data.utenze) || 0;
    const marketingFisso = parseFloat(data.marketing_fisso) || 0;
    const altriCostiFissi = parseFloat(data.altri_costi_fissi) || 0;

    const ricaviTotali = ricaviServizi + ricaviProdotti + altriRicavi;
    const costiVariabili = costoMerci + provvigioni + marketingVariabile;
    const costiFissi = affitto + stipendi + utenze + marketingFisso + altriCostiFissi;
    const totaleCosti = costiVariabili + costiFissi;
    const utileNetto = ricaviTotali - totaleCosti;
    const marginePercentuale = ricaviTotali > 0 ? (utileNetto / ricaviTotali) * 100 : 0;

    setCalculations({
      ricaviTotali,
      costiVariabili,
      costiFissi,
      totaleCosti,
      utileNetto,
      marginePercentuale
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/financial-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Dati salvati con successo!');
        setTimeout(() => {
          navigate('/analytics');
        }, 2000);
      } else {
        setError(data.error || 'Errore durante il salvataggio');
      }
    } catch (error) {
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
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
            <h1 className="text-3xl font-bold text-gray-900">Inserisci Dati Mensili</h1>
            <p className="text-gray-600">Compila i ricavi e costi per calcolare automaticamente l'utile netto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Dati Finanziari</span>
                </CardTitle>
                <CardDescription>
                  Inserisci i dati finanziari del mese per {user?.business_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Periodo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="month">Mese</Label>
                      <Select onValueChange={(value) => handleSelectChange('month', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder={months[formData.month - 1]} />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, index) => (
                            <SelectItem key={index} value={(index + 1).toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Anno</Label>
                      <Select onValueChange={(value) => handleSelectChange('year', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder={formData.year.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          {[2024, 2025, 2026].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Ricavi */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-700 flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Ricavi</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ricavi_servizi">Ricavi Servizi (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="ricavi_servizi"
                            name="ricavi_servizi"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.ricavi_servizi}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ricavi_prodotti">Ricavi Prodotti (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="ricavi_prodotti"
                            name="ricavi_prodotti"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.ricavi_prodotti}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="altri_ricavi">Altri Ricavi (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="altri_ricavi"
                            name="altri_ricavi"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.altri_ricavi}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Costi Variabili */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-orange-700 flex items-center space-x-2">
                      <TrendingDown className="h-5 w-5" />
                      <span>Costi Variabili</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="costo_merci">Costo Merci (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="costo_merci"
                            name="costo_merci"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.costo_merci}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="provvigioni">Provvigioni (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="provvigioni"
                            name="provvigioni"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.provvigioni}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="marketing_variabile">Marketing Variabile (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="marketing_variabile"
                            name="marketing_variabile"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.marketing_variabile}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Costi Fissi */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-red-700 flex items-center space-x-2">
                      <TrendingDown className="h-5 w-5" />
                      <span>Costi Fissi</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="affitto">Affitto (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="affitto"
                            name="affitto"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.affitto}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stipendi">Stipendi (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="stipendi"
                            name="stipendi"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.stipendi}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="utenze">Utenze (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="utenze"
                            name="utenze"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.utenze}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="marketing_fisso">Marketing Fisso (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="marketing_fisso"
                            name="marketing_fisso"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.marketing_fisso}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="altri_costi_fissi">Altri Costi Fissi (€)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="altri_costi_fissi"
                            name="altri_costi_fissi"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.altri_costi_fissi}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Salvataggio in corso...' : 'Salva Dati'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Calcoli in tempo reale */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Calcoli Automatici</CardTitle>
                <CardDescription>
                  Risultati aggiornati in tempo reale
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {calculations && (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-800">Ricavi Totali</span>
                        <span className="font-bold text-green-900">
                          {formatCurrency(calculations.ricaviTotali)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium text-orange-800">Costi Variabili</span>
                        <span className="font-bold text-orange-900">
                          {formatCurrency(calculations.costiVariabili)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium text-red-800">Costi Fissi</span>
                        <span className="font-bold text-red-900">
                          {formatCurrency(calculations.costiFissi)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-800">Totale Costi</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(calculations.totaleCosti)}
                        </span>
                      </div>

                      <div className={`flex justify-between items-center p-3 rounded-lg ${
                        calculations.utileNetto >= 0 ? 'bg-blue-50' : 'bg-red-50'
                      }`}>
                        <span className={`font-medium ${
                          calculations.utileNetto >= 0 ? 'text-blue-800' : 'text-red-800'
                        }`}>
                          Utile Netto
                        </span>
                        <span className={`font-bold text-lg ${
                          calculations.utileNetto >= 0 ? 'text-blue-900' : 'text-red-900'
                        }`}>
                          {formatCurrency(calculations.utileNetto)}
                        </span>
                      </div>

                      <div className={`flex justify-between items-center p-3 rounded-lg ${
                        calculations.marginePercentuale >= 0 ? 'bg-blue-50' : 'bg-red-50'
                      }`}>
                        <span className={`font-medium ${
                          calculations.marginePercentuale >= 0 ? 'text-blue-800' : 'text-red-800'
                        }`}>
                          Margine %
                        </span>
                        <span className={`font-bold text-lg ${
                          calculations.marginePercentuale >= 0 ? 'text-blue-900' : 'text-red-900'
                        }`}>
                          {calculations.marginePercentuale.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {!calculations && (
                  <div className="text-center text-gray-500 py-8">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Inserisci i dati per vedere i calcoli</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DataEntry;

