#!/usr/bin/env python3

import sys
import os

# Aggiungi il percorso del progetto
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User
from src.main import app

def create_demo_user():
    """Crea un utente demo per i test"""
    with app.app_context():
        # Verifica se l'utente demo esiste già
        existing_user = User.query.filter_by(email='demo@esempio.com').first()
        
        if existing_user:
            print("Utente demo già esistente")
            return
        
        # Crea l'utente demo
        demo_user = User(
            email='demo@esempio.com',
            first_name='Demo',
            last_name='User',
            business_name='Azienda Demo',
            business_type='Centro Estetico',
            subscription_plan='pro'  # Piano Pro per testare tutte le funzionalità
        )
        
        demo_user.set_password('demo123456')
        
        db.session.add(demo_user)
        db.session.commit()
        
        print(f"Utente demo creato con ID: {demo_user.id}")

if __name__ == '__main__':
    create_demo_user()

