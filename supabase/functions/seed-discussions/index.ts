import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── Step 1: Create real auth users and profiles ──
  const seedUsers = [
    { email: "juergen.helbig@seed.local", display_name: "Jürgen Helbig", bio: "Rentner, ehemaliger Ingenieur bei Siemens. 42 Jahre in Steglitz. CDU-nah, aber kein Parteisoldat.", location: "Berlin-Steglitz" },
    { email: "leyla.yildirim@seed.local", display_name: "Leyla Yıldırım", bio: "Sozialarbeiterin in Neukölln. Eltern kamen aus der Türkei, ich bin hier geboren. Integration heißt Teilhabe.", location: "Berlin-Neukölln" },
    { email: "franziska.berger@seed.local", display_name: "Franziska Berger", bio: "Stadtplanerin beim Bezirksamt Mitte. Versuche, evidenzbasierte Politik zu machen.", location: "Berlin-Mitte" },
    { email: "kevin.schroeder@seed.local", display_name: "Kevin Schröder", bio: "Lagerist bei DHL, alleinerziehend. Politik soll für Leute wie mich was bringen.", location: "Berlin-Marzahn" },
    { email: "carla.weiss@seed.local", display_name: "Dr. Carla Weiß", bio: "Professorin für Soziologie an der HU Berlin. Forschung: urbane Ungleichheit, Gentrifizierung.", location: "Berlin-Prenzlauer Berg" },
    { email: "markus.hoffmann@seed.local", display_name: "Markus Hoffmann", bio: "Gastronom, zwei Bars in Kreuzberg. Weniger Regulierung, mehr Eigenverantwortung. FDP-Wähler.", location: "Berlin-Kreuzberg" },
    { email: "sabine.krafft@seed.local", display_name: "Sabine Krafft", bio: "Grundschullehrerin, drei Kinder. Bin für pragmatische Lösungen, nicht für Ideologie.", location: "Berlin-Tempelhof" },
    { email: "amir.hassan@seed.local", display_name: "Amir Hassan", bio: "2015 aus Syrien gekommen, jetzt Fachinformatiker. Deutschland hat mir viel gegeben.", location: "Berlin-Wedding" },
    { email: "petra.nowak@seed.local", display_name: "Petra Nowak", bio: "Klimaaktivistin, Fridays for Future Berlin. Studentin der Umweltwissenschaften an der TU.", location: "Berlin-Friedrichshain" },
    { email: "thomas.brandt@seed.local", display_name: "Thomas Brandt", bio: "Taxifahrer seit 25 Jahren. Kenne jeden Kiez. Skeptisch gegenüber Ideologen.", location: "Berlin-Charlottenburg" },
  ];

  const realUserIds: string[] = [];
  for (const u of seedUsers) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);
    if (existing) {
      realUserIds.push(existing.id);
      // Update profile
      await supabase.from("profiles").update({ display_name: u.display_name, bio: u.bio, location: u.location }).eq("user_id", existing.id);
      continue;
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "",
      email_confirm: true,
      user_metadata: { display_name: u.display_name },
    });
    if (error) {
      console.error("Auth user error:", u.email, error.message);
      continue;
    }
    realUserIds.push(data.user.id);
    // Profile is auto-created by trigger, update it
    await new Promise(r => setTimeout(r, 200));
    await supabase.from("profiles").update({ display_name: u.display_name, bio: u.bio, location: u.location }).eq("user_id", data.user.id);
  }

  if (realUserIds.length < 10) {
    return new Response(JSON.stringify({ error: "Failed to create all users", created: realUserIds.length }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const ADMIN = "993dd899-d553-478f-96f5-1c163f798027";
  const uid = (n: number) => realUserIds[n - 1]; // 1-indexed

  // ── Step 2: Create topics ──
  const topics = [
    { title: "Friedrichstraße autofrei: Erfolgsmodell oder Geschäftskiller?", description: "Die autofreie Friedrichstraße ist seit 2024 dauerhaft. Einzelhändler klagen über Umsatzrückgänge, Radfahrer feiern die neue Freiheit.", proposal: "Die autofreie Zone ausweiten, mit Lieferzeitfenstern morgens von 6-9 Uhr.", category: "Mobilität", status: "active", author_id: uid(3) },
    { title: "Müllproblem Neukölln: Warum versinkt der Bezirk im Dreck?", description: "Neukölln hat das größte Müllproblem aller Berliner Bezirke. Ursachen: hohe Dichte, zu wenig BSR, überforderte Hausverwaltungen, fehlendes Budget.", proposal: "Mehr BSR-Leerungen, Bußgelder für Hausverwaltungen, Kiezbotschafter, Pilotprojekt unterirdische Container.", category: "Stadtentwicklung", status: "active", author_id: uid(2) },
    { title: "Berliner Schulen: Brauchen wir Sozialindex-basierte Finanzierung?", description: "Die Qualität der Berliner Schulen variiert massiv nach Bezirk. Der Vorschlag einer Sozialindex-basierten Finanzierung würde Schulen in benachteiligten Kiezen mehr Mittel zuweisen.", proposal: "Berliner Schulen nach Sozialindex finanzieren: Armut, Sprachförderungsbedarf und Fluktuation berücksichtigen.", category: "Bildung", status: "active", author_id: uid(2) },
  ];

  const topicIds: string[] = [];
  for (const t of topics) {
    const { data, error } = await supabase.from("topics").insert(t).select("id").single();
    if (error) {
      console.error("Topic error:", error.message);
      // Try to find existing by title
      const { data: existing } = await supabase.from("topics").select("id").eq("title", t.title).single();
      if (existing) topicIds.push(existing.id);
      continue;
    }
    topicIds.push(data.id);
  }

  // ── Step 3: Build all posts ──
  type PostRow = { topic_id: string; author_id: string; content: string; argdown_type: string; parent_post_id: string | null; depth: number; created_at: string };
  const allPosts: PostRow[] = [];
  const parentMap: Record<string, string> = {}; // localKey -> real id (filled after insert)
  let postCounter = 0;

  const tm = (day: number, h: number, m: number) => `2026-03-${day.toString().padStart(2, "0")}T${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00+00:00`;

  // Track which posts are replies to which index
  type PostDef = { topic_id: string; author_id: string; content: string; argdown_type: string; parentIndex?: number; depth: number; created_at: string };
  
  const buildTopicPosts = (topicId: string, posts: Omit<PostDef, "topic_id">[]) => {
    const startIdx = allPosts.length;
    for (const p of posts) {
      allPosts.push({
        topic_id: topicId,
        author_id: p.author_id,
        content: p.content,
        argdown_type: p.argdown_type,
        parent_post_id: p.parentIndex !== undefined ? `__ref:${startIdx + p.parentIndex}` : null,
        depth: p.depth,
        created_at: p.created_at,
      });
    }
  };

  // ── T1: Friedrichstraße ──
  if (topicIds[0]) {
    buildTopicPosts(topicIds[0], [
      // 0
      { author_id: uid(10), content: "Ich fahre seit 25 Jahren Taxi durch Berlin. Die Friedrichstraße war vorher schon kein Vergnügen, aber jetzt ist das Chaos perfekt. Die Ausweichrouten sind komplett überlastet. Meine Fahrgäste zahlen mehr, weil ich Umwege fahren muss.", argdown_type: "concern", depth: 0, created_at: tm(10, 8, 12) },
      // 1 - reply to 0
      { author_id: uid(3), content: "Die Verkehrsdaten vom Senat zeigen, dass der Durchgangsverkehr insgesamt um 12% zurückgegangen ist. Ein Teil der Autofahrten findet einfach nicht mehr statt – die Leute steigen auf ÖPNV um.", argdown_type: "evidence", parentIndex: 0, depth: 1, created_at: tm(10, 8, 34) },
      // 2 - reply to 1
      { author_id: uid(10), content: "12% weniger Verkehr insgesamt klingt super, bis man in der Charlottenstraße im Stau steht und der Taxameter läuft. Statistik und Realität sind zwei Paar Schuhe.", argdown_type: "rebuttal", parentIndex: 1, depth: 2, created_at: tm(10, 8, 51) },
      // 3
      { author_id: uid(9), content: "Endlich kann man dort sicher Rad fahren! Vorher war die Friedrichstraße eine der gefährlichsten Straßen in Mitte. Drei Unfälle mit Schwerverletzten 2023. Seit der Sperrung: null.", argdown_type: "support", depth: 0, created_at: tm(10, 9, 5) },
      // 4
      { author_id: uid(6), content: "Mein Kollege hatte ein Restaurant an der Friedrichstraße. Musste schließen. 30% Umsatzrückgang in einem Jahr. Die Leute kommen einfach nicht mehr vorbei.", argdown_type: "objection", depth: 0, created_at: tm(10, 9, 22) },
      // 5 - reply to 4
      { author_id: uid(5), content: "Die Umsatzrückgänge sind real, aber multifaktoriell – Online-Handel, Inflation, Tourismus-Rückgang post-Corona. Vergleichbare Straßen ohne Sperrung hatten ähnliche Verluste.", argdown_type: "rebuttal", parentIndex: 4, depth: 1, created_at: tm(10, 9, 48) },
      // 6
      { author_id: uid(1), content: "Die Umsetzung war schlecht. Kein Konzept für Anwohner, keine Tiefgarage in der Nähe, keine vernünftige ÖPNV-Anbindung. Man kann nicht einfach Straßen sperren und hoffen, dass es funktioniert.", argdown_type: "concern", depth: 0, created_at: tm(10, 10, 3) },
      // 7
      { author_id: uid(7), content: "Als Mutter von drei Kindern: Ich muss meine Tochter manchmal zur Charité bringen. Vorher direkt über die Friedrichstraße, jetzt 20 Minuten Umleitung mit einem kranken Kind im Auto. Danke für nichts.", argdown_type: "concern", depth: 0, created_at: tm(10, 10, 30) },
      // 8
      { author_id: uid(2), content: "Warum nicht ein Kompromiss? Autofreie Zone tagsüber 10-20 Uhr, Durchfahrt für Taxis und Lieferverkehr morgens und abends. Barcelona macht das in den Superblocks ähnlich.", argdown_type: "alternative", depth: 0, created_at: tm(10, 11, 15) },
      // 9 - reply to 8
      { author_id: uid(9), content: "Barcelona-Modell klingt gut, aber die Superblocks dort haben Spielplätze, Bäume, echte Aufenthaltsflächen. Einfach nur zeitweise sperren bringt die Aufenthaltsqualität nicht.", argdown_type: "objection", parentIndex: 8, depth: 1, created_at: tm(10, 11, 33) },
      // 10
      { author_id: uid(8), content: "Für mich als Radfahrer ist es angenehm. Aber ich sehe auch, dass die Geschäfte leiden. Vielleicht mehr Sitzbänke und Bäume, damit Leute dort gerne verweilen? Ein Radweg allein macht keine Flaniermeile.", argdown_type: "proposal", depth: 0, created_at: tm(10, 12, 5) },
      // 11
      { author_id: uid(4), content: "Ist mir ehrlich gesagt egal ob die Friedrichstraße autofrei ist. Ich war da dreimal im Leben. Wann kriegen wir in Marzahn endlich ordentliche Radwege? Immer nur Prestigeprojekte in Mitte.", argdown_type: "question", depth: 0, created_at: tm(10, 13, 20) },
    ]);
  }

  // ── T2: Müll Neukölln ──
  if (topicIds[1]) {
    buildTopicPosts(topicIds[1], [
      // 0
      { author_id: uid(2), content: "Ich arbeite seit 12 Jahren in Neukölln mit Familien. Das Müllproblem hat viele Ursachen. Erstens: 15.000 Einwohner/km², dreimal Berliner Durchschnitt. Zweitens: Die Hausverwaltungen bestellen absichtlich zu kleine Tonnen, um Kosten zu sparen. Mittwoch ist die Tonne voll, nächste Leerung Montag. Wo soll der Müll hin?", argdown_type: "evidence", depth: 0, created_at: tm(11, 8, 0) },
      // 1 - reply to 0
      { author_id: uid(3), content: "BSR-Daten bestätigen das: Neukölln hat pro Kopf weniger Leerungen als Charlottenburg, obwohl doppelte Bevölkerungsdichte. Das ist strukturelles Versagen bei der Ressourcenverteilung.", argdown_type: "evidence", parentIndex: 0, depth: 1, created_at: tm(11, 8, 30) },
      // 2
      { author_id: uid(1), content: "Ich sage es ungern, aber ein Teil des Problems ist mangelnde Erziehung. In Steglitz funktioniert die Mülltrennung, weil die Leute es von klein auf gelernt haben. Man kann nicht erwarten, dass das ohne Anpassung funktioniert, wenn ständig neue Bewohner dazukommen, die andere Gewohnheiten haben.", argdown_type: "claim", depth: 0, created_at: tm(11, 9, 0) },
      // 3 - reply to 2
      { author_id: uid(2), content: "Jürgen, das klingt nach einer einfachen Erklärung, stimmt aber nicht. Deutsche, Türken, Araber stehen vor den gleichen überquellenden Tonnen. Das Problem ist die Infrastruktur, nicht die Herkunft der Bewohner.", argdown_type: "rebuttal", parentIndex: 2, depth: 1, created_at: tm(11, 9, 20) },
      // 4 - reply to 3
      { author_id: uid(5), content: "TU-Studien zur urbanen Abfallwirtschaft zeigen: Müllprobleme in dicht besiedelten Vierteln treten unabhängig von ethnischer Zusammensetzung auf. Moabit und Teile von Wedding haben ähnliche Probleme – und dort wohnen mehrheitlich Deutsche.", argdown_type: "evidence", parentIndex: 3, depth: 2, created_at: tm(11, 9, 45) },
      // 5
      { author_id: uid(4), content: "Wohne in Marzahn. Kein Müllproblem. Warum? Platten haben Platz für große Container, die BSR kommt regelmäßig, ordentliche Müllräume. Neukölln hat winzige Gründerzeit-Hinterhöfe. Das ist baulich ein komplett anderes Problem.", argdown_type: "alternative", depth: 0, created_at: tm(11, 10, 0) },
      // 6
      { author_id: uid(6), content: "Hausverwaltungen sind das Hauptproblem. Bestellen absichtlich zu wenig Mülltonnen, kein Hausmeister, kein Sperrmüllservice. Ordnungsamt muss härter durchgreifen. Bußgelder, die wirklich wehtun.", argdown_type: "proposal", depth: 0, created_at: tm(11, 10, 30) },
      // 7 - reply to 6
      { author_id: uid(3), content: "Bezirksamt Neukölln hat genau 3 Mitarbeiter für Ordnungswidrigkeiten im Bereich Abfall. Drei. Für 330.000 Einwohner. Bußgelder beschließen kann man – durchsetzen ist eine andere Frage.", argdown_type: "concern", parentIndex: 6, depth: 1, created_at: tm(11, 10, 50) },
      // 8
      { author_id: uid(7), content: "Neben dem Schulhof meiner Kinder: illegale Müllkippe seit Monaten. Matratzen, Kühlschränke, Farbreste. BSR hat es dreimal abgeholt, dreimal kam es wieder. Meine Tochter fragt mich: Warum macht da keiner was? Ich hab keine Antwort.", argdown_type: "concern", depth: 0, created_at: tm(11, 11, 0) },
      // 9
      { author_id: uid(9), content: "Müllproblem = Gerechtigkeitsproblem. In Zehlendorf würde eine illegale Kippe keine 24 Stunden stehen. In Neukölln seit Monaten. Die Stadt investiert nicht gleich – und das ist politisch gewollt.", argdown_type: "claim", depth: 0, created_at: tm(11, 11, 30) },
      // 10
      { author_id: uid(8), content: "In meinem Haus in Wedding: Nachbarschaft hat mehrsprachige Müllregeln aufgestellt und einen Müllbeauftragten gewählt. Seitdem deutlich besser. Manchmal hilft es, wenn Nachbarn miteinander reden, statt auf die Verwaltung zu warten.", argdown_type: "alternative", depth: 0, created_at: tm(11, 12, 0) },
      // 11
      { author_id: uid(10), content: "Unterirdische Container wie in Barcelona oder Amsterdam. Sieht besser aus, fasst mehr, kein Ratten- oder Vandalismusproblem. Wir bauen U-Bahnen für Milliarden und kriegen den Müll nicht geregelt?", argdown_type: "proposal", depth: 0, created_at: tm(11, 12, 30) },
      // 12
      { author_id: uid(5), content: "Kiezbotschafter-Modell ist am vielversprechendsten. Wien hat 'Waste Watchers': niedrigschwellige Beratung plus Ordnungswidrigkeiten melden. 30% weniger Fehlwürfe in Pilotgebieten.", argdown_type: "support", depth: 0, created_at: tm(11, 13, 0) },
      // 13
      { author_id: uid(1), content: "Ich habe nichts gegen Migration gesagt. Ich habe gesagt, dass neue Bewohner andere Gewohnheiten haben können. Das gilt für Studenten aus Schwaben genauso. Aber offenbar darf man das nicht ansprechen, ohne in eine Ecke gestellt zu werden.", argdown_type: "rebuttal", depth: 0, created_at: tm(11, 13, 30) },
      // 14 - reply to 13
      { author_id: uid(2), content: "Jürgen, das Problem ist nicht was Sie sagen, sondern was Sie implizieren. 'Erziehung' und 'andere Gewohnheiten' sind Codes, die jeder versteht. Wenn Sie strukturelle Probleme meinen, sagen Sie das auch so.", argdown_type: "objection", parentIndex: 13, depth: 1, created_at: tm(11, 13, 50) },
    ]);
  }

  // ── T3: Schulfinanzierung ──
  if (topicIds[2]) {
    buildTopicPosts(topicIds[2], [
      // 0
      { author_id: uid(2), content: "Ich unterrichte an einer Schule in Wedding mit 92% Kindern aus Familien mit Transferleistungsbezug. Wir haben die gleiche Ausstattung wie eine Schule in Zehlendorf mit 5%. Gleiche Lehrerzahl, gleiche Mittel, gleiche Erwartungen. Aber komplett andere Herausforderungen. Das ist keine Chancengleichheit – das ist organisierte Ungleichheit.", argdown_type: "claim", depth: 0, created_at: tm(12, 8, 0) },
      // 1
      { author_id: uid(5), content: "Der Sozialindex ist grundsätzlich richtig, aber die Umsetzung muss stimmen. Hamburg macht das seit 2013 – mit gemischten Ergebnissen. Die zusätzlichen Mittel versickern oft in Verwaltung statt im Klassenzimmer. Wenn Berlin das macht, braucht es klare Wirkungsmessung.", argdown_type: "concern", depth: 0, created_at: tm(12, 8, 30) },
      // 2
      { author_id: uid(1), content: "Ich bin skeptisch. Meine Enkel gehen in Steglitz zur Schule, die Klassen sind auch voll, die Lehrer auch überarbeitet. Wenn jetzt Geld umverteilt wird, heißt das weniger für uns? Das kann doch nicht die Lösung sein.", argdown_type: "objection", depth: 0, created_at: tm(12, 9, 0) },
      // 3
      { author_id: uid(3), content: "Daten aus Hamburg (KESS-Studie 2023): Schulen mit Sozialindex 1-2 haben nach Einführung der indexbasierten Finanzierung ihre Leistungswerte in Mathematik um durchschnittlich 8% verbessert. Schulen mit Index 5-6 blieben stabil. Kein messbarer Nachteil für bessergestellte Schulen.", argdown_type: "evidence", depth: 0, created_at: tm(12, 9, 30) },
      // 4
      { author_id: uid(2), content: "Was in der Debatte immer fehlt: Es geht nicht nur um Geld. Die Schulen in Neukölln und Wedding haben massive Personalfluktuation, weil niemand dort arbeiten will. Bevor wir über Geld reden, müssen wir über Arbeitsbedingungen reden.", argdown_type: "alternative", depth: 0, created_at: tm(12, 10, 0) },
      // 5
      { author_id: uid(4), content: "Mein Sohn auf der Sekundarschule hat aufgegeben. Sagt er wird eh kein Abi machen. Er ist 12. Was macht dieses System mit unseren Kindern?", argdown_type: "concern", depth: 0, created_at: tm(12, 10, 30) },
      // 6
      { author_id: uid(1), content: "Also soll die Tatsache, dass in einer Schule viele Kinder kein Deutsch sprechen, dazu führen, dass die Schule mehr Geld bekommt? Warum belohnt man schlechte Integration?", argdown_type: "objection", depth: 0, created_at: tm(12, 11, 0) },
      // 7 - reply to 6
      { author_id: uid(2), content: "Herr Helbig, das ist ein grundlegendes Missverständnis. Es geht nicht um Belohnung, sondern um Bedarfsgerechtigkeit. Ein Kind, das kein Deutsch spricht, braucht mehr Förderung. Das ist keine Bevorzugung – das ist der Versuch, gleiche Startbedingungen zu schaffen.", argdown_type: "rebuttal", parentIndex: 6, depth: 1, created_at: tm(12, 11, 15) },
      // 8
      { author_id: uid(5), content: "Vorschlag zur Synthese: 1) Grundfinanzierung pro Schüler bleibt gleich. 2) Zusätzliche Bedarfsmittel (Sprachförderung, Sozialarbeit, Schulpsychologie) werden nach Sozialindex verteilt. So fühlt sich niemand benachteiligt.", argdown_type: "proposal", depth: 0, created_at: tm(12, 11, 30) },
      // 9 - reply to 8
      { author_id: uid(7), content: "Genau das. Und bitte auch Schulsozialarbeit einbeziehen. An unserer Partnerschule in Wedding gibt es eine Sozialarbeiterin für 600 Kinder. In Zehlendorf sind es zwei für 400.", argdown_type: "support", parentIndex: 8, depth: 1, created_at: tm(12, 11, 45) },
      // 10 - reply to 8
      { author_id: uid(1), content: "Na gut, wenn die Grundfinanzierung gleich bleibt, kann ich damit leben. Aber ich will sehen, dass das kontrolliert wird und nicht einfach in irgendwelchen Verwaltungstöpfen verschwindet.", argdown_type: "support", parentIndex: 8, depth: 1, created_at: tm(12, 12, 0) },
    ]);
  }

  // ── Posts for existing topics ──
  const existingTopicIds = {
    rent: "e683e4cd-3722-4fc8-9f1a-1688802a2795",
    car: "188961de-9ede-41bd-80a0-b71788f6f374",
    dt: "cae26269-f96c-44c0-933c-4dbb0f1abe28",
    school: "4e7209da-b4f1-4f0e-a8e3-6db9cff19cbb",
  };

  // Rent cap
  buildTopicPosts(existingTopicIds.rent, [
    { author_id: uid(4), content: "Meine Miete ist in drei Jahren um 200€ gestiegen. Ich verdiene als Lagerist keine 2500 netto. Der Mietendeckel war das Einzige, was kurz geholfen hat.", argdown_type: "support", depth: 0, created_at: tm(13, 9, 0) },
    { author_id: uid(6), content: "Jeder Mietendeckel vernichtet Investitionsanreize. Weniger Neubau = weniger Angebot = noch höhere Mieten danach. Das ist das grundsätzliche Problem mit Preiskontrollen.", argdown_type: "objection", depth: 0, created_at: tm(13, 10, 0) },
    { author_id: uid(5), content: "Die Daten sind gemischt. DIW-Studie: Baugenehmigungen sanken während des Deckels, aber der bundesweite Trend war ähnlich. Kausalität schwer nachzuweisen.", argdown_type: "evidence", parentIndex: 1, depth: 1, created_at: tm(13, 10, 30) },
    { author_id: uid(1), content: "Ich bin Eigentümer einer kleinen Wohnung in Steglitz. Meine Mieterin zahlt unter Marktpreis – freiwillig. Aber wenn der Staat mir vorschreibt was ich nehmen darf, kann ich die Instandhaltung nicht bezahlen. Das Dach allein kostet 80.000€.", argdown_type: "concern", depth: 0, created_at: tm(13, 11, 0) },
    { author_id: uid(9), content: "Wohnen ist ein Grundrecht! Vonovia und Deutsche Wohnen machen Milliardenprofite, während Menschen verdrängt werden. Ein Mietendeckel ist das Minimum. Eigentlich müssten wir enteignen.", argdown_type: "claim", depth: 0, created_at: tm(13, 11, 30) },
    { author_id: uid(1), content: "\"Enteignen\" – und dann verwaltet der Berliner Senat die Wohnungen? Der gleiche Senat, der den BER verbockt hat. Na dann gute Nacht.", argdown_type: "rebuttal", parentIndex: 4, depth: 1, created_at: tm(13, 12, 0) },
    { author_id: uid(3), content: "Wien zeigt: Öffentlicher Wohnungsbau funktioniert. 60% der Wiener leben in geförderten Wohnungen. Berlin baut zu wenig und zu spät.", argdown_type: "evidence", depth: 0, created_at: tm(13, 12, 30) },
    { author_id: uid(8), content: "Das Problem ist nicht nur der Preis. Mit meinem arabischen Namen werde ich oft nicht einmal zur Besichtigung eingeladen. Diskriminierung am Wohnungsmarkt wird kaum thematisiert.", argdown_type: "concern", depth: 0, created_at: tm(13, 13, 0) },
    { author_id: uid(2), content: "Amirs Punkt wird in der Debatte zu oft übersehen. Anti-Diskriminierungsgesetze beim Wohnen werden kaum durchgesetzt. Eine unabhängige Miet-Ombudsstelle könnte helfen.", argdown_type: "proposal", depth: 0, created_at: tm(13, 13, 30) },
  ]);

  // Car-free
  buildTopicPosts(existingTopicIds.car, [
    { author_id: uid(10), content: "Autofreie Innenstadt – wie kommen Handwerker zu ihren Kunden? Wie liefert der Bäcker seine Brötchen? Ich fahre 200km am Tag, nicht aus Spaß.", argdown_type: "concern", depth: 0, created_at: tm(14, 8, 30) },
    { author_id: uid(9), content: "Oslo zeigt: Autofrei heißt nicht komplett autofrei. Lieferverkehr, Taxis, Behindertentransport sind erlaubt. Es geht nur um privaten Durchgangsverkehr.", argdown_type: "rebuttal", depth: 0, created_at: tm(14, 9, 15) },
    { author_id: uid(7), content: "Dafür, wenn gleichzeitig der ÖPNV massiv ausgebaut wird. Kein Bus im 20-Minuten-Takt und kein Nachtbus der um 1 Uhr aufhört.", argdown_type: "support", depth: 0, created_at: tm(14, 10, 30) },
    { author_id: uid(1), content: "Immer diese Skandinavien-Vergleiche. Oslo hat 700.000 Einwohner und einen Ölfonds. Berlin hat 3,7 Millionen und kein Geld. Komplett andere Voraussetzungen.", argdown_type: "objection", depth: 0, created_at: tm(14, 11, 30) },
    { author_id: uid(3), content: "Umfrage SenMVKU 2025: 62% der Berliner befürworten autofreie Zonen in der Innenstadt, aber nur 34% wollen das eigene Auto aufgeben. Das Paradox der Verkehrswende.", argdown_type: "evidence", depth: 0, created_at: tm(14, 12, 0) },
    { author_id: uid(4), content: "Leute in Marzahn brauchen das Auto zum Einkaufen. Nächster Supermarkt 1,5 km, Bus alle 20 Minuten. Macht mal autofreie Zone in Grunewald, da wohnen die mit Alternativen.", argdown_type: "objection", depth: 0, created_at: tm(14, 12, 30) },
  ]);

  // Deutschlandticket
  buildTopicPosts(existingTopicIds.dt, [
    { author_id: uid(4), content: "49€ sind schon viel für mich. 69€? Dann kann ich gleich Auto fahren. Das Ticket muss billig bleiben, sonst nutzt es den Leuten nix, die es am meisten brauchen.", argdown_type: "concern", depth: 0, created_at: tm(14, 9, 0) },
    { author_id: uid(3), content: "Vorschlag: Sozialstaffelung. 29€ für Geringverdiener, 49€ Standard, 69€ Premium mit IC/RE-Zuschlag. Gerechter als ein Einheitspreis für alle.", argdown_type: "proposal", depth: 0, created_at: tm(14, 10, 0) },
    { author_id: uid(10), content: "Das Ticket hat mein Leben verändert. Spare 80€ im Monat. Aber die Züge sind voller, die Qualität sinkt. Kapazitätsausbau muss mithalten.", argdown_type: "support", depth: 0, created_at: tm(14, 11, 0) },
    { author_id: uid(6), content: "Warum Milliarden in ÖPNV-Subventionen, aber nichts für Straßen? Die Autobahnen zerfallen, Brücken werden gesperrt. Reine Symbolpolitik.", argdown_type: "objection", depth: 0, created_at: tm(14, 12, 0) },
    { author_id: uid(5), content: "Studie Agora Verkehrswende: Deutschlandticket hat 2024 ca. 1,5 Mio. Tonnen CO2 eingespart. Kostet den Staat 3 Mrd./Jahr. Das ist einer der effizientesten Klimaschutzmaßnahmen überhaupt.", argdown_type: "evidence", depth: 0, created_at: tm(14, 12, 30) },
    { author_id: uid(1), content: "Klimaschutz hin oder her – wenn der RE1 jeden zweiten Tag ausfällt, fahre ich halt wieder Auto. Zuverlässigkeit vor Preis.", argdown_type: "concern", depth: 0, created_at: tm(14, 13, 0) },
  ]);

  // School reform
  buildTopicPosts(existingTopicIds.school, [
    { author_id: uid(7), content: "Als Grundschullehrerin: Die frühe Selektion mit 10 macht Kinder kaputt. Spätentwickler haben keine Chance. Und Eltern aus bildungsfernen Familien wissen oft nicht, wie sie ihre Kinder fürs Gymnasium anmelden.", argdown_type: "support", depth: 0, created_at: tm(15, 8, 45) },
    { author_id: uid(1), content: "Das Gymnasium hat sich bewährt. Meine Enkel werden dort gefördert und gefordert. Einheitsschule senkt das Niveau für alle. PISA-Ergebnisse der Gesamtschulen sprechen für sich.", argdown_type: "objection", depth: 0, created_at: tm(15, 9, 30) },
    { author_id: uid(5), content: "Die niedrigeren PISA-Ergebnisse der Gesamtschulen kommen vom Selektionseffekt, nicht von der Qualität. Finnland hat NUR Gesamtschulen und schneidet international besser ab als Deutschland.", argdown_type: "rebuttal", parentIndex: 1, depth: 1, created_at: tm(15, 9, 55) },
    { author_id: uid(8), content: "Bin mit 15 nach Deutschland gekommen, kein Wort Deutsch. Wurde der Hauptschule zugewiesen. Heute bin ich Fachinformatiker – trotz des Systems, nicht wegen ihm. Wie viele schaffen es nicht?", argdown_type: "evidence", depth: 0, created_at: tm(15, 10, 30) },
    { author_id: uid(4), content: "Mein Sohn auf der Sekundarschule hat aufgegeben. Sagt er wird eh kein Abi machen. Er ist 12. Was macht dieses System mit einem Kind, das sich schon als Verlierer sieht?", argdown_type: "concern", depth: 0, created_at: tm(15, 11, 15) },
    { author_id: uid(3), content: "PISA 2022 für Deutschland: Der Zusammenhang zwischen sozioökonomischem Hintergrund und Schulleistung ist stärker als im OECD-Durchschnitt. Das dreigliedrige System verstärkt diese Korrelation nachweislich.", argdown_type: "evidence", depth: 0, created_at: tm(15, 11, 45) },
    { author_id: uid(6), content: "Mehr Geld allein hilft nicht. Berliner Schulen haben eines der höchsten Pro-Kopf-Budgets bundesweit. Das Problem ist die Verwaltung, nicht das Geld.", argdown_type: "objection", depth: 0, created_at: tm(15, 12, 15) },
  ]);

  // ── Step 4: Insert posts with parent references resolved ──
  const insertedIds: string[] = [];
  for (let i = 0; i < allPosts.length; i++) {
    const p = { ...allPosts[i] };
    // Resolve parent references
    if (p.parent_post_id && p.parent_post_id.startsWith("__ref:")) {
      const refIdx = parseInt(p.parent_post_id.replace("__ref:", ""));
      p.parent_post_id = insertedIds[refIdx] || null;
    }
    const { data, error } = await supabase.from("posts").insert(p).select("id").single();
    if (error) {
      console.error(`Post ${i} error:`, error.message);
      insertedIds.push("");
      continue;
    }
    insertedIds.push(data.id);
  }

  // ── Step 5: Votes ──
  // Define vote patterns per post index: [upvoters, downvoters] (1-indexed user numbers)
  const votePatterns: Record<number, [number[], number[]]> = {
    // T1: Friedrichstraße
    0: [[1, 4, 6], [9]],
    1: [[5, 9, 2], [10]],
    2: [[1, 4, 6], [3]],
    3: [[2, 3, 5, 8], [6, 10]],
    4: [[1, 4, 10], []],
    5: [[3, 9, 2, 8], [6, 1]],
    6: [[4, 6, 7, 10], [9]],
    7: [[1, 4, 10], []],
    8: [[3, 7, 8, 1, 10], [9]],
    9: [[5], [6]],
    10: [[2, 3, 7], []],
    11: [[2, 8], []],
    // T2: Müll Neukölln
    12: [[5, 3, 7, 4, 8], []],
    13: [[5, 2, 9, 4], []],
    14: [[10, 6], [2, 9, 5, 8]],
    15: [[5, 9, 8, 3, 4], [1, 6]],
    16: [[3, 2, 8, 9], []],
    17: [[2, 3, 7], []],
    18: [[1, 4, 7, 10, 2], []],
    19: [[2, 5, 4, 9], []],
    20: [[1, 4, 10, 2, 8], []],
    21: [[2, 4, 8, 5], [1]],
    22: [[3, 7, 1], [9]],
    23: [[3, 7, 2, 6, 4], []],
    24: [[3, 2, 7, 8], []],
    25: [[6, 10], [2, 9]],
    26: [[5, 9, 8], [1]],
    // T3: Schulfinanzierung
    27: [[5, 3, 8, 9, 4], [1]],
    28: [[3, 7], []],
    29: [[6, 10], [2, 5, 9]],
    30: [[2, 5, 7, 9], []],
    31: [[3, 8, 4], []],
    32: [[2, 7, 8, 9], []],
    33: [[10, 6], [2, 9, 5]],
    34: [[5, 9, 8, 3], [1]],
    35: [[3, 2, 7, 8, 5, 9, 4], []],
    36: [[2, 8, 4], []],
    37: [[1, 6, 7], []],
    // Rent
    38: [[2, 8, 9], [6]],
    39: [[1, 10], [4, 9]],
    40: [[3, 7, 2, 8], []],
    41: [[6, 10], [9]],
    42: [[4, 2, 8], [1, 6, 10]],
    43: [[6, 10, 7], [9, 2]],
    44: [[5, 2, 9, 4], [6]],
    45: [[2, 5, 4, 9], []],
    46: [[5, 8, 3, 7], []],
    // Car-free
    47: [[1, 4, 6], [9]],
    48: [[3, 5, 2], [10]],
    49: [[1, 4, 8, 2, 10], []],
    50: [[6, 10], [5, 9]],
    51: [[3, 5, 7, 9], []],
    52: [[2, 8, 4], []],
    // DT
    53: [[2, 8, 7], [6]],
    54: [[5, 2, 7, 8, 4], []],
    55: [[1, 4, 7], []],
    56: [[1, 10], [9, 2, 5]],
    57: [[3, 9, 2, 5], []],
    58: [[4, 6, 10, 7], []],
    // School
    59: [[2, 5, 8, 9], [1]],
    60: [[6, 10], [2, 5, 9]],
    61: [[3, 2, 7, 9], [1]],
    62: [[2, 5, 7, 9, 4], []],
    63: [[2, 7, 8, 9], []],
    64: [[3, 5, 2], []],
    65: [[1, 6, 10], [9]],
  };

  const allVotes: { post_id: string; user_id: string; value: number }[] = [];
  for (const [idxStr, [ups, downs]] of Object.entries(votePatterns)) {
    const idx = parseInt(idxStr);
    const postId = insertedIds[idx];
    if (!postId) continue;
    for (const u of ups) allVotes.push({ post_id: postId, user_id: uid(u), value: 1 });
    for (const d of downs) allVotes.push({ post_id: postId, user_id: uid(d), value: -1 });
  }

  // Insert votes in batches
  const bs = 50;
  for (let i = 0; i < allVotes.length; i += bs) {
    const batch = allVotes.slice(i, i + bs);
    const { error } = await supabase.from("votes").insert(batch);
    if (error) console.error("Votes error:", error.message);
  }

  // Update scores
  const postScores: Record<string, number> = {};
  for (const v of allVotes) {
    postScores[v.post_id] = (postScores[v.post_id] || 0) + v.value;
  }
  for (const [pid, score] of Object.entries(postScores)) {
    if (pid) await supabase.from("posts").update({ score }).eq("id", pid);
  }

  const successPosts = insertedIds.filter(id => id !== "").length;

  return new Response(JSON.stringify({
    success: true,
    users_created: realUserIds.length,
    topics_created: topicIds.length,
    posts_created: successPosts,
    votes_created: allVotes.length,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
