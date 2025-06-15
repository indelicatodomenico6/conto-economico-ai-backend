from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, FinancialData, db
from sqlalchemy import func, and_
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        # Parametri opzionali
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        
        # Se non specificati, usa il mese corrente
        if not year or not month:
            current_date = datetime.now()
            year = year or current_date.year
            month = month or current_date.month
        
        # Trova i dati per il mese specificato
        current_data = FinancialData.query.filter_by(
            user_id=user_id,
            year=year,
            month=month
        ).first()
        
        if not current_data:
            return jsonify({
                'message': 'Nessun dato disponibile per il periodo specificato',
                'year': year,
                'month': month,
                'has_data': False
            }), 200
        
        # Calcola il mese precedente per il confronto
        prev_month = month - 1
        prev_year = year
        if prev_month == 0:
            prev_month = 12
            prev_year = year - 1
        
        prev_data = FinancialData.query.filter_by(
            user_id=user_id,
            year=prev_year,
            month=prev_month
        ).first()
        
        # Calcola le variazioni percentuali
        def calculate_change(current, previous):
            if not previous or previous == 0:
                return None
            return ((current - previous) / previous) * 100
        
        summary = {
            'year': year,
            'month': month,
            'has_data': True,
            'ricavi_totali': current_data.ricavi_totali,
            'costi_fissi': current_data.costi_fissi,
            'costi_variabili': current_data.costi_variabili,
            'totale_costi': current_data.totale_costi,
            'utile_netto': current_data.utile_netto,
            'margine_percentuale': current_data.margine_percentuale,
            'changes': {}
        }
        
        if prev_data:
            summary['changes'] = {
                'ricavi_totali': calculate_change(current_data.ricavi_totali, prev_data.ricavi_totali),
                'costi_fissi': calculate_change(current_data.costi_fissi, prev_data.costi_fissi),
                'costi_variabili': calculate_change(current_data.costi_variabili, prev_data.costi_variabili),
                'utile_netto': calculate_change(current_data.utile_netto, prev_data.utile_netto),
                'margine_percentuale': calculate_change(current_data.margine_percentuale, prev_data.margine_percentuale)
            }
        
        return jsonify(summary), 200
        
    except Exception as e:
        return jsonify({'error': 'Errore interno del server'}), 500

@dashboard_bp.route('/dashboard/charts', methods=['GET'])
@jwt_required()
def get_dashboard_charts():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        # Parametri opzionali
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        
        # Se non specificati, usa il mese corrente
        if not year or not month:
            current_date = datetime.now()
            year = year or current_date.year
            month = month or current_date.month
        
        # Dati per il grafico Ricavi vs Costi del mese corrente
        current_data = FinancialData.query.filter_by(
            user_id=user_id,
            year=year,
            month=month
        ).first()
        
        ricavi_vs_costi = None
        if current_data:
            ricavi_vs_costi = {
                'ricavi_servizi': current_data.ricavi_servizi,
                'ricavi_prodotti': current_data.ricavi_prodotti,
                'altri_ricavi': current_data.altri_ricavi,
                'costi_fissi': current_data.costi_fissi,
                'costi_variabili': current_data.costi_variabili,
                'utile_netto': current_data.utile_netto
            }
        
        # Dati per l'andamento mensile (ultimi 12 mesi)
        end_date = datetime(year, month, 1)
        start_date = end_date - timedelta(days=365)
        
        monthly_data = FinancialData.query.filter(
            and_(
                FinancialData.user_id == user_id,
                FinancialData.year >= start_date.year,
                FinancialData.year <= end_date.year
            )
        ).order_by(FinancialData.year.asc(), FinancialData.month.asc()).all()
        
        # Filtra per gli ultimi 12 mesi
        monthly_trend = []
        for data in monthly_data:
            data_date = datetime(data.year, data.month, 1)
            if start_date <= data_date <= end_date:
                monthly_trend.append({
                    'year': data.year,
                    'month': data.month,
                    'month_name': data_date.strftime('%b %Y'),
                    'ricavi_totali': data.ricavi_totali,
                    'totale_costi': data.totale_costi,
                    'utile_netto': data.utile_netto,
                    'margine_percentuale': data.margine_percentuale
                })
        
        return jsonify({
            'ricavi_vs_costi': ricavi_vs_costi,
            'monthly_trend': monthly_trend,
            'current_period': {
                'year': year,
                'month': month
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Errore interno del server'}), 500

@dashboard_bp.route('/dashboard/trends', methods=['GET'])
@jwt_required()
def get_dashboard_trends():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        # Parametri per il periodo
        months = request.args.get('months', default=12, type=int)
        
        # Limita il numero di mesi in base al piano
        if user.subscription_plan == 'free':
            months = min(months, 3)
        
        # Calcola la data di inizio
        current_date = datetime.now()
        start_date = current_date - timedelta(days=months * 30)
        
        # Recupera i dati del periodo
        trends_data = FinancialData.query.filter(
            and_(
                FinancialData.user_id == user_id,
                FinancialData.year >= start_date.year
            )
        ).order_by(FinancialData.year.asc(), FinancialData.month.asc()).all()
        
        # Calcola statistiche aggregate
        if trends_data:
            total_ricavi = sum(data.ricavi_totali for data in trends_data)
            total_costi = sum(data.totale_costi for data in trends_data)
            total_utile = sum(data.utile_netto for data in trends_data)
            avg_margine = sum(data.margine_percentuale for data in trends_data) / len(trends_data)
            
            # Trova il mese migliore e peggiore
            best_month = max(trends_data, key=lambda x: x.utile_netto)
            worst_month = min(trends_data, key=lambda x: x.utile_netto)
            
            statistics = {
                'total_ricavi': total_ricavi,
                'total_costi': total_costi,
                'total_utile': total_utile,
                'avg_margine': round(avg_margine, 2),
                'best_month': {
                    'year': best_month.year,
                    'month': best_month.month,
                    'utile_netto': best_month.utile_netto
                },
                'worst_month': {
                    'year': worst_month.year,
                    'month': worst_month.month,
                    'utile_netto': worst_month.utile_netto
                },
                'months_count': len(trends_data)
            }
        else:
            statistics = {
                'total_ricavi': 0,
                'total_costi': 0,
                'total_utile': 0,
                'avg_margine': 0,
                'best_month': None,
                'worst_month': None,
                'months_count': 0
            }
        
        return jsonify({
            'statistics': statistics,
            'period_months': months,
            'plan_limit': 3 if user.subscription_plan == 'free' else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Errore interno del server'}), 500

