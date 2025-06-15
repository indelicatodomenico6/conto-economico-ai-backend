
from flask import Blueprint, jsonify

export_bp = Blueprint('export', __name__)

@export_bp.route('/export', methods=['GET'])
def export():
    return jsonify({'data': 'Export completato'})
