# Memory: features/partner-request-system
Updated: now

Das Partner-System wurde komplett überarbeitet. Nutzer werden nicht mehr automatisch Partner, sondern müssen:
1. Eine Partner-Anfrage senden (über `sendPartnerRequest`)
2. Der andere Nutzer muss die Anfrage annehmen oder ablehnen

Neue Tabelle `partner_requests` speichert Anfragen mit Status (pending/accepted/declined). Realtime-Updates für sofortige Benachrichtigungen. Badge-Counter im Partner-Tab zeigt offene Anfragen an.

Check-in Dialog ermöglicht tägliche Ziel-Tracking mit Mood-Score (1-5) und vordefinierten Zielen (Training, Ernährung, Schlaf, etc.). Partnerschaften können jetzt auch beendet werden.
