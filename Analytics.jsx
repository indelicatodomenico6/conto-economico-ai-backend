import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowLeft,
  AlertCircle,
  DollarSign
} from 'lucide-react';

const Analytics = () => {
  const { user, token, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  // Dati demo per la visualizzazione
  const demoData = [
    {
      month: 'Gen',
      ricavi_totali: 15000,
      costi_variabili: 4500,
      costi_fissi: 8000,
      utile_netto: 2500,
      margine_percentuale: 16.67
    },
    {
      month: 'Feb',
      ricavi_totali: 18000,
      costi_variabili: 5400,
      costi_fissi: 8000,
      utile_netto: 4600,
      margine_percentuale: 25.56
    },
    {
      month: 'Mar',
      ricavi_totali: 22000,
      costi_variabili: 6600,
      costi_fissi: 8000,
      utile_netto: 7400,
      margine_percentuale: 33.64
    },
    {
      month: 'Apr',
      ricavi_totali: 19500,
      costi_variabili: 5850,
      costi_fissi: 8000,
      utile_netto: 5650,
      margine_percentuale: 28.97
    },
    {
      month: 'Mag',
      ricavi_totali: 25000,
      costi_variabili: 7500,
      costi_fissi: 8000,
      utile_netto: 9500,
      margine_percentuale: 38.00
    },
    {
      month: 'Giu',
      ricavi_totali: 27500,
      costi_variabili: 8250,
      costi_fissi: 8000,
      utile_netto: 11250,
      margine_percentuale: 40.91
    }
  ];

  const currentMonthData = {
    ricavi_totali: 27500,
    costi_variabili: 8250,
    costi_fissi: 8000,
    utile_netto: 11250,
    margine_percentuale: 40.91,
    ricavi_servizi: 20000,
    ricavi_prodotti: 6000,
    altri_ricavi: 1500
  };

  useEffect(() => {
    // Simula il caricamento dei dati
    setTimeout(() => {
      setData(demoData);
      setCurrentData(currentMonthData);
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Dati per il grafico a torta dei ricavi
  const ricaviBreakdown = [
    { name: 'Servizi', value: currentMonthData?.ricavi_servizi || 0, color: '#3b82f6' },
    { name: 'Prodotti', value: currentMonthData?.ricavi_prodotti || 0, color: '#10b981' },
    { name: 'Altri', value: currentMonthData?.altri_ricavi || 0, color: '#f59e0b' }
  ];

  // Dati per il grafico a torta dei costi
  const costiBreakdown = [
    { name: 'Costi Variabili', value: currentMonthData?.costi_variabili || 0, color: '#ef4444' },
    { name: 'Costi Fissi', value: currentMonthData?.costi_fissi || 0, color: '#dc2626' }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento dati...</p>
          </div>
        </div>
      </Layout>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Analytics</h1>
              <p className="text-gray-600">Analisi finanziaria per {user?.business_name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-40">
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

            <Select onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={selectedYear.toString()} />
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ricavi Totali</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(currentData?.ricavi_totali || 0)}
              </div>
              <p className="text-xs text-gray-600">
                +12.5% rispetto al mese scorso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costi Fissi</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(currentData?.costi_fissi || 0)}
              </div>
              <p className="text-xs text-gray-600">
                Stabili rispetto al mese scorso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costi Variabili</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(currentData?.costi_variabili || 0)}
              </div>
              <p className="text-xs text-gray-600">
                +8.2% rispetto al mese scorso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utile Netto</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(currentData?.utile_netto || 0)}
              </div>
              <p className="text-xs text-gray-600">
                Margine: {formatPercentage(currentData?.margine_percentuale || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ricavi vs Costi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Ricavi vs Costi</span>
              </CardTitle>
              <CardDescription>
                Confronto mensile tra ricavi e costi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `€${value/1000}k`} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), '']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Bar dataKey="ricavi_totali" fill="#3b82f6" name="Ricavi Totali" />
                  <Bar dataKey="costi_variabili" fill="#ef4444" name="Costi Variabili" />
                  <Bar dataKey="costi_fissi" fill="#dc2626" name="Costi Fissi" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Andamento Utile Netto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Andamento Utile Netto</span>
              </CardTitle>
              <CardDescription>
                Evoluzione dell'utile netto e margine percentuale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(value) => `€${value/1000}k`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'Utile Netto' ? formatCurrency(value) : formatPercentage(value),
                      name
                    ]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="utile_netto" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Utile Netto"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="margine_percentuale" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    name="Margine %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pie Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Composizione Ricavi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="h-5 w-5" />
                <span>Composizione Ricavi</span>
              </CardTitle>
              <CardDescription>
                Distribuzione dei ricavi per categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ricaviBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ricaviBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Composizione Costi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="h-5 w-5" />
                <span>Composizione Costi</span>
              </CardTitle>
              <CardDescription>
                Distribuzione dei costi per tipologia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costiBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costiBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riepilogo Mensile</CardTitle>
            <CardDescription>
              Dettaglio dei dati finanziari degli ultimi 6 mesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Mese</th>
                    <th className="text-right p-2">Ricavi Totali</th>
                    <th className="text-right p-2">Costi Variabili</th>
                    <th className="text-right p-2">Costi Fissi</th>
                    <th className="text-right p-2">Utile Netto</th>
                    <th className="text-right p-2">Margine %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{row.month}</td>
                      <td className="p-2 text-right text-green-600 font-medium">
                        {formatCurrency(row.ricavi_totali)}
                      </td>
                      <td className="p-2 text-right text-orange-600">
                        {formatCurrency(row.costi_variabili)}
                      </td>
                      <td className="p-2 text-right text-red-600">
                        {formatCurrency(row.costi_fissi)}
                      </td>
                      <td className="p-2 text-right text-blue-600 font-medium">
                        {formatCurrency(row.utile_netto)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatPercentage(row.margine_percentuale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;

