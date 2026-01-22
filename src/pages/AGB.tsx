import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function AGB() {
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
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Allgemeine Geschäftsbedingungen</h1>
            <p className="text-muted-foreground">Stand: Januar 2025</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 1 Geltungsbereich</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen 
              FaceRank (nachfolgend "Anbieter") und dem Nutzer (nachfolgend "Kunde") über die 
              Nutzung der FaceRank-Plattform und -Dienste.<br /><br />
              (2) Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der 
              Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 2 Leistungsbeschreibung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter stellt dem Kunden eine webbasierte Plattform zur Verfügung, die 
              folgende Dienste umfasst:<br /><br />
              <strong className="text-foreground">a) Kostenlose Dienste:</strong><br />
              - Erstellung eines Basisprofils<br />
              - Eingeschränkte Foto-Analyse (Teaser)<br />
              - Basisbewertung (Looks Score ohne Details)<br /><br />
              <strong className="text-foreground">b) Premium-Dienste (kostenpflichtig):</strong><br />
              - Vollständige KI-gestützte Foto-Analyse<br />
              - Detaillierter Looks Score mit Stärken und Schwächen<br />
              - Personalisierter Looksmax-Plan<br />
              - KI-Coach für individuelle Beratung<br />
              - Progress Tracking<br /><br />
              (2) Die Analyse basiert auf KI-Algorithmen und stellt keine medizinische oder 
              psychologische Beratung dar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 3 Vertragsschluss und Registrierung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Die Nutzung der Dienste setzt eine Registrierung voraus. Mit der Registrierung 
              gibt der Kunde ein Angebot auf Abschluss eines Nutzungsvertrages ab.<br /><br />
              (2) Der Kunde muss bei der Registrierung wahrheitsgemäße Angaben machen und ist 
              verpflichtet, seine Zugangsdaten geheim zu halten.<br /><br />
              (3) Die Nutzung ist nur volljährigen Personen (ab 18 Jahren) gestattet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 4 Preise und Zahlungsbedingungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Die aktuellen Preise für Premium-Dienste sind auf der Website einsehbar:<br /><br />
              - Premium-Abonnement: 9,99 € pro Monat<br />
              - Lifetime-Zugang: 19,99 € einmalig<br /><br />
              (2) Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.<br /><br />
              (3) Die Zahlung erfolgt über den Zahlungsdienstleister Stripe. Es gelten zusätzlich 
              dessen Nutzungsbedingungen.<br /><br />
              (4) Bei Abonnements wird der Betrag monatlich im Voraus abgebucht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 5 Widerrufsrecht</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Widerrufsbelehrung</strong><br /><br />
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag 
              zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.<br /><br />
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung 
              (z.B. per E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.<br /><br />
              E-Mail: widerruf@facerank.app<br /><br />
              <strong className="text-foreground">Folgen des Widerrufs:</strong><br />
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen 
              erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag 
              zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 6 Kündigung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Das Premium-Abonnement kann jederzeit zum Ende des aktuellen Abrechnungszeitraums 
              gekündigt werden.<br /><br />
              (2) Die Kündigung erfolgt über das Kundenportal oder per E-Mail an kuendigung@facerank.app.<br /><br />
              (3) Nach Kündigung bleiben die Premium-Funktionen bis zum Ende des bezahlten Zeitraums 
              verfügbar. Danach wird das Konto auf den kostenlosen Funktionsumfang zurückgesetzt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 7 Nutzungsrechte und -pflichten</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Kunde erhält ein einfaches, nicht übertragbares Nutzungsrecht an den Diensten 
              für die Dauer des Vertragsverhältnisses.<br /><br />
              (2) Der Kunde verpflichtet sich:<br />
              - Nur eigene Fotos hochzuladen<br />
              - Keine rechtswidrigen Inhalte zu verbreiten<br />
              - Die Dienste nicht zu missbrauchen<br />
              - Keine automatisierten Zugriffe durchzuführen<br /><br />
              (3) Der Anbieter behält sich vor, bei Verstößen den Zugang zu sperren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 8 Haftungsbeschränkung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit.<br /><br />
              (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher 
              Vertragspflichten, begrenzt auf den vorhersehbaren, vertragstypischen Schaden.<br /><br />
              (3) Die Analyse-Ergebnisse dienen ausschließlich der Unterhaltung und Information. 
              Der Anbieter übernimmt keine Gewähr für die Richtigkeit oder Vollständigkeit.<br /><br />
              (4) Der Anbieter haftet nicht für Schäden, die durch Maßnahmen entstehen, die der 
              Kunde aufgrund der Analyse-Ergebnisse ergreift.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 9 Datenschutz</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer{" "}
              <Link to="/datenschutz" className="text-primary hover:underline">
                Datenschutzerklärung
              </Link>
              , die Bestandteil dieser AGB ist.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 10 Änderungen der AGB</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter behält sich vor, diese AGB mit Wirkung für die Zukunft zu ändern.<br /><br />
              (2) Änderungen werden dem Kunden per E-Mail mitgeteilt. Die geänderten AGB gelten 
              als angenommen, wenn der Kunde nicht innerhalb von 30 Tagen nach Zugang widerspricht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 11 Schlussbestimmungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des 
              UN-Kaufrechts.<br /><br />
              (2) Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Anbieters.<br /><br />
              (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit 
              der übrigen Bestimmungen unberührt.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
