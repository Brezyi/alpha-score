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
          {/* §1 Geltungsbereich */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 1 Geltungsbereich und Anbieter</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") regeln das Vertragsverhältnis zwischen der FaceRank (nachfolgend "Anbieter", "wir" oder "uns") und allen natürlichen oder juristischen Personen (nachfolgend "Nutzer", "Kunde" oder "Sie"), die unsere Webapplikation FaceRank (nachfolgend "App", "Plattform" oder "Dienst") nutzen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Die AGB gelten für sämtliche über die App angebotenen Leistungen, einschließlich kostenloser und kostenpflichtiger Funktionen, unabhängig davon, ob der Zugriff über Desktop, Mobilgeräte oder andere Endgeräte erfolgt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des Nutzers werden nicht Vertragsbestandteil, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich und schriftlich zu. Diese AGB gelten auch dann, wenn der Anbieter in Kenntnis entgegenstehender oder abweichender Bedingungen des Nutzers die Leistung vorbehaltlos erbringt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Der Anbieter ist:<br /><br />
              <strong className="text-foreground">FaceRank</strong><br />
              Max Mustermann<br />
              Musterstraße 123<br />
              12345 Musterstadt<br />
              Deutschland<br /><br />
              E-Mail: kontakt@facerank.app<br />
              USt-IdNr.: DE XXX XXX XXX
            </p>
          </section>

          {/* §2 Vertragsschluss */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 2 Vertragsschluss und Registrierung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Die Darstellung der Leistungen auf unserer App stellt kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Abgabe einer Bestellung (invitatio ad offerendum) dar.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Für die Nutzung der App ist eine Registrierung erforderlich. Mit dem Absenden des Registrierungsformulars gibt der Nutzer ein verbindliches Angebot zum Abschluss eines Nutzungsvertrages ab. Der Vertrag kommt zustande, wenn der Anbieter die Registrierung durch Freischaltung des Nutzerkontos bestätigt. Die Bestätigung erfolgt automatisch per E-Mail.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Der Nutzer versichert, dass alle bei der Registrierung angegebenen Daten wahrheitsgemäß und vollständig sind. Der Nutzer ist verpflichtet, den Anbieter unverzüglich über Änderungen seiner Daten zu informieren.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Der Nutzer ist für die Geheimhaltung seiner Zugangsdaten selbst verantwortlich. Er hat den Anbieter unverzüglich zu informieren, wenn es Anhaltspunkte dafür gibt, dass ein Nutzerkonto von Dritten missbraucht wurde.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (5) Die Nutzung der App ist ausschließlich volljährigen Personen (ab 18 Jahren) gestattet. Mit der Registrierung bestätigt der Nutzer, dass er das 18. Lebensjahr vollendet hat.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (6) Es besteht kein Anspruch auf Abschluss eines Nutzungsvertrages. Der Anbieter behält sich vor, Registrierungen ohne Angabe von Gründen abzulehnen.
            </p>
          </section>

          {/* §3 Leistungsbeschreibung */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 3 Leistungsbeschreibung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) FaceRank ist eine webbasierte Plattform, die Nutzern ermöglicht, ihr äußeres Erscheinungsbild mittels KI-gestützter Analyse zu bewerten und Verbesserungsvorschläge zu erhalten. Die App bietet folgende Funktionen:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">a) Kostenlose Basisfunktionen:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Erstellung und Verwaltung eines Nutzerprofils</li>
              <li>Upload von Fotos zur Analyse (begrenzte Anzahl)</li>
              <li>Anzeige eines Basis-Looks-Scores ohne detaillierte Aufschlüsselung</li>
              <li>Teaser-Ansicht der Analyseergebnisse</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">b) Premium-Funktionen (kostenpflichtig):</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Unbegrenzte KI-gestützte Foto-Analysen</li>
              <li>Detaillierter Looks-Score mit Aufschlüsselung nach Kategorien (Gesicht, Haut, Haare, etc.)</li>
              <li>Ausführliche Stärken- und Schwächen-Analyse</li>
              <li>Personalisierter Looksmax-Plan mit konkreten Handlungsempfehlungen</li>
              <li>KI-Coach für individuelle Beratung im Chat-Format</li>
              <li>Progress Tracking und Vorher-/Nachher-Vergleiche</li>
              <li>Export der Analyseergebnisse</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Die Analyseergebnisse werden durch KI-Algorithmen erstellt und basieren auf statistischen Modellen. Sie stellen keine medizinische, psychologische oder therapeutische Beratung dar und ersetzen nicht den Besuch bei einem Arzt oder Fachexperten.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Der Anbieter bemüht sich um eine hohe Verfügbarkeit der App. Ein Anspruch auf ständige Verfügbarkeit besteht nicht. Wartungsarbeiten, technische Störungen oder höhere Gewalt können zu vorübergehenden Einschränkungen führen. Der Anbieter haftet nicht für Schäden, die durch vorübergehende Nichtverfügbarkeit entstehen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Der Anbieter behält sich vor, den Funktionsumfang der App jederzeit zu erweitern, einzuschränken oder einzustellen, sofern dies für den Nutzer zumutbar ist. Wesentliche Einschränkungen bei kostenpflichtigen Diensten werden den Nutzern rechtzeitig mitgeteilt.
            </p>
          </section>

          {/* §4 Registrierung und Nutzerkonto */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 4 Nutzerkonto und Kontosicherheit</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Jeder Nutzer darf nur ein Nutzerkonto anlegen. Die Weitergabe von Zugangsdaten an Dritte ist nicht gestattet. Die mehrfache Registrierung unter verschiedenen Identitäten ist untersagt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Der Nutzer ist verpflichtet, sein Passwort geheim zu halten und vor dem Zugriff Dritter zu schützen. Das Passwort sollte mindestens 8 Zeichen umfassen und aus einer Kombination von Buchstaben, Zahlen und Sonderzeichen bestehen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Besteht der Verdacht, dass Dritte Kenntnis von den Zugangsdaten erlangt haben, ist der Nutzer verpflichtet, sein Passwort unverzüglich zu ändern und den Anbieter zu informieren.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Der Nutzer kann sein Konto jederzeit löschen. Nach der Löschung werden alle mit dem Konto verbundenen Daten innerhalb von 30 Tagen unwiderruflich gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (5) Der Anbieter ist berechtigt, Nutzerkonten vorübergehend oder dauerhaft zu sperren, wenn der begründete Verdacht besteht, dass der Nutzer gegen diese AGB verstößt oder die App missbräuchlich nutzt.
            </p>
          </section>

          {/* §5 Preise und Zahlungsbedingungen */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 5 Preise und Zahlungsbedingungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Die Nutzung der Basisfunktionen ist kostenlos. Für Premium-Funktionen fallen die zum Zeitpunkt der Bestellung angegebenen Entgelte an. Alle Preise verstehen sich als Endpreise inklusive der gesetzlichen Mehrwertsteuer.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Folgende kostenpflichtige Optionen stehen zur Verfügung:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
              <li><strong className="text-foreground">Premium-Abonnement:</strong> 9,99 € pro Monat, automatisch verlängernd</li>
              <li><strong className="text-foreground">Lifetime-Zugang:</strong> 19,99 € einmalig, unbegrenzte Nutzungsdauer</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Die Zahlung erfolgt über den externen Zahlungsdienstleister Stripe Payments Europe Ltd. ("Stripe"). Mit der Nutzung von Stripe akzeptiert der Nutzer zusätzlich die Nutzungsbedingungen und Datenschutzrichtlinien von Stripe.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Bei Abonnements ist der Rechnungsbetrag jeweils zu Beginn des Abrechnungszeitraums im Voraus fällig. Die Abbuchung erfolgt automatisch über die hinterlegte Zahlungsmethode.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (5) Kommt der Nutzer mit der Zahlung in Verzug, ist der Anbieter berechtigt, den Zugang zu Premium-Funktionen zu sperren. Die Verpflichtung zur Zahlung des ausstehenden Betrages bleibt bestehen. Der Anbieter behält sich die Geltendmachung weiterer Verzugsschäden vor.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (6) Der Anbieter behält sich vor, die Preise mit einer Ankündigungsfrist von mindestens 4 Wochen anzupassen. Preiserhöhungen gelten nicht für bereits bezahlte Abrechnungszeiträume. Der Nutzer hat bei einer Preiserhöhung das Recht, das Abonnement zum Zeitpunkt des Inkrafttretens der Preiserhöhung zu kündigen.
            </p>
          </section>

          {/* §6 Laufzeit und Kündigung */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 6 Vertragslaufzeit und Kündigung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Nutzungsvertrag für die kostenlosen Basisfunktionen wird auf unbestimmte Zeit geschlossen und kann von beiden Seiten jederzeit ohne Einhaltung einer Frist beendet werden.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Das Premium-Abonnement hat eine Mindestlaufzeit von einem Monat und verlängert sich automatisch um jeweils einen weiteren Monat, sofern es nicht vor Ablauf des jeweiligen Abrechnungszeitraums gekündigt wird.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Die Kündigung kann erfolgen:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Über das Stripe Kundenportal (über die App erreichbar)</li>
              <li>Per E-Mail an: kuendigung@facerank.app</li>
              <li>Schriftlich an die oben genannte Adresse</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Nach wirksamer Kündigung eines Abonnements bleiben die Premium-Funktionen bis zum Ende des bezahlten Abrechnungszeitraums nutzbar. Danach wird das Konto auf den kostenlosen Funktionsumfang zurückgesetzt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (5) Der Lifetime-Zugang ist nicht kündbar und gewährt dem Nutzer dauerhaften Zugang zu den zum Kaufzeitpunkt verfügbaren Premium-Funktionen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (6) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt für beide Parteien unberührt. Ein wichtiger Grund liegt insbesondere vor, wenn der Nutzer wiederholt oder schwerwiegend gegen diese AGB verstößt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (7) Im Falle einer außerordentlichen Kündigung durch den Anbieter aufgrund von Vertragsverletzungen des Nutzers besteht kein Anspruch auf anteilige Erstattung bereits gezahlter Entgelte.
            </p>
          </section>

          {/* §7 Widerrufsrecht */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 7 Widerrufsrecht für Verbraucher</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Widerrufsbelehrung</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">Widerrufsrecht</strong><br />
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (FaceRank, Musterstraße 123, 12345 Musterstadt, E-Mail: widerruf@facerank.app) mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">Folgen des Widerrufs</strong><br />
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">Besondere Hinweise</strong><br />
              Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">Muster-Widerrufsformular</strong><br />
              (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)<br /><br />
              An FaceRank, Musterstraße 123, 12345 Musterstadt, E-Mail: widerruf@facerank.app<br /><br />
              Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Dienstleistung: _______________<br />
              Bestellt am (*) / erhalten am (*): _______________<br />
              Name des/der Verbraucher(s): _______________<br />
              Anschrift des/der Verbraucher(s): _______________<br />
              Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): _______________<br />
              Datum: _______________<br /><br />
              (*) Unzutreffendes streichen.
            </p>
          </section>

          {/* §8 Pflichten der Nutzer */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 8 Pflichten und Verantwortlichkeiten der Nutzer</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Nutzer verpflichtet sich, die App nur im Rahmen der geltenden Gesetze und dieser AGB zu nutzen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Der Nutzer darf nur Fotos von sich selbst hochladen. Das Hochladen von Fotos Dritter ohne deren ausdrückliche Einwilligung ist untersagt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Es ist insbesondere untersagt:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Inhalte hochzuladen, die rechtswidrig, beleidigend, diskriminierend, pornografisch oder anderweitig anstößig sind</li>
              <li>Die App zur Belästigung, Bedrohung oder Einschüchterung anderer Personen zu nutzen</li>
              <li>Falsche Identitäten vorzutäuschen oder sich als eine andere Person auszugeben</li>
              <li>Technische Schutzmaßnahmen zu umgehen oder zu manipulieren</li>
              <li>Automatisierte Systeme (Bots, Scraper, etc.) zur Nutzung der App einzusetzen</li>
              <li>Die App für kommerzielle Zwecke ohne vorherige schriftliche Genehmigung zu nutzen</li>
              <li>Viren, Malware oder andere schädliche Software einzuschleusen</li>
              <li>Die Infrastruktur der App übermäßig zu belasten</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Der Nutzer ist für alle unter seinem Konto vorgenommenen Handlungen verantwortlich.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (5) Bei Verstößen gegen diese Pflichten ist der Anbieter berechtigt, den betreffenden Inhalt zu entfernen, das Nutzerkonto vorübergehend oder dauerhaft zu sperren und/oder Schadensersatzansprüche geltend zu machen.
            </p>
          </section>

          {/* §9 Geistiges Eigentum */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 9 Geistiges Eigentum und Nutzungsrechte</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Alle Inhalte der App, einschließlich Texte, Grafiken, Logos, Bilder, Software und Datenbanken, sind urheberrechtlich geschützt und Eigentum des Anbieters oder seiner Lizenzgeber.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Der Nutzer erhält ein einfaches, nicht übertragbares, nicht unterlizenzierbares Recht zur Nutzung der App im Rahmen dieser AGB für die Dauer des Vertragsverhältnisses.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Der Nutzer behält alle Rechte an den von ihm hochgeladenen Fotos. Mit dem Upload räumt der Nutzer dem Anbieter das Recht ein, die Fotos zum Zwecke der Erbringung der vertraglich geschuldeten Leistungen (insbesondere der KI-Analyse) zu verarbeiten und zu speichern.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Eine darüber hinausgehende Nutzung, insbesondere eine Vervielfältigung, Verbreitung, öffentliche Zugänglichmachung oder Bearbeitung von Inhalten der App, bedarf der vorherigen schriftlichen Zustimmung des Anbieters.
            </p>
          </section>

          {/* §10 Haftung */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 10 Haftung und Gewährleistung</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, die auf einer vorsätzlichen oder fahrlässigen Pflichtverletzung des Anbieters oder seiner gesetzlichen Vertreter oder Erfüllungsgehilfen beruhen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Der Anbieter haftet unbeschränkt für sonstige Schäden, die auf einer vorsätzlichen oder grob fahrlässigen Pflichtverletzung des Anbieters oder seiner gesetzlichen Vertreter oder Erfüllungsgehilfen beruhen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (5) Die Analyseergebnisse und Empfehlungen der App dienen ausschließlich Informations- und Unterhaltungszwecken. Der Anbieter übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit oder Eignung der Analyseergebnisse für einen bestimmten Zweck.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (6) Der Anbieter haftet nicht für Schäden, die dem Nutzer dadurch entstehen, dass er auf Basis der Analyseergebnisse Maßnahmen ergreift oder unterlässt. Insbesondere ersetzt die App keine medizinische, dermatologische oder psychologische Beratung.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (7) Der Anbieter haftet nicht für Schäden, die durch höhere Gewalt, Störungen der Telekommunikationsnetze oder durch Handlungen Dritter verursacht werden, es sei denn, den Anbieter trifft ein Verschulden.
            </p>
          </section>

          {/* §11 Datenschutz */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 11 Datenschutz</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Schutz der personenbezogenen Daten unserer Nutzer ist uns wichtig. Die Verarbeitung personenbezogener Daten erfolgt im Einklang mit den geltenden datenschutzrechtlichen Bestimmungen, insbesondere der Datenschutz-Grundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Einzelheiten zur Erhebung, Verarbeitung und Nutzung personenbezogener Daten sind in unserer{" "}
              <Link to="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</Link>{" "}
              geregelt, die Bestandteil dieser AGB ist.
            </p>
          </section>

          {/* §12 Änderungen der AGB */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 12 Änderungen der AGB</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter behält sich vor, diese AGB mit Wirkung für die Zukunft zu ändern, sofern dies aus triftigen Gründen erforderlich ist und der Nutzer hierdurch nicht unangemessen benachteiligt wird. Triftige Gründe sind insbesondere Änderungen der Rechtslage, höchstrichterlicher Rechtsprechung, Marktgegebenheiten oder Geschäftspolitik.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Änderungen werden dem Nutzer mindestens 30 Tage vor ihrem Inkrafttreten per E-Mail mitgeteilt. Der Nutzer kann den Änderungen innerhalb von 30 Tagen nach Zugang der Mitteilung widersprechen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Widerspricht der Nutzer nicht innerhalb der Frist und nutzt die App nach Inkrafttreten der Änderungen weiter, gelten die geänderten AGB als angenommen. Im Falle eines Widerspruchs hat jede Partei das Recht, das Vertragsverhältnis zum Zeitpunkt des Inkrafttretens der Änderung zu kündigen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Auf die Bedeutung der Frist und die Folgen des Schweigens wird der Nutzer in der Änderungsmitteilung besonders hingewiesen.
            </p>
          </section>

          {/* §13 Schlussbestimmungen */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 13 Schlussbestimmungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG). Bei Verbrauchern gilt diese Rechtswahl nur, soweit hierdurch der durch zwingende Bestimmungen des Rechts des Staates des gewöhnlichen Aufenthalts des Verbrauchers gewährte Schutz nicht entzogen wird.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag der Geschäftssitz des Anbieters.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit, die Sie unter{" "}
              <a 
                href="https://ec.europa.eu/consumers/odr/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>{" "}
              finden. Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, so wird hierdurch die Gültigkeit der übrigen Bestimmungen nicht berührt. Anstelle der unwirksamen Bestimmung gilt diejenige wirksame Bestimmung als vereinbart, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (5) Nebenabreden, Änderungen und Ergänzungen dieses Vertrages bedürfen der Textform. Dies gilt auch für die Aufhebung dieser Klausel.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
