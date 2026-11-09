/* Shared facts for /sustain1 and /sustain2: one source, two languages. Numbers here are the studio's own; add none without a source. */
window.STUDIO = {
  email: "YOUR_STUDIO_EMAIL",
  name: "PRODUCT STUDIO",
  stats: [
    { n: "16+", de: "Jahre IT-Beratung", en: "years in IT consulting" },
    { n: "80+", de: "mobile Apps ausgeliefert", en: "mobile apps delivered" },
    { n: "270+", de: "Websites entwickelt und gestartet", en: "websites developed and launched" },
    { n: "1", de: "Team für Website, Google, ChatGPT und Werbung", en: "team for website, Google, ChatGPT and ads" }
  ],
  services: [
    { k: "web", de: ["Website und Onlineshop", "Design, Texte und Technik aus einer Hand. Schnell auf dem Handy, DSGVO-konform, leicht zu pflegen."],
      en: ["Website and online shop", "Design, copy and engineering from one team. Fast on phones, GDPR-ready, easy to update."] },
    { k: "aeo", by: "ItGrows", de: ["Sichtbarkeit in ChatGPT und KI-Suche", "Wir sorgen dafür, dass ChatGPT, Perplexity und Gemini Ihre Website lesen können und Sie nennen, wenn Kunden nach Ihrer Leistung fragen."],
      en: ["Visibility in ChatGPT and AI search", "We make sure ChatGPT, Perplexity and Gemini can read your site and name you when customers ask for what you do."] },
    { k: "ads", de: ["Google Ads und Meta-Werbung", "Kampagnen auf Google, Instagram und Facebook, die auf Anfragen optimiert sind, mit monatlichem Bericht."],
      en: ["Google Ads and Meta ads", "Campaigns on Google, Instagram and Facebook built for enquiries, with a monthly report."] },
    { k: "aso", by: "AppsLift", de: ["Apps und App-Store-Optimierung", "Von der Idee bis zum internationalen Start: App, Plattform, KI-Produkt und Sichtbarkeit im App Store und bei Google Play."],
      en: ["Apps and app store optimisation", "From idea to international launch: app, platform, AI product and visibility on the App Store and Google Play."] }
  ],
  packs: [
    { name: { de: "Website", en: "Website" }, price: { de: "14.900 €", en: "€14,900" }, weeks: 4,
      items: { de: ["Neue Website bis 10 Seiten", "Design passend zu Ihrer Marke", "Texte und Bildauswahl", "Schnell auf Handy und Computer", "Technische Optimierung für Google", "Impressum, Datenschutz, Cookie-Einwilligung", "30 Tage Betreuung nach dem Start"],
               en: ["New website up to 10 pages", "Design that fits your brand", "Copy and image selection", "Fast on phone and desktop", "Technical optimisation for Google", "Legal notice, privacy policy, cookie consent", "30 days of support after launch"] } },
    { name: { de: "Website + Sichtbarkeit", en: "Website + Visibility" }, price: { de: "29.900 €", en: "€29,900" }, weeks: 6, hot: true,
      items: { de: ["Alles aus „Website“, bis 20 Seiten", "Inhalte für die Google-Suche", "Sichtbarkeit in ChatGPT und anderen KI-Assistenten, 3 Monate", "Google-Unternehmensprofil", "Google Ads: Einrichtung und erste Kampagne", "Monatlicher Bericht"],
               en: ["Everything in “Website”, up to 20 pages", "Content for Google search", "Visibility in ChatGPT and other AI assistants, 3 months", "Google Business Profile", "Google Ads: setup and first campaign", "Monthly report"] } },
    { name: { de: "Website + Wachstum", en: "Website + Growth" }, price: { de: "49.900 €", en: "€49,900" }, weeks: 8,
      items: { de: ["Alles aus „Website + Sichtbarkeit“", "Markenauftritt: Logo, Farben, Schriften", "Werbung auf Instagram und Facebook, 3 Monate", "Landingpages für Ihre Kampagnen", "Zweite Sprache für internationale Kunden", "Persönlicher Ansprechpartner"],
               en: ["Everything in “Website + Visibility”", "Brand identity: logo, colours, typefaces", "Instagram and Facebook ads, 3 months", "Landing pages for your campaigns", "Second language for international customers", "A dedicated contact person"] } }
  ],
  steps: [
    { de: ["Erstgespräch", "30 Minuten zu Zielen, Kunden und Zeitplan."], en: ["First call", "30 minutes on goals, customers and timeline."] },
    { de: ["Entwurf", "Sie sehen Ihre neue Startseite, bevor die Arbeit beginnt."], en: ["Draft", "You see your new home page before the work starts."] },
    { de: ["Umsetzung", "Design, Texte und Technik aus einer Hand."], en: ["Build", "Design, copy and engineering from one team."] },
    { de: ["Start", "Umzug ohne Ausfall, Weiterleitungen, Messung."], en: ["Launch", "Moving without downtime, redirects, tracking."] },
    { de: ["Sichtbarkeit", "Google, ChatGPT und Werbung bringen die Kunden."], en: ["Visibility", "Google, ChatGPT and ads bring the customers."] }
  ],
  faq: [
    { de: ["Was kostet eine Website bei Ihnen?", "Unsere Pakete beginnen bei 14.900 € netto. Für Apps, Plattformen und größere Vorhaben erstellen wir ein individuelles Angebot."],
      en: ["How much does a website cost?", "Our packages start at €14,900 excluding VAT. For apps, platforms and larger projects we make an individual offer."] },
    { de: ["Wie schnell ist meine Website online?", "Je nach Paket in 4 bis 8 Wochen ab dem Erstgespräch."], en: ["How soon is my website live?", "Depending on the package, 4 to 8 weeks from the first call."] },
    { de: ["Wem gehört die Website?", "Ihnen. Domain, Inhalte und alle Zugänge liegen bei Ihnen."], en: ["Who owns the website?", "You do. Domain, content and all access stay with you."] },
    { de: ["Was bedeutet Sichtbarkeit in ChatGPT?", "Immer mehr Kunden fragen KI-Assistenten statt einer Suchmaschine. Wir sorgen dafür, dass diese Assistenten Ihre Website lesen können und genug über Ihr Unternehmen finden, um es zu nennen."],
      en: ["What does visibility in ChatGPT mean?", "More and more customers ask AI assistants instead of a search engine. We make sure these assistants can read your website and find enough about your business to name it."] },
    { de: ["Ist die Website DSGVO-konform?", "Ja. Impressum, Datenschutzerklärung und Cookie-Einwilligung gehören zu jedem Paket. Auf Wunsch hosten wir in der EU."],
      en: ["Is the website GDPR-compliant?", "Yes. Legal notice, privacy policy and cookie consent come with every package. We can host in the EU on request."] },
    { de: ["Ist das Werbebudget im Preis enthalten?", "Nein. Das Budget für Google und Meta zahlen Sie direkt an die Plattformen. Einrichtung und Betreuung der Kampagnen sind im Paket enthalten."],
      en: ["Is the ad budget included?", "No. You pay the Google and Meta budget directly to the platforms. Setting up and running the campaigns is included."] }
  ],
  founder: {
    name: "Fabian Wilk",
    photo: "/sustain/assets/fabian-wilk.jpg",
    role: { de: "Gründer und CEO", en: "Founder and CEO" },
    hello: { de: "Hallo, ich bin Fabian.", en: "Hi, I’m Fabian." },
    text: {
      de: ["Seit 2013 begleite ich als Partner der Kanzlei W-V Law Firm in London Unternehmen bei Gründung, Struktur und Wachstum. Ich weiß, worauf es Unternehmern ankommt: klare Zusagen, feste Preise und Ergebnisse, die man sieht.",
           "Bei uns trifft diese Erfahrung auf ein Team, das selbst digitale Produkte baut und international vermarktet, darunter die App MagiScan mit über vier Millionen Installationen."],
      en: ["Since 2013 I have helped companies with formation, structure and growth as a partner at W-V Law Firm in London. I know what business owners care about: clear commitments, fixed prices and results you can see.",
           "Here that experience meets a team that builds and markets its own digital products worldwide, including the MagiScan app with more than four million installs."]
    },
    creds: [
      { de: ["Partner seit 2013", "W-V Law Firm LLP, London"], en: ["Partner since 2013", "W-V Law Firm LLP, London"] },
      { de: ["Ausbildung", "London School of Economics"], en: ["Education", "London School of Economics"] },
      { de: ["Produkt und Technologie", "Kiryl Sidarchuk, Mitgründer von MagiScan"], en: ["Product and technology", "Kiryl Sidarchuk, co-founder of MagiScan"] }
    ]
  },
  projects: [
    { id: "magiscan", name: "MagiScan", url: "https://magiscan.app/", tag: { de: "KI · 3D · App", en: "AI · 3D · App" },
      line: { de: "Aus echten Gegenständen werden 3D-Modelle, mit dem Smartphone.", en: "Real objects become 3D models, with a smartphone." },
      proof: { de: "4M+ Installationen · 16M+ 3D-Modelle", en: "4M+ installs · 16M+ 3D models" } },
    { id: "luni", name: "LUNI", url: "https://www.luni.care/", tag: { de: "Onlineshop", en: "Online shop" },
      line: { de: "Ein hochwertiger Onlineshop für koreanische Kosmetik.", en: "A premium online shop for Korean beauty." } },
    { id: "pickaclass", name: "PickAClass", url: "https://pickaclass.com/", tag: { de: "Plattform · Bildung", en: "Platform · Education" },
      line: { de: "Marktplatz für Kurse mit Suche, Kauf und Abo.", en: "A course marketplace with discovery, purchase and subscription." } },
    { id: "ava", name: "AVA", tag: { de: "Medizin · 3D", en: "Medicine · 3D" },
      line: { de: "3D-Visualisierung für die ästhetische Medizin.", en: "3D visualisation for aesthetic medicine." } },
    { id: "orthio", name: "ORTHIO", url: "https://orthio.app/", tag: { de: "Orthopädie · App", en: "Orthotics · App" },
      line: { de: "Geführter 3D-Fußscan per Smartphone für Einlagen nach Maß.", en: "Guided 3D foot scanning by smartphone for custom orthotics." } },
    { id: "freightsizer", name: "FreightSizer", tag: { de: "Logistik · KI", en: "Logistics · AI" },
      line: { de: "Frachtmaße per Scan statt per Zollstock.", en: "Cargo dimensions by scan instead of tape measure." } },
    { id: "monixa", name: "Monixa", url: "https://monixa.ai/", tag: { de: "Finanzen · KI", en: "Finance · AI" },
      line: { de: "Marktwissen und Portfolio-Werkzeuge im Web und als App.", en: "Market intelligence and portfolio tools on web and mobile." } },
    { id: "itgrows", name: "ItGrows", url: "https://www.itgrows.ai/", tag: { de: "KI · SaaS", en: "AI · SaaS" },
      line: { de: "Sichtbarkeit in ChatGPT und KI-Inhalte, die nach Ihnen klingen.", en: "Visibility in ChatGPT and AI content that sounds like you." } },
    { id: "arize", name: "ARize", tag: { de: "AR · Handel", en: "AR · Commerce" },
      line: { de: "Produkte in Augmented Reality anprobieren und platzieren.", en: "Try on and place products in augmented reality." } },
    { id: "appslift", name: "AppsLift", url: "https://ai.appslift.com/", tag: { de: "App-Store-Optimierung", en: "App store optimisation" },
      line: { de: "Damit Apps im App Store und bei Google Play gefunden werden.", en: "So apps get found on the App Store and Google Play." } },
    { id: "oyper", name: "Oyper", tag: { de: "Bilderkennung", en: "Computer vision" },
      line: { de: "Mode in Bildern und Videos erkennen und kaufbar machen.", en: "Recognising fashion in images and video and making it shoppable." } },
    { id: "deepmate", name: "DeepMate", tag: { de: "KI · Recruiting", en: "AI · Recruiting" },
      line: { de: "KI-gestützte Bewerbungsgespräche mit passenden Fragen.", en: "AI-assisted interviews with candidate-specific questions." } }
  ]
};
