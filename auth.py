from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from src.models.user import User, Subscription, db
from datetime import timedelta
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Valida il formato email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valida la password (minimo 8 caratteri)"""
    return len(password) >= 8

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validazione dati richiesti
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Il campo {field} è obbligatorio'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        business_name = data.get('business_name', '').strip()
        business_type = data.get('business_type', '').strip()
        
        # Validazioni
        if not validate_email(email):
            return jsonify({'error': 'Formato email non valido'}), 400
        
        if not validate_password(password):
            return jsonify({'error': 'La password deve essere di almeno 8 caratteri'}), 400
        
        # Verifica se l'utente esiste già
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email già registrata'}), 400
        
        # Crea nuovo utente
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            business_name=business_name,
            business_type=business_type
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Crea abbonamento gratuito di default
        subscription = Subscription(
            user_id=user.id,
            plan_name='free',
            status='active'
        )
        db.session.add(subscription)
        db.session.commit()
        
        # Crea token JWT
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )
        
        return jsonify({
            'message': 'Registrazione completata con successo',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Errore interno del server'}), 500

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email e password sono obbligatori'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Trova l'utente
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Credenziali non valide'}), 401
        
        # Crea token JWT
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )
        
        return jsonify({
            'message': 'Login effettuato con successo',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Errore interno del server'}), 500

@auth_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Errore interno del server'}), 500

@auth_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    # Con JWT stateless, il logout è gestito lato client
    # rimuovendo il token dal localStorage
    return jsonify({'message': 'Logout effettuato con successo'}), 200

# Route per aggiornare il profilo utente
@auth_bp.route('/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        data = request.get_json()
        
        # Aggiorna solo i campi forniti
        if 'first_name' in data:
            user.first_name = data['first_name'].strip()
        if 'last_name' in data:
            user.last_name = data['last_name'].strip()
        if 'business_name' in data:
            user.business_name = data['business_name'].strip()
        if 'business_type' in data:
            user.business_type = data['business_type'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profilo aggiornato con successo',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Errore interno del server'}), 500

