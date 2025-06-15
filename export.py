from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, FinancialData
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.lib.colors import HexColor
import io
import os
import tempfile
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

export_bp = Blueprint('export', __name__)

def create_financial_pdf(user, financial_data, month, year):
    """Crea un PDF con i dati finanziari dell'utente"""
    
    # Crea un buffer in memoria per il PDF
    buffer = io.BytesIO()
    
    # Crea il documento PDF
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
    
    # Stili
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#1f2937'),
        alignment=1  # Center
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=20,
        textColor=colors.HexColor('#374151')
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=12
    )
    
    # Contenuto del PDF
    story = []
    
    # Titolo
    story.append(Paragraph("Conto Economico AI", title_style))
    story.append(Paragraph(f"Report Mensile - {month}/{year}", subtitle_style))
    story.append(Spacer(1, 20))
    
    # Informazioni azienda
    story.append(Paragraph("Informazioni Azienda", subtitle_style))
    company_data = [
        ['Nome Azienda:', user.business_name or 'N/A'],
        ['Tipo Attività:', user.business_type or 'N/A'],
        ['Proprietario:', f"{user.first_name} {user.last_name}"],
        ['Email:', user.email],
        ['Data Report:', datetime.now().strftime('%d/%m/%Y')]
    ]
    
    company_table = Table(company_data, colWidths=[2*inch, 3*inch])
    company_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    story.append(company_table)
    story.append(Spacer(1, 30))
    
    if financial_data:
        # Calcoli
        ricavi_totali = (financial_data.ricavi_servizi or 0) + (financial_data.ricavi_prodotti or 0) + (financial_data.altri_ricavi or 0)
        costi_variabili = (financial_data.costo_merci or 0) + (financial_data.provvigioni or 0) + (financial_data.marketing_variabile or 0)
        costi_fissi = (financial_data.affitto or 0) + (financial_data.stipendi or 0) + (financial_data.utenze or 0) + (financial_data.marketing_fisso or 0) + (financial_data.altri_costi_fissi or 0)
        totale_costi = costi_variabili + costi_fissi
        utile_netto = ricavi_totali - totale_costi
        margine_percentuale = (utile_netto / ricavi_totali * 100) if ricavi_totali > 0 else 0
        
        # Tabella Ricavi
        story.append(Paragraph("Ricavi", subtitle_style))
        ricavi_data = [
            ['Voce', 'Importo (€)'],
            ['Ricavi Servizi', f"{financial_data.ricavi_servizi or 0:,.2f}"],
            ['Ricavi Prodotti', f"{financial_data.ricavi_prodotti or 0:,.2f}"],
            ['Altri Ricavi', f"{financial_data.altri_ricavi or 0:,.2f}"],
            ['TOTALE RICAVI', f"{ricavi_totali:,.2f}"]
        ]
        
        ricavi_table = Table(ricavi_data, colWidths=[3*inch, 2*inch])
        ricavi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#dbeafe')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(ricavi_table)
        story.append(Spacer(1, 20))
        
        # Tabella Costi
        story.append(Paragraph("Costi", subtitle_style))
        costi_data = [
            ['Voce', 'Importo (€)'],
            ['Costo Merci', f"{financial_data.costo_merci or 0:,.2f}"],
            ['Provvigioni', f"{financial_data.provvigioni or 0:,.2f}"],
            ['Marketing Variabile', f"{financial_data.marketing_variabile or 0:,.2f}"],
            ['Subtotale Costi Variabili', f"{costi_variabili:,.2f}"],
            ['', ''],
            ['Affitto', f"{financial_data.affitto or 0:,.2f}"],
            ['Stipendi', f"{financial_data.stipendi or 0:,.2f}"],
            ['Utenze', f"{financial_data.utenze or 0:,.2f}"],
            ['Marketing Fisso', f"{financial_data.marketing_fisso or 0:,.2f}"],
            ['Altri Costi Fissi', f"{financial_data.altri_costi_fissi or 0:,.2f}"],
            ['Subtotale Costi Fissi', f"{costi_fissi:,.2f}"],
            ['TOTALE COSTI', f"{totale_costi:,.2f}"]
        ]
        
        costi_table = Table(costi_data, colWidths=[3*inch, 2*inch])
        costi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ef4444')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#fee2e2')),
            ('BACKGROUND', (0, 11), (-1, 11), colors.HexColor('#fee2e2')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fecaca')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
            ('FONTNAME', (0, 11), (-1, 11), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('SPAN', (0, 4), (-1, 4)),  # Riga vuota
        ]))
        
        story.append(costi_table)
        story.append(Spacer(1, 30))
        
        # Riepilogo Finale
        story.append(Paragraph("Riepilogo Finale", subtitle_style))
        riepilogo_data = [
            ['Indicatore', 'Valore'],
            ['Ricavi Totali', f"{ricavi_totali:,.2f} €"],
            ['Costi Totali', f"{totale_costi:,.2f} €"],
            ['Utile Netto', f"{utile_netto:,.2f} €"],
            ['Margine %', f"{margine_percentuale:.2f}%"]
        ]
        
        riepilogo_table = Table(riepilogo_data, colWidths=[3*inch, 2*inch])
        riepilogo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('BACKGROUND', (0, -2), (-1, -1), colors.HexColor('#d1fae5')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -2), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(riepilogo_table)
        
    else:
        story.append(Paragraph("Nessun dato finanziario disponibile per il periodo selezionato.", normal_style))
    
    # Footer
    story.append(Spacer(1, 50))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6b7280'),
        alignment=1
    )
    story.append(Paragraph("Report generato da Conto Economico AI", footer_style))
    story.append(Paragraph(f"Data generazione: {datetime.now().strftime('%d/%m/%Y %H:%M')}", footer_style))
    
    # Costruisci il PDF
    doc.build(story)
    
    # Ritorna il buffer
    buffer.seek(0)
    return buffer

