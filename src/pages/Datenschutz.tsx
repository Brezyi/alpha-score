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
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">1. Verantwortlicher</h2>
            <p className="text-muted-foreground leading-relaxed">
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br /><br />
              <strong className="text-foreground">FaceRank</strong><br />
              Musterstraße 123<br />
              12345 Musterstadt<br />
              Deutschland<br /><br />
              E-Mail: datenschutz@facerank.app
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">2. Erhebung und Speicherung personenbezogener Daten</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Wir erheben personenbezogene Daten, wenn Sie uns diese im Rahmen Ihrer Registrierung, 
              Bestellung oder bei einer Kontaktaufnahme mitteilen. Folgende Daten werden erhoben:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>E-Mail-Adresse (für Account-Erstellung und Kommunikation)</li>
              <li>Passwort (verschlüsselt gespeichert)</li>
              <li>Hochgeladene Fotos (für die KI-Analyse)</li>
              <li>Analyse-Ergebnisse und Nutzungsdaten</li>
              <li>Zahlungsinformationen (über Stripe verarbeitet)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">3. Zweck der Datenverarbeitung</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Wir verarbeiten Ihre Daten für folgende Zwecke:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Bereitstellung unserer Dienste (KI-Analyse, Coaching)</li>
              <li>Vertragsabwicklung und Zahlungsabwicklung</li>
              <li>Kommunikation mit Ihnen</li>
              <li>Verbesserung unserer Dienste</li>
              <li>Erfüllung gesetzlicher Pflichten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">4. Rechtsgrundlage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 DSGVO:<br /><br />
              <strong className="text-foreground">a)</strong> Einwilligung für die Verarbeitung von Fotos<br />
              <strong className="text-foreground">b)</strong> Vertragserfüllung für Account und Premium-Dienste<br />
              <strong className="text-foreground">f)</strong> Berechtigtes Interesse für Analysezwecke
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">5. Speicherdauer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ihre Daten werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist 
              oder gesetzliche Aufbewahrungsfristen bestehen. Hochgeladene Fotos können Sie jederzeit 
              selbst löschen. Nach Löschung Ihres Accounts werden alle persönlichen Daten innerhalb 
              von 30 Tagen gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">6. Weitergabe an Dritte</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Wir geben Ihre Daten nur an Dritte weiter, wenn:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong className="text-foreground">Stripe:</strong> Zur Zahlungsabwicklung</li>
              <li><strong className="text-foreground">Cloud-Dienste:</strong> Zur sicheren Speicherung (DSGVO-konform)</li>
              <li><strong className="text-foreground">KI-Dienste:</strong> Zur Analyse (anonymisiert wo möglich)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">7. Ihre Rechte</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Sie haben folgende Rechte bezüglich Ihrer Daten:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong className="text-foreground">Auskunft:</strong> Über die gespeicherten Daten (Art. 15 DSGVO)</li>
              <li><strong className="text-foreground">Berichtigung:</strong> Falscher Daten (Art. 16 DSGVO)</li>
              <li><strong className="text-foreground">Löschung:</strong> Ihrer Daten (Art. 17 DSGVO)</li>
              <li><strong className="text-foreground">Einschränkung:</strong> Der Verarbeitung (Art. 18 DSGVO)</li>
              <li><strong className="text-foreground">Datenübertragbarkeit:</strong> Export Ihrer Daten (Art. 20 DSGVO)</li>
              <li><strong className="text-foreground">Widerspruch:</strong> Gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li><strong className="text-foreground">Beschwerde:</strong> Bei einer Aufsichtsbehörde</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir verwenden technisch notwendige Cookies für die Funktion der Website 
              (z.B. Session-Cookies für die Anmeldung). Diese sind für den Betrieb erforderlich 
              und werden nicht für Tracking-Zwecke verwendet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">9. Datensicherheit</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten 
              gegen Manipulation, Verlust oder unberechtigten Zugriff zu schützen. Alle Datenübertragungen 
              erfolgen verschlüsselt (TLS/SSL). Ihre Passwörter werden gehasht gespeichert.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">10. Kontakt</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br /><br />
              E-Mail: datenschutz@facerank.app
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
