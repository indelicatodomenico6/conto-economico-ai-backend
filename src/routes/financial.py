
from flask import Blueprint, jsonify

financial_bp = Blueprint('financial', __name__)

@financial_bp.route('/financial', methods=['GET'])
def financial():
    return jsonify({'data': 'Financial dati simulati'})