def send_email_with_pdf(user_email, pdf_buffer, month, year):
    """Invia email con PDF allegato"""
    
    # Configurazione email (da configurare con credenziali reali)
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = "noreply@contoeconomicoai.com"  # Da configurare
    sender_password = "your_app_password"  # Da configurare
    
    try:
        # Crea il messaggio
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = user_email
        msg['Subject'] = f"Report Mensile Conto Economico AI - {month}/{year}"
        
        # Corpo dell'email
        body = f"""
        Ciao,
        
        In allegato trovi il report mensile del tuo conto economico per {month}/{year}.
        
        Il report include:
        - Riepilogo ricavi e costi
        - Calcolo dell'utile netto
        - Analisi del margine percentuale
        
        Grazie per aver scelto Conto Economico AI!
        
        Il team di Conto Economico AI
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Allega il PDF
        pdf_buffer.seek(0)
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(pdf_buffer.read())
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename="report_mensile_{month}_{year}.pdf"'
        )
        msg.attach(part)
        
        # Invia l'email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, user_email, text)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Errore nell'invio email: {str(e)}")
        return False

@export_bp.route('/generate-pdf', methods=['POST'])
@jwt_required()
def generate_pdf():
    """Genera PDF del report mensile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        data = request.get_json()
        month = data.get('month', datetime.now().month)
        year = data.get('year', datetime.now().year)
        
        # Recupera i dati finanziari per il mese specificato
        financial_data = FinancialData.query.filter_by(
            user_id=user_id,
            month=month,
            year=year
        ).first()
        
        # Genera il PDF
        pdf_buffer = create_financial_pdf(user, financial_data, month, year)
        
        # Salva temporaneamente il file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_file.write(pdf_buffer.getvalue())
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f'report_mensile_{month}_{year}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@export_bp.route('/send-email', methods=['POST'])
@jwt_required()
def send_email():
    """Invia PDF via email"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        # Verifica piano utente (solo Pro e Premium possono inviare email)
        if user.subscription_plan == 'free':
            return jsonify({'error': 'Funzionalità disponibile solo per piani Pro e Premium'}), 403
        
        data = request.get_json()
        month = data.get('month', datetime.now().month)
        year = data.get('year', datetime.now().year)
        email = data.get('email', user.email)
        
        # Recupera i dati finanziari
        financial_data = FinancialData.query.filter_by(
            user_id=user_id,
            month=month,
            year=year
        ).first()
        
        # Genera il PDF
        pdf_buffer = create_financial_pdf(user, financial_data, month, year)
        
        # Invia l'email
        success = send_email_with_pdf(email, pdf_buffer, month, year)
        
        if success:
            return jsonify({'message': 'Email inviata con successo'}), 200
        else:
            return jsonify({'error': 'Errore nell\'invio dell\'email'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@export_bp.route('/preview-data', methods=['POST'])
@jwt_required()
def preview_data():
    """Anteprima dei dati per il PDF"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Utente non trovato'}), 404
        
        data = request.get_json()
        month = data.get('month', datetime.now().month)
        year = data.get('year', datetime.now().year)
        
        # Recupera i dati finanziari
        financial_data = FinancialData.query.filter_by(
            user_id=user_id,
            month=month,
            year=year
        ).first()
        
        if not financial_data:
            return jsonify({'error': 'Nessun dato disponibile per il periodo selezionato'}), 404
        
        # Calcoli
        ricavi_totali = (financial_data.ricavi_servizi or 0) + (financial_data.ricavi_prodotti or 0) + (financial_data.altri_ricavi or 0)
        costi_variabili = (financial_data.costo_merci or 0) + (financial_data.provvigioni or 0) + (financial_data.marketing_variabile or 0)
        costi_fissi = (financial_data.affitto or 0) + (financial_data.stipendi or 0) + (financial_data.utenze or 0) + (financial_data.marketing_fisso or 0) + (financial_data.altri_costi_fissi or 0)
        totale_costi = costi_variabili + costi_fissi
        utile_netto = ricavi_totali - totale_costi
        margine_percentuale = (utile_netto / ricavi_totali * 100) if ricavi_totali > 0 else 0
        
        return jsonify({
            'user': {
                'business_name': user.business_name,
                'business_type': user.business_type,
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email
            },
            'period': {
                'month': month,
                'year': year
            },
            'data': {
                'ricavi_servizi': financial_data.ricavi_servizi or 0,
                'ricavi_prodotti': financial_data.ricavi_prodotti or 0,
                'altri_ricavi': financial_data.altri_ricavi or 0,
                'ricavi_totali': ricavi_totali,
                'costo_merci': financial_data.costo_merci or 0,
                'provvigioni': financial_data.provvigioni or 0,
                'marketing_variabile': financial_data.marketing_variabile or 0,
                'costi_variabili': costi_variabili,
                'affitto': financial_data.affitto or 0,
                'stipendi': financial_data.stipendi or 0,
                'utenze': financial_data.utenze or 0,
                'marketing_fisso': financial_data.marketing_fisso or 0,
                'altri_costi_fissi': financial_data.altri_costi_fissi or 0,
                'costi_fissi': costi_fissi,
                'totale_costi': totale_costi,
                'utile_netto': utile_netto,
                'margine_percentuale': margine_percentuale
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

