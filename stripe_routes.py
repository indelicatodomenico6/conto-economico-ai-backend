from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
import stripe
import os
from datetime import datetime, timedelta

stripe_bp = Blueprint('stripe', __name__)

# Configurazione Stripe (da configurare con chiavi reali in produzione)
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_...')  # Da configurare
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', 'pk_test_...')  # Da configurare
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_...')  # Da configurare

# Configurazione piani
PLANS = {
    'free': {
        'name': 'Free',
        'price': 0,
        'features': [
            '1 profilo aziendale',
            '3 mesi di storico',
            'Dashboard base',
            'Inserimento dati mensili'
        ],
        'limits': {
            'max_months': 3,
            'pdf_export': False,
            'email_reports': False,
            'advanced_simulator': False
        }
    },
    'pro': {
        'name': 'Pro',
        'price': 19.99,
        'stripe_price_id': 'price_pro_monthly',  # Da configurare in Stripe
        'features': [
            'Storico illimitato',
            'Esportazione PDF',
            'Invio email report',
            'Dashboard avanzata',
            'Simulatore base'
        ],
        'limits': {
            'max_months': None,
            'pdf_export': True,
            'email_reports': True,
            'advanced_simulator': False
        }
    },
    'premium': {
        'name': 'Premium',
        'price': 39.99,
        'stripe_price_id': 'price_premium_monthly',  # Da configurare in Stripe
        'features': [
            'Tutte le funzionalità Pro',
            'Simulatore avanzato',
            'Analisi predittive',
            'Supporto prioritario',
            'API access'
        ],
        'limits': {
            'max_months': None,
            'pdf_export': True,
            'email_reports': True,
            'advanced_simulator': True
        }
    }
}

@stripe_bp.route('/config', methods=['GET'])
def get_stripe_config():
    """Restituisce la configurazione pubblica di Stripe"""
    return jsonify({
        'publishable_key': STRIPE_PUBLISHABLE_KEY,
        'plans': PLANS
    }), 200

@stripe_bp.route('/plans', methods=['GET'])
def get_plans():
    """Restituisce i piani disponibili"""
    return jsonify({'plans': PLANS}), 200

@stripe_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Crea una sessione di checkout Stripe"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        data = request.get_json()
        plan = data.get('plan')
        
        if plan not in PLANS or plan == 'free':
            return jsonify({'error': 'Piano non valido'}), 400
        
        plan_config = PLANS[plan]
        
        # Crea la sessione di checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': plan_config['stripe_price_id'],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.host_url + 'subscription?success=true&session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.host_url + 'subscription?canceled=true',
            customer_email=user.email,
            metadata={
                'user_id': user_id,
                'plan': plan
            }
        )
        
        return jsonify({'checkout_url': checkout_session.url}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/create-portal-session', methods=['POST'])
@jwt_required()
def create_portal_session():
    """Crea una sessione del portale clienti Stripe"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.stripe_customer_id:
            return jsonify({'error': 'Nessun abbonamento attivo trovato'}), 404
        
        # Crea la sessione del portale
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=request.host_url + 'subscription'
        )
        
        return jsonify({'portal_url': portal_session.url}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/subscription-status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """Restituisce lo stato dell'abbonamento dell'utente"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        subscription_info = {
            'plan': user.subscription_plan or 'free',
            'status': user.subscription_status or 'active',
            'current_period_end': user.subscription_end_date.isoformat() if user.subscription_end_date else None,
            'stripe_customer_id': user.stripe_customer_id,
            'features': PLANS.get(user.subscription_plan or 'free', {}).get('features', []),
            'limits': PLANS.get(user.subscription_plan or 'free', {}).get('limits', {})
        }
        
        # Se ha un customer ID Stripe, recupera info aggiornate
        if user.stripe_customer_id:
            try:
                subscriptions = stripe.Subscription.list(
                    customer=user.stripe_customer_id,
                    status='active',
                    limit=1
                )
                
                if subscriptions.data:
                    subscription = subscriptions.data[0]
                    subscription_info.update({
                        'status': subscription.status,
                        'current_period_end': datetime.fromtimestamp(subscription.current_period_end).isoformat(),
                        'cancel_at_period_end': subscription.cancel_at_period_end
                    })
                    
            except stripe.error.StripeError:
                pass  # Usa i dati locali se Stripe non è disponibile
        
        return jsonify(subscription_info), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Gestisce i webhook di Stripe"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Gestisci gli eventi
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_session_completed(session)
        
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_updated(subscription)
        
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_deleted(subscription)
        
    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        handle_payment_succeeded(invoice)
        
    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        handle_payment_failed(invoice)
    
    return jsonify({'status': 'success'}), 200

