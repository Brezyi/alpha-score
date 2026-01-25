import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück zur Startseite</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>
            <p className="text-muted-foreground">Stand: Januar 2025</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Einleitung */}
          <section>
            <p className="text-muted-foreground leading-relaxed">
              Der Schutz Ihrer personenbezogenen Daten ist uns ein wichtiges Anliegen. In dieser Datenschutzerklärung informieren wir Sie darüber, welche personenbezogenen Daten wir bei der Nutzung unserer Webapplikation GLOWMAXXED AI (nachfolgend "App") erheben, wie wir diese Daten verwenden und welche Rechte Ihnen zustehen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Die Verarbeitung personenbezogener Daten erfolgt stets im Einklang mit der Datenschutz-Grundverordnung (DSGVO), dem Bundesdatenschutzgesetz (BDSG) und anderen anwendbaren datenschutzrechtlichen Bestimmungen.
            </p>
          </section>

          {/* 1. Verantwortlicher */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">1. Verantwortlicher für die Datenverarbeitung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">GLOWMAXXED AI</strong><br />
              Max Mustermann<br />
              Musterstraße 123<br />
              12345 Musterstadt<br />
              Deutschland<br /><br />
              E-Mail: datenschutz@facerank.app<br />
              Telefon: +49 123 456789
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Bei Fragen zum Datenschutz können Sie sich jederzeit per E-Mail an uns wenden.
            </p>
          </section>

          {/* 2. Erhobene Daten */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">2. Welche Daten wir erheben</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir erheben und verarbeiten verschiedene Kategorien personenbezogener Daten:
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">2.1 Registrierungsdaten</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bei der Erstellung eines Nutzerkontos erheben wir:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>E-Mail-Adresse (erforderlich für Login und Kommunikation)</li>
              <li>Passwort (wird verschlüsselt/gehasht gespeichert)</li>
              <li>Zeitpunkt der Registrierung</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">2.2 Hochgeladene Inhalte</h3>
            <p className="text-muted-foreground leading-relaxed">
              Zur Nutzung unserer Analysefunktionen laden Sie Fotos hoch:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Frontalfotos des Gesichts</li>
              <li>Profilfotos (Seitenansicht)</li>
              <li>Ganzkörperfotos (optional)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Diese Fotos enthalten biometrische Daten (Gesichtsmerkmale). Die Verarbeitung erfolgt ausschließlich zum Zweck der Analyse und nur mit Ihrer ausdrücklichen Einwilligung.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">2.3 Analyseergebnisse und Nutzungsdaten</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Ergebnisse der KI-Analyse (Looks Score, Stärken, Schwächen, Empfehlungen)</li>
              <li>Chatverlauf mit dem KI-Coach</li>
              <li>Zeitstempel der Nutzung</li>
              <li>Geräte- und Browserinformationen</li>
              <li>IP-Adresse (anonymisiert gespeichert)</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">2.4 Zahlungsdaten</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bei kostenpflichtigen Diensten werden Zahlungsdaten über unseren Zahlungsdienstleister Stripe verarbeitet:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Zahlungsmethode (Kreditkarte, etc.)</li>
              <li>Transaktionsdaten</li>
              <li>Abrechnungsinformationen</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Wir selbst speichern keine vollständigen Kreditkartennummern oder Zahlungsdetails. Diese werden ausschließlich von Stripe verarbeitet.
            </p>
          </section>

          {/* 3. Zwecke der Verarbeitung */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">3. Zwecke der Datenverarbeitung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir verarbeiten Ihre personenbezogenen Daten für folgende Zwecke:
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">3.1 Bereitstellung unserer Dienste</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Erstellung und Verwaltung Ihres Nutzerkontos</li>
              <li>Durchführung der KI-gestützten Foto-Analyse</li>
              <li>Bereitstellung des KI-Coaches</li>
              <li>Speicherung und Anzeige Ihrer Analyseergebnisse</li>
              <li>Ermöglichung des Progress Trackings</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">3.2 Vertragsabwicklung</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Abwicklung von Premium-Abonnements und Einmalkäufen</li>
              <li>Zahlungsabwicklung über Stripe</li>
              <li>Verwaltung von Kündigungen und Erstattungen</li>
              <li>Bearbeitung von Widerrufsanträgen und Rückerstattungen</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">3.2a Widerrufsverfahren</h3>
            <p className="text-muted-foreground leading-relaxed">
              Im Rahmen der Ausübung Ihres Widerrufsrechts verarbeiten wir folgende Daten:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Zahlungstransaktions-ID (zur Identifikation der betroffenen Zahlung)</li>
              <li>Betrag und Währung der Erstattung</li>
              <li>Datum der ursprünglichen Zahlung</li>
              <li>Datum und Zeitpunkt des Widerrufsantrags</li>
              <li>Von Ihnen angegebener Grund (optional)</li>
              <li>Bearbeitungsstatus und ggf. Anmerkungen</li>
              <li>E-Mail-Adresse (für Statusbenachrichtigungen)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung zur Dokumentation).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong className="text-foreground">Speicherdauer:</strong> Widerrufsdaten werden für 10 Jahre aufbewahrt (steuer- und handelsrechtliche Aufbewahrungspflichten gemäß § 147 AO, § 257 HGB).
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">3.6 Kommunikation</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Versand transaktionsbezogener E-Mails (Registrierung, Zahlungsbestätigung)</li>
              <li>E-Mail-Benachrichtigungen über den Status von Widerrufsanträgen</li>
              <li>Beantwortung von Supportanfragen</li>
              <li>Information über wichtige Änderungen (AGB, Datenschutz)</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">3.7 Sicherheit und Missbrauchsprävention</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Schutz vor unbefugtem Zugriff</li>
              <li>Erkennung und Verhinderung von Missbrauch</li>
              <li>Sicherstellung der Integrität unserer Systeme</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">3.8 Verbesserung unserer Dienste</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Analyse der Nutzung zur Optimierung der Benutzerfreundlichkeit</li>
              <li>Weiterentwicklung der KI-Algorithmen (anonymisiert)</li>
              <li>Fehlerbehebung und technische Verbesserungen</li>
            </ul>
          </section>

          {/* 4. Rechtsgrundlagen */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">4. Rechtsgrundlagen der Verarbeitung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf Grundlage der folgenden Rechtsgrundlagen gemäß Art. 6 DSGVO:
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">4.1 Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die Verarbeitung Ihrer Fotos und biometrischen Daten erfolgt auf Grundlage Ihrer ausdrücklichen Einwilligung. Mit dem Hochladen Ihrer Fotos willigen Sie in die Verarbeitung zum Zweck der KI-Analyse ein. Diese Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">4.2 Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die Verarbeitung von Registrierungsdaten, Zahlungsdaten und Nutzungsdaten ist für die Erfüllung des Nutzungsvertrages erforderlich. Ohne diese Daten können wir unsere Dienste nicht erbringen.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">4.3 Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bestimmte Daten (z.B. Rechnungsdaten) müssen wir aufgrund gesetzlicher Vorschriften (insbesondere Steuerrecht) für bestimmte Zeiträume aufbewahren.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">4.4 Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              In bestimmten Fällen verarbeiten wir Daten auf Grundlage unserer berechtigten Interessen, soweit Ihre Interessen nicht überwiegen. Dies betrifft insbesondere:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Gewährleistung der IT-Sicherheit</li>
              <li>Verhinderung von Missbrauch</li>
              <li>Anonymisierte Nutzungsanalysen zur Verbesserung unserer Dienste</li>
            </ul>
          </section>

          {/* 5. Empfänger und Drittanbieter */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">5. Empfänger der Daten und Drittanbieter</h2>
            <p className="text-muted-foreground leading-relaxed">
              Zur Erbringung unserer Dienste arbeiten wir mit verschiedenen Dienstleistern zusammen, die als Auftragsverarbeiter oder eigenverantwortliche Dritte agieren:
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">5.1 Supabase (Hosting und Datenbank)</h3>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Anbieter:</strong> Supabase, Inc., 970 Toa Payoh North #07-04, Singapore 318992<br />
              <strong className="text-foreground">Verarbeitete Daten:</strong> Alle in unserer Datenbank gespeicherten Daten (Nutzerdaten, Analyseergebnisse, hochgeladene Fotos)<br />
              <strong className="text-foreground">Zweck:</strong> Hosting unserer Anwendung und Datenbanken<br />
              <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b und f DSGVO<br />
              <strong className="text-foreground">Datenschutz:</strong>{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://supabase.com/privacy
              </a>
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">5.2 Google Cloud / Gemini AI (KI-Analyse)</h3>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Anbieter:</strong> Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland<br />
              <strong className="text-foreground">Verarbeitete Daten:</strong> Hochgeladene Fotos zur Analyse<br />
              <strong className="text-foreground">Zweck:</strong> Durchführung der KI-gestützten Bildanalyse<br />
              <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)<br />
              <strong className="text-foreground">Hinweis:</strong> Die Fotos werden ausschließlich für die Analyse verwendet und nicht für das Training von KI-Modellen genutzt.<br />
              <strong className="text-foreground">Datenschutz:</strong>{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://policies.google.com/privacy
              </a>
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">5.3 Stripe (Zahlungsabwicklung)</h3>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Anbieter:</strong> Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland<br />
              <strong className="text-foreground">Verarbeitete Daten:</strong> E-Mail-Adresse, Zahlungsinformationen, Transaktionsdaten<br />
              <strong className="text-foreground">Zweck:</strong> Sichere Abwicklung von Zahlungen für Premium-Dienste<br />
              <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)<br />
              <strong className="text-foreground">Datenschutz:</strong>{" "}
              <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://stripe.com/de/privacy
              </a>
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">5.4 Weitere Empfänger</h3>
            <p className="text-muted-foreground leading-relaxed">
              Eine Weitergabe an sonstige Dritte erfolgt nur, wenn:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Sie ausdrücklich eingewilligt haben</li>
              <li>Wir gesetzlich dazu verpflichtet sind (z.B. an Strafverfolgungsbehörden)</li>
              <li>Dies zur Durchsetzung unserer Rechte erforderlich ist</li>
            </ul>
          </section>

          {/* 6. Speicherdauer */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">6. Speicherdauer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen:
            </p>
            
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
              <li><strong className="text-foreground">Kontodaten:</strong> Bis zur Löschung des Nutzerkontos, danach Löschung innerhalb von 30 Tagen</li>
              <li><strong className="text-foreground">Hochgeladene Fotos:</strong> Bis zur manuellen Löschung durch den Nutzer oder Kontolöschung</li>
              <li><strong className="text-foreground">Analyseergebnisse:</strong> Solange das Nutzerkonto besteht</li>
              <li><strong className="text-foreground">Chatverlauf mit KI-Coach:</strong> 12 Monate, danach automatische Löschung</li>
              <li><strong className="text-foreground">Rechnungsdaten:</strong> 10 Jahre (gesetzliche Aufbewahrungspflicht nach HGB/AO)</li>
              <li><strong className="text-foreground">Server-Logs:</strong> Maximal 7 Tage</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">6.1 Datenaufbewahrung bei Abo-Kündigung</h3>
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
              <p className="text-foreground font-semibold mb-2">ℹ️ Wichtig: Abo-Kündigung ≠ Kontolöschung</p>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Bei einer <strong className="text-foreground">Kündigung des Premium-Abonnements</strong> bleiben alle Ihre personenbezogenen Daten vollständig erhalten. Dies entspricht dem Grundsatz der Datenminimierung nach Art. 5 Abs. 1 lit. c DSGVO, da die Daten für die weitere Nutzung des kostenlosen Dienstes benötigt werden.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-3 text-sm">
                <li><strong className="text-foreground">Während der Laufzeit:</strong> Voller Zugriff auf alle Daten und Premium-Funktionen</li>
                <li><strong className="text-foreground">Nach Ablauf der Laufzeit:</strong> Daten bleiben im kostenlosen Konto gespeichert und zugänglich</li>
                <li><strong className="text-foreground">Reaktivierung:</strong> Bei erneuter Premium-Buchung stehen alle historischen Daten sofort wieder zur Verfügung</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed text-sm mt-3">
                <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung des kostenlosen Nutzungsvertrages)
              </p>
            </div>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">6.2 Vollständige Datenlöschung (Recht auf Löschung)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben gemäß Art. 17 DSGVO das <strong className="text-foreground">Recht auf Löschung</strong> ("Recht auf Vergessenwerden"). Um alle Ihre personenbezogenen Daten unwiderruflich zu löschen:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Nutzen Sie die Funktion <strong className="text-foreground">"Konto löschen"</strong> in Ihren Profileinstellungen</li>
              <li>Sie erhalten eine Bestätigungs-E-Mail mit einem Lösch-Link</li>
              <li>Nach Bestätigung und Passworteingabe werden <strong className="text-foreground">alle Daten unwiderruflich gelöscht</strong></li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">Folgende Daten werden bei Kontolöschung entfernt:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2 text-sm">
              <li>Alle Analysen, Scores und Ergebnisse</li>
              <li>Hochgeladene Fotos und Profilbilder</li>
              <li>KI-Coach Gespräche und Nachrichten</li>
              <li>Gamification-Daten (XP, Achievements, Streaks)</li>
              <li>Profil- und Kontoeinstellungen</li>
              <li>Support-Tickets und Kommunikation</li>
              <li>2FA-Backup-Codes und Sicherheitsdaten</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">Ausnahme:</strong> Rechnungsdaten werden aufgrund gesetzlicher Aufbewahrungspflichten (§ 147 AO, § 257 HGB) für 10 Jahre aufbewahrt und danach gelöscht.
            </p>

            <p className="text-muted-foreground leading-relaxed mt-4">
              Nach Ablauf der Speicherdauer werden die Daten unwiderruflich gelöscht oder irreversibel anonymisiert.
            </p>
          </section>

          {/* 7. Cookies und Tracking */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">7. Cookies und ähnliche Technologien</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">7.1 Was sind Cookies?</h3>
            <p className="text-muted-foreground leading-relaxed">
              Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden und bestimmte Informationen speichern. Sie ermöglichen es, Sie wiederzuerkennen und die Nutzung der App zu erleichtern.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">7.2 Technisch notwendige Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              Wir verwenden ausschließlich technisch notwendige Cookies, die für den Betrieb der App erforderlich sind:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li><strong className="text-foreground">Session-Cookies:</strong> Zur Aufrechterhaltung Ihrer Anmeldung</li>
              <li><strong className="text-foreground">Sicherheits-Cookies:</strong> Zum Schutz vor Cross-Site-Request-Forgery (CSRF)</li>
              <li><strong className="text-foreground">Präferenz-Cookies:</strong> Zur Speicherung Ihrer Einstellungen (z.B. Sprachauswahl)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong className="text-foreground">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am Betrieb der Website)
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">7.3 Keine Tracking-Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              Wir verwenden derzeit keine Tracking-Cookies, Analyse-Tools wie Google Analytics oder Werbe-Cookies. Sollte sich dies ändern, werden wir Sie darüber informieren und Ihre Einwilligung einholen.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">7.4 Verwaltung von Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie können Ihren Browser so einstellen, dass Cookies blockiert oder gelöscht werden. Bitte beachten Sie, dass dies die Funktionalität der App einschränken kann. Informationen zur Cookie-Verwaltung finden Sie in der Hilfe Ihres Browsers.
            </p>
          </section>

          {/* 8. Datensicherheit */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">8. Datensicherheit</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir setzen umfangreiche technische und organisatorische Maßnahmen ein, um Ihre Daten vor unbefugtem Zugriff, Verlust, Zerstörung oder Manipulation zu schützen:
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">8.1 Technische Maßnahmen</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong className="text-foreground">Verschlüsselung:</strong> Alle Datenübertragungen erfolgen über TLS/SSL-verschlüsselte Verbindungen (HTTPS)</li>
              <li><strong className="text-foreground">Passwort-Hashing:</strong> Passwörter werden mit modernen Hash-Algorithmen gespeichert</li>
              <li><strong className="text-foreground">Zugriffskontrolle:</strong> Strenge Zugriffsberechtigungen für Mitarbeiter und Systeme</li>
              <li><strong className="text-foreground">Firewalls:</strong> Schutz der Server durch Firewalls und Intrusion-Detection-Systeme</li>
              <li><strong className="text-foreground">Regelmäßige Backups:</strong> Zur Wiederherstellung im Notfall</li>
              <li><strong className="text-foreground">Sichere Speicherung:</strong> Fotos werden in verschlüsselten Speichern abgelegt</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">8.2 Organisatorische Maßnahmen</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Regelmäßige Sicherheitsüberprüfungen</li>
              <li>Schulung von Mitarbeitern zum Datenschutz</li>
              <li>Dokumentation von Datenverarbeitungsprozessen</li>
              <li>Verfahren zur schnellen Reaktion auf Sicherheitsvorfälle</li>
            </ul>
          </section>

          {/* 9. Ihre Rechte */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">9. Ihre Rechte als betroffene Person</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nach der DSGVO stehen Ihnen folgende Rechte zu:
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">9.1 Auskunftsrecht (Art. 15 DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben das Recht, Auskunft über die von uns verarbeiteten personenbezogenen Daten zu verlangen. Dies umfasst Informationen über Verarbeitungszwecke, Datenkategorien, Empfänger und Speicherdauer.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">9.2 Recht auf Berichtigung (Art. 16 DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben das Recht, die Berichtigung unrichtiger oder die Vervollständigung unvollständiger personenbezogener Daten zu verlangen.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">9.3 Recht auf Löschung (Art. 17 DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben das Recht, die Löschung Ihrer personenbezogenen Daten zu verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Sie können Ihr Konto und alle damit verbundenen Daten jederzeit über die Kontoeinstellungen löschen.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">9.4 Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Unter bestimmten Voraussetzungen können Sie die Einschränkung der Verarbeitung Ihrer Daten verlangen.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">9.5 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben das Recht, Ihre Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten und an einen anderen Verantwortlichen zu übermitteln.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">9.6 Widerspruchsrecht (Art. 21 DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Ihrer Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen) Widerspruch einzulegen.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">9.7 Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben das Recht, eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen. Durch den Widerruf wird die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung nicht berührt.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">9.8 Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen die DSGVO verstößt. Zuständig ist in der Regel die Aufsichtsbehörde Ihres Wohnsitzes oder unseres Firmensitzes.
            </p>
          </section>

          {/* 10. Internationale Datenübermittlung */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">10. Internationale Datenübermittlung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Einige unserer Dienstleister haben ihren Sitz außerhalb des Europäischen Wirtschaftsraums (EWR), insbesondere in den USA. Bei der Übermittlung von Daten in Drittländer stellen wir sicher, dass ein angemessenes Datenschutzniveau gewährleistet ist durch:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Angemessenheitsbeschlüsse der EU-Kommission (z.B. EU-U.S. Data Privacy Framework)</li>
              <li>Standardvertragsklauseln der EU-Kommission</li>
              <li>Binding Corporate Rules</li>
              <li>Zertifizierungen und andere Garantien gemäß Art. 46 DSGVO</li>
            </ul>
          </section>

          {/* 11. Minderjährige */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">11. Nutzung durch Minderjährige</h2>
            <p className="text-muted-foreground leading-relaxed">
              Unsere App richtet sich ausschließlich an Personen, die das 18. Lebensjahr vollendet haben. Wir erheben wissentlich keine personenbezogenen Daten von Minderjährigen. Wenn wir Kenntnis davon erlangen, dass wir personenbezogene Daten eines Minderjährigen erhoben haben, werden wir diese Daten unverzüglich löschen.
            </p>
          </section>

          {/* 12. Änderungen */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">12. Änderungen dieser Datenschutzerklärung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie an geänderte Rechtslagen oder bei Änderungen unserer Dienste anzupassen. Die jeweils aktuelle Version finden Sie stets auf unserer Website. Bei wesentlichen Änderungen werden wir Sie per E-Mail informieren.
            </p>
          </section>

          {/* 13. Kontakt */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">13. Kontakt</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bei Fragen zum Datenschutz, zur Ausübung Ihrer Rechte oder bei Beschwerden wenden Sie sich bitte an:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">FaceRank – Datenschutz</strong><br />
              Musterstraße 123<br />
              12345 Musterstadt<br />
              Deutschland<br /><br />
              E-Mail: datenschutz@facerank.app
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Wir bemühen uns, Ihre Anfragen innerhalb von 30 Tagen zu beantworten.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
