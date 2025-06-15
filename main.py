import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from src.models.user import db, bcrypt
from src.routes.auth import auth_bp
from src.routes.financial import financial_bp
from src.routes.dashboard import dashboard_bp
from src.routes.export import export_bp
from src.routes.stripe_routes import stripe_bp
from datetime import timedelta

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# ——— Configurazione generali ———
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# ——— Configurazione Database ———
# Salva il DB in src/instance/database.db (Render ha permessi in questa cartella)
app.config['SQLALCHEMY_DATABASE_URI'] = \
    f"sqlite:///{os.path.join(os.path.dirname(__file__), 'instance', 'database.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inizializza SQLAlchemy e crea il DB se non esiste
db.init_app(app)
with app.app_context():
    db.create_all()

# ——— Configurazione Email ———
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER')

# ——— Inizializza le altre estensioni ———
bcrypt.init_app(app)
jwt = JWTManager(app)
cors = CORS(app, origins="*")
mail = Mail(app)

# ——— Registra i Blueprint ———
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(financial_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(export_bp, url_prefix='/api/export')
app.register_blueprint(stripe_bp, url_prefix='/api/stripe')

# ——— JWT Error Handlers ———
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token scaduto'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Token non valido'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Token di autorizzazione richiesto'}), 401

# ——— Route per servire il frontend ———
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    sf = app.static_folder
    full_path = os.path.join(sf, path)
    if path and os.path.exists(full_path):
        return send_from_directory(sf, path)
    index = os.path.join(sf, 'index.html')
    if os.path.exists(index):
        return send_from_directory(sf, 'index.html')
    return "index.html not found", 404

# ——— Health check ———
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'Conto Economico AI API is running',
        'version': '1.0.0'
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

