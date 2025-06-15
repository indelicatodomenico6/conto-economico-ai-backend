# Architettura Conto Economico AI

## Panoramica del Sistema

**Conto Economico AI** è una web app SaaS per la gestione finanziaria di attività commerciali (centri estetici, palestre, negozi, agenti).

### Stack Tecnologico
- **Backend**: Flask + SQLAlchemy + JWT
- **Frontend**: React + Tailwind CSS + Recharts
- **Database**: SQLite (sviluppo) / PostgreSQL (produzione)
- **Pagamenti**: Stripe
- **PDF**: ReportLab
- **Email**: Flask-Mail

## Schema Database

### Tabella Users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    business_name VARCHAR(120),
    business_type VARCHAR(50),
    subscription_plan VARCHAR(20) DEFAULT 'free',
    stripe_customer_id VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabella Financial_Data
```sql
CREATE TABLE financial_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    ricavi_servizi DECIMAL(10,2) DEFAULT 0,
    ricavi_prodotti DECIMAL(10,2) DEFAULT 0,
    altri_ricavi DECIMAL(10,2) DEFAULT 0,
    costo_merci DECIMAL(10,2) DEFAULT 0,
    provvigioni DECIMAL(10,2) DEFAULT 0,
    marketing_variabile DECIMAL(10,2) DEFAULT 0,
    affitto DECIMAL(10,2) DEFAULT 0,
    stipendi DECIMAL(10,2) DEFAULT 0,
    utenze DECIMAL(10,2) DEFAULT 0,
    marketing_fisso DECIMAL(10,2) DEFAULT 0,
    altri_costi_fissi DECIMAL(10,2) DEFAULT 0,
    ricavi_totali DECIMAL(10,2) GENERATED ALWAYS AS (ricavi_servizi + ricavi_prodotti + altri_ricavi),
    costi_variabili DECIMAL(10,2) GENERATED ALWAYS AS (costo_merci + provvigioni + marketing_variabile),
    costi_fissi DECIMAL(10,2) GENERATED ALWAYS AS (affitto + stipendi + utenze + marketing_fisso + altri_costi_fissi),
    totale_costi DECIMAL(10,2) GENERATED ALWAYS AS (costi_variabili + costi_fissi),
    utile_netto DECIMAL(10,2) GENERATED ALWAYS AS (ricavi_totali - totale_costi),
    margine_percentuale DECIMAL(5,2) GENERATED ALWAYS AS (CASE WHEN ricavi_totali > 0 THEN (utile_netto / ricavi_totali) * 100 ELSE 0 END),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(user_id, month, year)
);
```

### Tabella Subscriptions
```sql
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stripe_subscription_id VARCHAR(100),
    plan_name VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_period_start DATETIME,
    current_period_end DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente
- `POST /api/auth/logout` - Logout utente
- `GET /api/auth/me` - Profilo utente corrente

### Dati Finanziari
- `GET /api/financial-data` - Lista dati finanziari utente
- `POST /api/financial-data` - Inserimento nuovi dati
- `PUT /api/financial-data/{id}` - Aggiornamento dati esistenti
- `DELETE /api/financial-data/{id}` - Eliminazione dati
- `GET /api/financial-data/{year}/{month}` - Dati specifici mese

### Dashboard
- `GET /api/dashboard/summary` - Riepilogo KPI
- `GET /api/dashboard/charts` - Dati per grafici
- `GET /api/dashboard/trends` - Andamento mensile

### Simulatore
- `POST /api/simulator/calculate` - Calcolo simulazione "E se..."

### Export
- `POST /api/export/pdf` - Generazione PDF
- `POST /api/export/email` - Invio PDF via email

### Abbonamenti
- `GET /api/subscription/plans` - Lista piani disponibili
- `POST /api/subscription/create` - Creazione abbonamento
- `POST /api/subscription/cancel` - Cancellazione abbonamento
- `GET /api/subscription/status` - Stato abbonamento corrente

## Piani di Abbonamento

### Free
- 1 profilo aziendale
- 3 mesi di storico
- Dashboard base
- Nessun export PDF

### Pro (€19.99/mese)
- Storico illimitato
- Export PDF
- Dashboard avanzata
- Email support

### Premium (€39.99/mese)
- Tutto del Pro
- Simulatore avanzato
- Analisi predittive
- Priority support

## Struttura Frontend

### Pagine Principali
1. **Login/Registrazione** (`/login`, `/register`)
2. **Home Dashboard** (`/dashboard`)
3. **Inserisci Dati** (`/data-entry`)
4. **Dashboard Dettagliata** (`/analytics`)
5. **Simulatore** (`/simulator`)
6. **Gestione Account** (`/account`)
7. **Abbonamenti** (`/subscription`)

### Componenti Chiave
- `AuthGuard` - Protezione route autenticate
- `PlanGuard` - Restrizioni basate su piano
- `DataEntryForm` - Form inserimento dati
- `DashboardCharts` - Grafici e visualizzazioni
- `Simulator` - Interfaccia simulatore
- `PDFExport` - Componente export

## Sicurezza

### Autenticazione
- JWT tokens con scadenza
- Password hashing con bcrypt
- Rate limiting su API sensibili

### Autorizzazione
- Ogni utente accede solo ai propri dati
- Middleware di controllo permessi
- Validazione input lato server

### Dati
- Validazione rigorosa input
- Sanitizzazione dati
- Backup automatici

## Performance

### Caching
- Cache risultati calcoli complessi
- Cache dati dashboard
- CDN per assets statici

### Database
- Indici su campi frequenti
- Query ottimizzate
- Paginazione risultati

### Frontend
- Lazy loading componenti
- Ottimizzazione bundle
- Compressione assets