def handle_checkout_session_completed(session):
    """Gestisce il completamento del checkout"""
    try:
        user_id = session['metadata']['user_id']
        plan = session['metadata']['plan']
        customer_id = session['customer']
        
        user = User.query.get(user_id)
        if user:
            user.stripe_customer_id = customer_id
            user.subscription_plan = plan
            user.subscription_status = 'active'
            
            # Recupera la sottoscrizione per ottenere le date
            subscriptions = stripe.Subscription.list(
                customer=customer_id,
                status='active',
                limit=1
            )
            
            if subscriptions.data:
                subscription = subscriptions.data[0]
                user.subscription_end_date = datetime.fromtimestamp(subscription.current_period_end)
            
            db.session.commit()
            
    except Exception as e:
        print(f"Errore nel gestire checkout completato: {str(e)}")

def handle_subscription_updated(subscription):
    """Gestisce l'aggiornamento della sottoscrizione"""
    try:
        customer_id = subscription['customer']
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        
        if user:
            user.subscription_status = subscription['status']
            user.subscription_end_date = datetime.fromtimestamp(subscription['current_period_end'])
            
            # Determina il piano dalla price_id
            price_id = subscription['items']['data'][0]['price']['id']
            for plan_key, plan_config in PLANS.items():
                if plan_config.get('stripe_price_id') == price_id:
                    user.subscription_plan = plan_key
                    break
            
            db.session.commit()
            
    except Exception as e:
        print(f"Errore nel gestire aggiornamento sottoscrizione: {str(e)}")

def handle_subscription_deleted(subscription):
    """Gestisce la cancellazione della sottoscrizione"""
    try:
        customer_id = subscription['customer']
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        
        if user:
            user.subscription_plan = 'free'
            user.subscription_status = 'canceled'
            user.subscription_end_date = None
            
            db.session.commit()
            
    except Exception as e:
        print(f"Errore nel gestire cancellazione sottoscrizione: {str(e)}")

def handle_payment_succeeded(invoice):
    """Gestisce il pagamento riuscito"""
    try:
        customer_id = invoice['customer']
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        
        if user:
            # Aggiorna la data di fine periodo
            subscription_id = invoice['subscription']
            subscription = stripe.Subscription.retrieve(subscription_id)
            user.subscription_end_date = datetime.fromtimestamp(subscription['current_period_end'])
            user.subscription_status = 'active'
            
            db.session.commit()
            
    except Exception as e:
        print(f"Errore nel gestire pagamento riuscito: {str(e)}")

def handle_payment_failed(invoice):
    """Gestisce il pagamento fallito"""
    try:
        customer_id = invoice['customer']
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        
        if user:
            user.subscription_status = 'past_due'
            db.session.commit()
            
    except Exception as e:
        print(f"Errore nel gestire pagamento fallito: {str(e)}")

@stripe_bp.route('/cancel-subscription', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Cancella l'abbonamento dell'utente"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.stripe_customer_id:
            return jsonify({'error': 'Nessun abbonamento attivo trovato'}), 404
        
        # Trova la sottoscrizione attiva
        subscriptions = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status='active',
            limit=1
        )
        
        if not subscriptions.data:
            return jsonify({'error': 'Nessun abbonamento attivo trovato'}), 404
        
        subscription = subscriptions.data[0]
        
        # Cancella alla fine del periodo
        stripe.Subscription.modify(
            subscription.id,
            cancel_at_period_end=True
        )
        
        return jsonify({'message': 'Abbonamento cancellato alla fine del periodo corrente'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def check_plan_limits(user, feature):
    """Verifica se l'utente può accedere a una funzionalità"""
    plan = user.subscription_plan or 'free'
    limits = PLANS.get(plan, {}).get('limits', {})
    
    return limits.get(feature, False)

