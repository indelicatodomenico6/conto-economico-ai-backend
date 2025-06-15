from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, FinancialData, db
from datetime import datetime
from sqlalchemy import and_

financial_bp = Blueprint('financial', __name__)

def check_plan_limits(user, year, month):
    """Verifica i limiti del piano dell'utente"""
    if user.subscription_plan == 'free':
        # Piano gratuito: massimo 3 mesi di storico
        current_date = datetime.now()
        current_year = current_date.year
        current_month = current_date.month
        
        # Calcola la differenza in mesi
        months_diff = (current_year - year) * 12 + (current_month - month)
        
        if months_diff > 3:
            return False, 'Il piano gratuito consente solo 3 mesi di storico'
    
    return True, None

@financial_bp.route('/financial-data', methods=['GET'])
@jwt_required()
def get_financial_data():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        # Parametri opzionali per filtrare
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        
        query = FinancialData.query.filter_by(user_id=user_id)
        
        if year:
            query = query.filter_by(year=year)
        if month:
            query = query.filter_by(month=month)
        
        # Ordina per anno e mese decrescente
        financial_data = query.order_by(FinancialData.year.desc(), FinancialData.month.desc()).all()
        
        return jsonify({
            'data': [item.to_dict() for item in financial_data]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Errore interno del server'}), 500

@financial_bp.route('/financial-data', methods=['POST'])
@jwt_required()
def create_financial_data():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        data = request.get_json()
        
        # Validazione dati richiesti
        if not data.get('month') or not data.get('year'):
            return jsonify({'error': 'Mese e anno sono obbligatori'}), 400
        
        month = data['month']
        year = data['year']
        
        # Validazione mese e anno
        if not (1 <= month <= 12):
            return jsonify({'error': 'Il mese deve essere tra 1 e 12'}), 400
        
        if year < 2000 or year > datetime.now().year + 1:
            return jsonify({'error': 'Anno non valido'}), 400
        
        # Verifica limiti del piano
        is_allowed, error_msg = check_plan_limits(user, year, month)
        if not is_allowed:
            return jsonify({'error': error_msg}), 403
        
        # Verifica se esistono già dati per questo mese/anno
        existing = FinancialData.query.filter_by(
            user_id=user_id, 
            month=month, 
            year=year
        ).first()
        
        if existing:
            return jsonify({'error': 'Dati già esistenti per questo mese/anno'}), 400
        
        # Crea nuovo record
        financial_data = FinancialData(
            user_id=user_id,
            month=month,
            year=year,
            ricavi_servizi=data.get('ricavi_servizi', 0),
            ricavi_prodotti=data.get('ricavi_prodotti', 0),
            altri_ricavi=data.get('altri_ricavi', 0),
            costo_merci=data.get('costo_merci', 0),
            provvigioni=data.get('provvigioni', 0),
            marketing_variabile=data.get('marketing_variabile', 0),
            affitto=data.get('affitto', 0),
            stipendi=data.get('stipendi', 0),
            utenze=data.get('utenze', 0),
            marketing_fisso=data.get('marketing_fisso', 0),
            altri_costi_fissi=data.get('altri_costi_fissi', 0)
        )
        
        db.session.add(financial_data)
        db.session.commit()
        
        return jsonify({
            'message': 'Dati finanziari salvati con successo',
            'data': financial_data.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Errore interno del server'}), 500

@financial_bp.route('/financial-data/<int:data_id>', methods=['PUT'])
@jwt_required()
def update_financial_data(data_id):
    try:
        user_id = get_jwt_identity()
        
        # Trova i dati e verifica che appartengano all'utente
        financial_data = FinancialData.query.filter_by(
            id=data_id, 
            user_id=user_id
        ).first()
        
        if not financial_data:
            return jsonify({'error': 'Dati non trovati'}), 404
        
        data = request.get_json()
        
        # Aggiorna i campi forniti
        fields = [
            'ricavi_servizi', 'ricavi_prodotti', 'altri_ricavi',
            'costo_merci', 'provvigioni', 'marketing_variabile',
            'affitto', 'stipendi', 'utenze', 'marketing_fisso', 'altri_costi_fissi'
        ]
        
        for field in fields:
            if field in data:
                setattr(financial_data, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Dati aggiornati con successo',
            'data': financial_data.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Errore interno del server'}), 500

@financial_bp.route('/financial-data/<int:data_id>', methods=['DELETE'])
@jwt_required()
def delete_financial_data(data_id):
    try:
        user_id = get_jwt_identity()
        
        # Trova i dati e verifica che appartengano all'utente
        financial_data = FinancialData.query.filter_by(
            id=data_id, 
            user_id=user_id
        ).first()
        
        if not financial_data:
            return jsonify({'error': 'Dati non trovati'}), 404
        
        db.session.delete(financial_data)
        db.session.commit()
        
        return jsonify({'message': 'Dati eliminati con successo'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Errore interno del server'}), 500

@financial_bp.route('/financial-data/<int:year>/<int:month>', methods=['GET'])
@jwt_required()
def get_financial_data_by_month(year, month):
    try:
        user_id = get_jwt_identity()
        
        # Validazione mese e anno
        if not (1 <= month <= 12):
            return jsonify({'error': 'Il mese deve essere tra 1 e 12'}), 400
        
        financial_data = FinancialData.query.filter_by(
            user_id=user_id,
            year=year,
            month=month
        ).first()
        
        if not financial_data:
            return jsonify({'error': 'Dati non trovati per il mese specificato'}), 404
        
        return jsonify({
            'data': financial_data.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Errore interno del server'}), 500

