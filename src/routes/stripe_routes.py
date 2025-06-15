
from flask import Blueprint, jsonify

stripe_bp = Blueprint('stripe', __name__)

@stripe_bp.route('/stripe/test', methods=['GET'])
def stripe_test():
    return jsonify({'status': 'Stripe API simulata'})
