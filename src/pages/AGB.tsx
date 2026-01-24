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
              (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") regeln das Vertragsverhältnis zwischen der GLOMAXXED AI (nachfolgend "Anbieter", "wir" oder "uns") und allen natürlichen oder juristischen Personen (nachfolgend "Nutzer", "Kunde" oder "Sie"), die unsere Webapplikation GLOMAXXED AI (nachfolgend "App", "Plattform" oder "Dienst") nutzen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Die AGB gelten für sämtliche über die App angebotenen Leistungen, einschließlich kostenloser und kostenpflichtiger Funktionen, unabhängig davon, ob der Zugriff über Desktop, Mobilgeräte oder andere Endgeräte erfolgt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des Nutzers werden nicht Vertragsbestandteil, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich und schriftlich zu. Diese AGB gelten auch dann, wenn der Anbieter in Kenntnis entgegenstehender oder abweichender Bedingungen des Nutzers die Leistung vorbehaltlos erbringt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Der Anbieter ist:<br /><br />
              <strong className="text-foreground">GLOMAXXED AI</strong><br />
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
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 3 Leistungsbeschreibung und Art der Analyse</h2>
            <p className="text-muted-foreground leading-relaxed">
              (1) GLOMAXXED AI ist eine webbasierte Plattform für <strong className="text-foreground">Unterhaltungs- und Lifestyle-Zwecke</strong>, die Nutzern ermöglicht, ihr äußeres Erscheinungsbild mittels KI-gestützter Analyse einschätzen zu lassen und Verbesserungsvorschläge zu erhalten.
            </p>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-4">
              <p className="text-amber-400 font-semibold mb-2">⚠️ WICHTIGER HAFTUNGSAUSSCHLUSS</p>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Die von GLOMAXXED AI bereitgestellten Analysen und Bewertungen sind <strong className="text-foreground">KI-basierte ästhetische Einschätzungen zu Unterhaltungszwecken</strong>. Sie stellen <strong className="text-foreground">KEINE medizinischen, dermatologischen, psychologischen, psychiatrischen oder therapeutischen Diagnosen, Beratungen oder Behandlungsempfehlungen</strong> dar.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-3 text-sm">
                <li>Die App ersetzt <strong className="text-foreground">keinen Arzt, Dermatologen, Psychologen oder anderen Fachexperten</strong></li>
                <li>Die Ergebnisse sind <strong className="text-foreground">subjektive KI-Einschätzungen</strong> und keine objektiven Diagnosen</li>
                <li>Es werden <strong className="text-foreground">keine Aussagen über Krankheiten, Störungen oder medizinische Zustände</strong> getroffen</li>
                <li>Bei gesundheitlichen oder psychischen Bedenken wenden Sie sich bitte an einen qualifizierten Fachmann</li>
              </ul>
            </div>
            
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Die App bietet folgende Funktionen:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">a) Kostenlose Basisfunktionen:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Erstellung und Verwaltung eines Nutzerprofils</li>
              <li>Upload von Fotos zur ästhetischen Einschätzung (begrenzte Anzahl)</li>
              <li>Anzeige eines Basis-Scores ohne detaillierte Aufschlüsselung</li>
              <li>Teaser-Ansicht der Analyseergebnisse</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">b) Premium-Funktionen (kostenpflichtig):</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Unbegrenzte KI-gestützte Foto-Analysen</li>
              <li>Detaillierte Aufschlüsselung nach ästhetischen Kategorien</li>
              <li>Personalisierte Lifestyle-Tipps und Stilempfehlungen</li>
              <li>KI-Coach für individuelle Beratung zu Styling, Hautpflege und Lifestyle</li>
              <li>Progress Tracking und Vorher-/Nachher-Vergleiche</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) <strong className="text-foreground">Die Analyseergebnisse sind rein algorithmisch generierte Unterhaltungsinhalte.</strong> Sie basieren auf statistischen Modellen und spiegeln keine objektive Realität wider. Der Anbieter garantiert nicht für die Richtigkeit, Vollständigkeit oder Anwendbarkeit der Ergebnisse.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) Der Anbieter bemüht sich um eine hohe Verfügbarkeit der App. Ein Anspruch auf ständige Verfügbarkeit besteht nicht.
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
              <li><strong className="text-foreground">Lifetime-Zugang:</strong> 49,99 € einmalig, unbegrenzte Nutzungsdauer</li>
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
            
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mt-4">
              <p className="text-foreground font-semibold mb-2">ℹ️ Wichtiger Hinweis zur Datenspeicherung bei Kündigung</p>
              <p className="text-muted-foreground leading-relaxed text-sm">
                <strong className="text-foreground">Eine Kündigung des Abonnements ist keine Kontolöschung.</strong> Bei einer Abo-Kündigung bleiben alle Ihre Daten (Analysen, Fotos, Fortschritte, Coach-Gespräche, etc.) vollständig erhalten:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-3 text-sm">
                <li>Ihre Daten bleiben <strong className="text-foreground">bis zum Ende der bezahlten Laufzeit</strong> vollständig zugänglich</li>
                <li>Nach Ablauf der Laufzeit bleiben die Daten <strong className="text-foreground">im kostenlosen Konto weiterhin gespeichert</strong></li>
                <li>Sie können Ihr Konto jederzeit reaktivieren und auf alle historischen Daten zugreifen</li>
                <li>Eine <strong className="text-foreground">endgültige Datenlöschung</strong> erfolgt nur auf ausdrücklichen Wunsch durch Kontolöschung</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed text-sm mt-3">
                Zur vollständigen und unwiderruflichen Löschung aller Daten gemäß DSGVO Art. 17 nutzen Sie bitte die Funktion "Konto löschen" in Ihren Profileinstellungen.
              </p>
            </div>
            
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
            
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mt-4">
              <p className="text-foreground font-semibold mb-2">✅ Einfaches digitales Widerrufsverfahren</p>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Sie können Ihr Widerrufsrecht bequem über unsere App ausüben:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-3 text-sm">
                <li>Öffnen Sie Ihr <strong className="text-foreground">Profil</strong> in der App</li>
                <li>Klicken Sie auf <strong className="text-foreground">"Widerrufsrecht"</strong></li>
                <li>Wählen Sie die betreffende Zahlung aus</li>
                <li>Bestätigen Sie den Widerruf</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed text-sm mt-3">
                <strong className="text-foreground">Automatische Erstattung:</strong> Widerrufe innerhalb der 14-Tage-Frist werden automatisch und unverzüglich bearbeitet. Die Erstattung erfolgt über das ursprüngliche Zahlungsmittel.
              </p>
              <p className="text-muted-foreground leading-relaxed text-sm mt-2">
                <strong className="text-foreground">Spätere Anträge:</strong> Widerrufsanträge nach Ablauf der 14-Tage-Frist werden von unserem Team manuell geprüft. Sie erhalten eine E-Mail-Benachrichtigung über den Status Ihres Antrags.
              </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed mt-4">
              Alternativ können Sie uns mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong className="text-foreground">GLOMAXXED AI</strong><br />
              Musterstraße 123<br />
              12345 Musterstadt<br />
              E-Mail: widerruf@glowup-ai.de
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">Folgen des Widerrufs</strong><br />
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">Auswirkungen auf Ihr Abonnement</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bei erfolgreichem Widerruf wird Ihr Premium-Abonnement automatisch gekündigt. Sie behalten jedoch Zugang zu Ihrem kostenlosen Nutzerkonto und allen gespeicherten Daten (Analysen, Fotos, etc.). Eine erneute Buchung ist jederzeit möglich.
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3 text-foreground">Status Ihrer Widerrufsanträge</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sie können den Status Ihrer Widerrufsanträge jederzeit in Ihrem Profil unter <strong className="text-foreground">"Anträge ansehen"</strong> einsehen. Dort finden Sie eine Übersicht aller eingereichten Anträge mit aktuellem Bearbeitungsstatus und ggf. Anmerkungen unseres Teams.
            </p>
            
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong className="text-foreground">Besondere Hinweise</strong><br />
              Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
            </p>
            <div className="mt-6 border border-border rounded-xl p-6 bg-card print:bg-white print:text-black">
              <div className="flex items-center justify-between mb-4">
                <p className="text-foreground font-semibold">Muster-Widerrufsformular</p>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors print:hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                  Drucken / PDF
                </button>
              </div>
              <p className="text-muted-foreground text-sm mb-4 print:text-gray-600">
                (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)
              </p>
              <div className="space-y-4 text-sm">
                <div className="border-b border-border pb-3 print:border-gray-300">
                  <p className="text-foreground font-medium print:text-black">An:</p>
                  <p className="text-muted-foreground print:text-gray-700">
                    GLOMAXXED AI<br />
                    Musterstraße 123<br />
                    12345 Musterstadt<br />
                    E-Mail: widerruf@glowup-ai.de
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-muted-foreground print:text-gray-700">
                    Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Dienstleistung:
                  </p>
                  <div className="border-b border-dashed border-muted-foreground/50 h-8 print:border-gray-400"></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1 print:text-gray-600">Bestellt am (*) / erhalten am (*):</p>
                      <div className="border-b border-dashed border-muted-foreground/50 h-6 print:border-gray-400"></div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1 print:text-gray-600">Datum:</p>
                      <div className="border-b border-dashed border-muted-foreground/50 h-6 print:border-gray-400"></div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-xs mb-1 print:text-gray-600">Name des/der Verbraucher(s):</p>
                    <div className="border-b border-dashed border-muted-foreground/50 h-6 print:border-gray-400"></div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-xs mb-1 print:text-gray-600">Anschrift des/der Verbraucher(s):</p>
                    <div className="border-b border-dashed border-muted-foreground/50 h-6 print:border-gray-400"></div>
                    <div className="border-b border-dashed border-muted-foreground/50 h-6 mt-2 print:border-gray-400"></div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-xs mb-1 print:text-gray-600">Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):</p>
                    <div className="border-b border-dashed border-muted-foreground/50 h-10 print:border-gray-400"></div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic mt-4 print:text-gray-500">
                  (*) Unzutreffendes streichen.
                </p>
              </div>
            </div>
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
            <h2 className="text-xl font-semibold mb-4 text-foreground">§ 10 Haftungsausschluss und Gewährleistung</h2>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 font-semibold mb-2">🚨 AUSDRÜCKLICHER HAFTUNGSAUSSCHLUSS</p>
              <p className="text-muted-foreground leading-relaxed text-sm">
                <strong className="text-foreground">GLOMAXXED AI ist ein Unterhaltungs- und Lifestyle-Produkt.</strong> Jegliche Äußerungen, Scores, Bewertungen oder Empfehlungen der App sind <strong className="text-foreground">KEINE</strong>:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2 text-sm">
                <li>Medizinischen Diagnosen oder Gesundheitsberatungen</li>
                <li>Psychologischen oder psychiatrischen Bewertungen</li>
                <li>Aussagen über körperliche oder geistige "Defekte" oder "Störungen"</li>
                <li>Therapeutische Empfehlungen jeglicher Art</li>
                <li>Aussagen über den objektiven "Wert" oder die "Attraktivität" einer Person</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed text-sm mt-3">
                Die App trifft <strong className="text-foreground">keine Aussagen darüber, ob ein Gesicht, Körper oder Erscheinungsbild "schlecht", "krank", "gestört" oder "fehlerhaft" ist</strong>. Alle Ergebnisse sind rein algorithmische Unterhaltungsinhalte ohne jeglichen Anspruch auf medizinische oder wissenschaftliche Validität.
              </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              (1) Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, die auf einer vorsätzlichen oder fahrlässigen Pflichtverletzung des Anbieters beruhen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (2) Der Anbieter haftet unbeschränkt für sonstige Schäden, die auf einer vorsätzlichen oder grob fahrlässigen Pflichtverletzung beruhen.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (3) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). Die Haftung ist auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (4) <strong className="text-foreground">Die Analyseergebnisse und Empfehlungen der App dienen ausschließlich Unterhaltungs- und Lifestyle-Zwecken.</strong> Der Anbieter übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit, Eignung oder Anwendbarkeit der Analyseergebnisse für einen bestimmten Zweck.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (5) Der Anbieter haftet <strong className="text-foreground">ausdrücklich nicht</strong> für:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
              <li>Psychische Belastungen durch die Nutzung der App</li>
              <li>Fehlentscheidungen basierend auf Analyseergebnissen</li>
              <li>Kosten für medizinische, kosmetische oder therapeutische Behandlungen</li>
              <li>Schäden durch nicht-professionelle Selbstbehandlung</li>
              <li>Jegliche gesundheitliche Auswirkungen der Nutzung</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (6) <strong className="text-foreground">Die App ersetzt keine medizinische, dermatologische, psychologische oder therapeutische Beratung.</strong> Bei gesundheitlichen, kosmetischen oder psychischen Bedenken wenden Sie sich bitte an einen qualifizierten Fachmann.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              (7) Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.
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
