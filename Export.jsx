import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Mail, 
  Download,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Building,
  Euro,
  Send,
  Eye
} from 'lucide-react';

const Export = () => {
  const { user, token, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const years = [2024, 2025, 2026];

  useEffect(() => {
    loadPreviewData();
  }, [selectedMonth, selectedYear]);

  const loadPreviewData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/export/preview-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setMessage('');
      } else {
        const error = await response.json();
        setPreviewData(null);
        setMessage(error.error || 'Errore nel caricamento dei dati');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Errore:', error);
      setPreviewData(null);
      setMessage('Errore di connessione');
      setMessageType('error');
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/export/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `report_mensile_${selectedMonth}_${selectedYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        setMessage('PDF scaricato con successo!');
        setMessageType('success');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Errore nella generazione del PDF');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Errore:', error);
      setMessage('Errore di connessione');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      setMessage('Inserisci un indirizzo email valido');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/export/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          email: email
        })
      });

      if (response.ok) {
        setMessage(`Email inviata con successo a ${email}!`);
        setMessageType('success');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Errore nell\'invio dell\'email');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Errore:', error);
      setMessage('Errore di connessione');
      setMessageType('error');
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

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const canSendEmail = user?.subscription_plan !== 'free';

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
                <FileText className="h-8 w-8 text-blue-600" />
                <span>Esporta PDF</span>
              </h1>
              <p className="text-gray-600">Genera e invia report mensili per {user?.business_name}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controlli Export */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Seleziona Periodo</span>
                </CardTitle>
                <CardDescription>
                  Scegli il mese e l'anno per il report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mese</Label>
                    <Select onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder={months[selectedMonth - 1]} />
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
                    <Label>Anno</Label>
                    <Select onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedYear.toString()} />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Scarica PDF</span>
                </CardTitle>
                <CardDescription>
                  Genera e scarica il report in formato PDF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={loading || !previewData}
                  className="w-full flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{loading ? 'Generazione...' : 'Scarica PDF'}</span>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Invia via Email</span>
                </CardTitle>
                <CardDescription>
                  {canSendEmail 
                    ? 'Invia il report direttamente via email'
                    : 'Funzionalità disponibile solo per piani Pro e Premium'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Indirizzo Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@esempio.com"
                    disabled={!canSendEmail}
                  />
                </div>
                
                <Button
                  onClick={handleSendEmail}
                  disabled={loading || !previewData || !canSendEmail || !email}
                  className="w-full flex items-center space-x-2"
                  variant={canSendEmail ? "default" : "secondary"}
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? 'Invio...' : 'Invia Email'}</span>
                </Button>

                {!canSendEmail && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aggiorna al piano Pro o Premium per inviare report via email.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Anteprima Dati */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Anteprima Report</span>
                </CardTitle>
                <CardDescription>
                  Dati che verranno inclusi nel PDF per {months[selectedMonth - 1]} {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewData ? (
                  <div className="space-y-6">
                    {/* Informazioni Azienda */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>Informazioni Azienda</span>
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nome Azienda:</span>
                          <span className="font-medium">{previewData.user.business_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo Attività:</span>
                          <span className="font-medium">{previewData.user.business_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Proprietario:</span>
                          <span className="font-medium">{previewData.user.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Riepilogo Finanziario */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <Euro className="h-4 w-4" />
                        <span>Riepilogo Finanziario</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 font-medium">Ricavi Totali</span>
                            <span className="text-green-800 font-bold text-lg">
                              {formatCurrency(previewData.data.ricavi_totali)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-red-700 font-medium">Costi Totali</span>
                            <span className="text-red-800 font-bold text-lg">
                              {formatCurrency(previewData.data.totale_costi)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 font-medium">Utile Netto</span>
                            <span className="text-blue-800 font-bold text-lg">
                              {formatCurrency(previewData.data.utile_netto)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-purple-700 font-medium">Margine %</span>
                            <span className="text-purple-800 font-bold text-lg">
                              {formatPercentage(previewData.data.margine_percentuale)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dettaglio Ricavi */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Dettaglio Ricavi</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ricavi Servizi:</span>
                          <span className="font-medium">{formatCurrency(previewData.data.ricavi_servizi)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ricavi Prodotti:</span>
                          <span className="font-medium">{formatCurrency(previewData.data.ricavi_prodotti)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Altri Ricavi:</span>
                          <span className="font-medium">{formatCurrency(previewData.data.altri_ricavi)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dettaglio Costi */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Dettaglio Costi</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Costi Variabili:</span>
                          <span className="font-medium">{formatCurrency(previewData.data.costi_variabili)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Costi Fissi:</span>
                          <span className="font-medium">{formatCurrency(previewData.data.costi_fissi)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Nessun dato disponibile per il periodo selezionato
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Inserisci prima i dati finanziari per questo mese
                    </p>
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

export default Export;

