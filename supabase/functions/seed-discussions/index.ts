import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const users = [
    { id: "a1000001-0000-0000-0000-000000000001", display_name: "Jürgen Helbig", username: "juergen-helbig", bio: "Rentner, ehemaliger Ingenieur bei Siemens. 42 Jahre in Steglitz. CDU-nah, aber kein Parteisoldat.", location: "Berlin-Steglitz" },
    { id: "a1000001-0000-0000-0000-000000000002", display_name: "Leyla Yıldırım", username: "leyla-yildirim", bio: "Sozialarbeiterin in Neukölln. Eltern kamen aus der Türkei, ich bin hier geboren. Integration heißt Teilhabe.", location: "Berlin-Neukölln" },
    { id: "a1000001-0000-0000-0000-000000000003", display_name: "Franziska Berger", username: "franziska-berger", bio: "Stadtplanerin beim Bezirksamt Mitte. Versuche, evidenzbasierte Politik zu machen.", location: "Berlin-Mitte" },
    { id: "a1000001-0000-0000-0000-000000000004", display_name: "Kevin Schröder", username: "kevin-schroeder", bio: "Lagerist bei DHL, alleinerziehend. Politik soll für Leute wie mich was bringen.", location: "Berlin-Marzahn" },
    { id: "a1000001-0000-0000-0000-000000000005", display_name: "Dr. Carla Weiß", username: "carla-weiss", bio: "Professorin für Soziologie an der HU Berlin. Forschung: urbane Ungleichheit, Gentrifizierung.", location: "Berlin-Prenzlauer Berg" },
    { id: "a1000001-0000-0000-0000-000000000006", display_name: "Markus Hoffmann", username: "markus-hoffmann", bio: "Gastronom, zwei Bars in Kreuzberg. Weniger Regulierung, mehr Eigenverantwortung. FDP-Wähler.", location: "Berlin-Kreuzberg" },
    { id: "a1000001-0000-0000-0000-000000000007", display_name: "Sabine Krafft", username: "sabine-krafft", bio: "Grundschullehrerin, drei Kinder. Bin für pragmatische Lösungen, nicht für Ideologie.", location: "Berlin-Tempelhof" },
    { id: "a1000001-0000-0000-0000-000000000008", display_name: "Amir Hassan", username: "amir-hassan", bio: "2015 aus Syrien gekommen, jetzt Fachinformatiker. Deutschland hat mir viel gegeben.", location: "Berlin-Wedding" },
    { id: "a1000001-0000-0000-0000-000000000009", display_name: "Petra Nowak", username: "petra-nowak", bio: "Klimaaktivistin, Fridays for Future Berlin. Studentin der Umweltwissenschaften an der TU.", location: "Berlin-Friedrichshain" },
    { id: "a1000001-0000-0000-0000-000000000010", display_name: "Thomas Brandt", username: "thomas-brandt", bio: "Taxifahrer seit 25 Jahren. Kenne jeden Kiez. Skeptisch gegenüber Ideologen.", location: "Berlin-Charlottenburg" },
  ];

  for (const u of users) {
    await supabase.from("profiles").upsert({ user_id: u.id, display_name: u.display_name, username: u.username, bio: u.bio, location: u.location }, { onConflict: "user_id" });
  }

  const uid = (n: number) => users[n - 1].id;

  const topics = [
    { id: "b2000001-0000-0000-0000-000000000001", title: "Friedrichstraße autofrei: Erfolgsmodell oder Geschäftskiller?", description: "Die autofreie Friedrichstraße ist seit 2024 dauerhaft. Einzelhändler klagen über Umsatzrückgänge, Radfahrer feiern die neue Freiheit.", proposal: "Die autofreie Zone ausweiten, mit Lieferzeitfenstern morgens von 6-9 Uhr.", category: "Mobilität", status: "active", author_id: uid(3), slug: "friedrichstrasse-autofrei" },
    { id: "b2000001-0000-0000-0000-000000000002", title: "Mietendeckel 2.0: Braucht Berlin einen neuen Anlauf?", description: "Nach dem Scheitern des Mietendeckels vor dem BVerfG fordern viele einen bundesweiten Ansatz.", proposal: "Bundesgesetzlichen Mietendeckel einführen, max. 2% pro Jahr über Inflationsrate.", category: "Wohnen", status: "seeking-consensus", author_id: uid(5), slug: "mietendeckel-2-0-neuer-anlauf" },
    { id: "b2000001-0000-0000-0000-000000000003", title: "Görlitzer Park: Mehr Polizei oder mehr Sozialarbeit?", description: "Der Görli bleibt Berlins umstrittenster Park. Zwischen Zaun-Debatte, Drogenhandel und Nutzungskonflikten.", proposal: "Integriertes Konzept aus Streetwork, Konsumräumen am Parkrand und gezielter Polizeipräsenz.", category: "Öffentliche Sicherheit", status: "active", author_id: uid(2), slug: "goerlitzer-park-polizei-oder-sozialarbeit" },
    { id: "b2000001-0000-0000-0000-000000000004", title: "Integrationskurse reformieren: Was brauchen Neuankommende wirklich?", description: "Die bestehenden Integrationskurse gelten als bürokratisch und praxisfern.", proposal: "Dezentrale Kurse in Nachbarschaftszentren mit Kinderbetreuung und berufsbezogenen Modulen ab Tag 1.", category: "Integration", status: "active", author_id: uid(8), slug: "integrationskurse-reformieren" },
    { id: "b2000001-0000-0000-0000-000000000005", title: "E-Scooter in Berlin: Regulieren, verbieten oder laufen lassen?", description: "Tausende E-Scooter blockieren Gehwege, landen im Kanal und verursachen Unfälle.", proposal: "Feste Abstellzonen, Höchstzahl pro Bezirk, Anbieter für Räumungskosten haftbar machen.", category: "Mobilität", status: "active", author_id: uid(7), slug: "e-scooter-berlin-regulieren" },
    { id: "b2000001-0000-0000-0000-000000000006", title: "Müllproblem Neukölln: Warum versinkt der Bezirk im Dreck?", description: "Neukölln hat das größte Müllproblem aller Berliner Bezirke. Ursachen: hohe Dichte, zu wenig BSR, überforderte Hausverwaltungen, fehlendes Budget.", proposal: "Mehr BSR-Leerungen, Bußgelder für Hausverwaltungen, Kiezbotschafter, Pilotprojekt unterirdische Container.", category: "Stadtentwicklung", status: "active", author_id: uid(2), slug: "muellproblem-neukoelln" },
  ];

  for (const tp of topics) {
    await supabase.from("topics").upsert(tp, { onConflict: "id" });
  }

  type P = { id: string; topic_id: string; author_id: string; content: string; argdown_type: string; parent_post_id?: string; depth?: number; created_at: string };
  let pc = 0;
  const pid = () => { pc++; return `c3000001-0000-0000-0000-00000000${pc.toString(16).padStart(4,"0")}`; };
  const allPosts: P[] = [];
  const allVotes: { post_id: string; user_id: string; value: number }[] = [];
  const av = (pid: string, ups: number[], downs: number[]) => { for (const u of ups) allVotes.push({ post_id: pid, user_id: uid(u), value: 1 }); for (const d of downs) allVotes.push({ post_id: pid, user_id: uid(d), value: -1 }); };
  const tm = (h: number, m: number) => `2026-03-10T${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:00+00:00`;

  // T1: Friedrichstraße
  const t1 = topics[0].id;
  let p = pid(); allPosts.push({ id: p, topic_id: t1, author_id: uid(10), content: "Ich fahre seit 25 Jahren Taxi durch Berlin. Die Friedrichstraße war vorher schon kein Vergnügen, aber jetzt ist das Chaos perfekt. Die Ausweichrouten sind komplett überlastet. Meine Fahrgäste zahlen mehr, weil ich Umwege fahren muss.", argdown_type: "concern", created_at: tm(8,12) }); av(p,[1,4,6],[9]);
  let p2 = pid(); allPosts.push({ id: p2, topic_id: t1, author_id: uid(3), content: "Die Verkehrsdaten vom Senat zeigen, dass der Durchgangsverkehr insgesamt um 12% zurückgegangen ist. Ein Teil der Autofahrten findet einfach nicht mehr statt.", argdown_type: "evidence", parent_post_id: p, depth: 1, created_at: tm(8,34) }); av(p2,[5,9,2],[10]);
  let p3 = pid(); allPosts.push({ id: p3, topic_id: t1, author_id: uid(10), content: "12% weniger Verkehr insgesamt klingt super, bis man in der Charlottenstraße im Stau steht und der Taxameter läuft. Statistik und Realität sind zwei Paar Schuhe.", argdown_type: "rebuttal", parent_post_id: p2, depth: 2, created_at: tm(8,51) }); av(p3,[1,4,6],[3]);
  p = pid(); allPosts.push({ id: p, topic_id: t1, author_id: uid(9), content: "Endlich kann man dort sicher Rad fahren! Vorher war die Friedrichstraße eine der gefährlichsten Straßen in Mitte. Drei Unfälle mit Schwerverletzten 2023. Seit der Sperrung: null.", argdown_type: "support", created_at: tm(9,5) }); av(p,[2,3,5,8],[6,10]);
  p = pid(); allPosts.push({ id: p, topic_id: t1, author_id: uid(6), content: "Mein Kollege hatte ein Restaurant an der Friedrichstraße. Musste schließen. 30% Umsatzrückgang. Die Leute kommen einfach nicht mehr.", argdown_type: "objection", created_at: tm(9,22) }); av(p,[1,4,10],[]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t1, author_id: uid(5), content: "Die Umsatzrückgänge sind real, aber multifaktoriell – Online-Handel, Inflation, Tourismus-Rückgang. Vergleichbare Straßen ohne Sperrung hatten ähnliche Verluste.", argdown_type: "rebuttal", parent_post_id: p, depth: 1, created_at: tm(9,48) }); av(p2,[3,9,2,8],[6,1]);
  p = pid(); allPosts.push({ id: p, topic_id: t1, author_id: uid(1), content: "Die Umsetzung ist schlecht. Kein Konzept für Anwohner, keine Tiefgarage, keine gute ÖPNV-Anbindung. Man kann nicht einfach Straßen sperren und hoffen.", argdown_type: "concern", created_at: tm(10,3) }); av(p,[4,6,7,10],[9]);
  p = pid(); allPosts.push({ id: p, topic_id: t1, author_id: uid(7), content: "Als Mutter: Ich muss meine Tochter manchmal zur Charité bringen. Vorher direkt über die Friedrichstraße. Jetzt 20 Minuten Umleitung mit krankem Kind.", argdown_type: "concern", created_at: tm(10,30) }); av(p,[1,4,10],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t1, author_id: uid(2), content: "Warum nicht Kompromiss? Autofreie Zone tagsüber, Durchfahrt für Taxis und Lieferverkehr morgens und abends. Barcelona macht das.", argdown_type: "alternative", created_at: tm(11,15) }); av(p,[3,7,8,1,10],[9]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t1, author_id: uid(9), content: "Barcelona-Modell klingt gut, aber die Superblocks dort haben Spielplätze, Bäume, Aufenthaltsflächen. Einfach zeitweise sperren bringt die Qualität nicht.", argdown_type: "objection", parent_post_id: p, depth: 1, created_at: tm(11,33) }); av(p2,[5],[6]);
  p = pid(); allPosts.push({ id: p, topic_id: t1, author_id: uid(8), content: "Für mich als Radfahrer ist es angenehm. Aber ich sehe auch, dass Geschäfte leiden. Mehr Sitzbänke und Bäume, damit Leute verweilen wollen?", argdown_type: "proposal", created_at: tm(12,5) }); av(p,[2,3,7],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t1, author_id: uid(4), content: "Ist mir egal ob die Friedrichstraße autofrei ist. Ich war da dreimal im Leben. Wann kriegen wir in Marzahn ordentliche Radwege?", argdown_type: "question", created_at: tm(13,20) }); av(p,[2,8],[]);

  // T2: Mietendeckel
  const t2 = topics[1].id;
  p = pid(); allPosts.push({ id: p, topic_id: t2, author_id: uid(4), content: "Meine Miete ist in drei Jahren um 200€ gestiegen. Ich verdiene als Lagerist keine 2500 netto. Der Mietendeckel war das Einzige, was kurz geholfen hat.", argdown_type: "support", created_at: tm(8,0) }); av(p,[2,7,8,9],[6]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t2, author_id: uid(6), content: "Der Mietendeckel hat Investoren vertrieben. Weniger Neubau = weniger Angebot = noch höhere Mieten danach. Das Problem mit Preiskontrollen.", argdown_type: "objection", parent_post_id: p, depth: 1, created_at: tm(8,25) }); av(p2,[1,10],[4,9]);
  p3 = pid(); allPosts.push({ id: p3, topic_id: t2, author_id: uid(5), content: "Die Daten sind gemischt. DIW: Baugenehmigungen sanken, aber bundesweiter Trend war ähnlich. Kausalität schwer nachzuweisen.", argdown_type: "evidence", parent_post_id: p2, depth: 2, created_at: tm(8,52) }); av(p3,[3,7,2,8],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t2, author_id: uid(1), content: "Ich bin Eigentümer einer kleinen Wohnung in Steglitz. Meine Mieterin zahlt unter Marktpreis. Aber wenn der Staat vorschreibt was ich nehmen darf, kann ich die Instandhaltung nicht bezahlen. Das Dach kostet 80.000€.", argdown_type: "concern", created_at: tm(9,15) }); av(p,[6,10],[9]);
  p = pid(); allPosts.push({ id: p, topic_id: t2, author_id: uid(9), content: "Wohnen ist ein Grundrecht! Vonovia und Deutsche Wohnen machen Milliardenprofite, während Menschen verdrängt werden. Ein Mietendeckel ist das Minimum. Eigentlich müssten wir enteignen.", argdown_type: "claim", created_at: tm(9,40) }); av(p,[4,2,8],[1,6,10]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t2, author_id: uid(1), content: "\"Enteignen\" – und dann verwaltet der Berliner Senat die Wohnungen. Der gleiche Senat, der den BER verbockt hat. Na dann gute Nacht.", argdown_type: "rebuttal", parent_post_id: p, depth: 1, created_at: tm(10,0) }); av(p2,[6,10,7],[9,2]);
  p = pid(); allPosts.push({ id: p, topic_id: t2, author_id: uid(3), content: "Wien zeigt: Öffentlicher Wohnungsbau funktioniert. 60% leben in geförderten Wohnungen. Berlin baut zu wenig und zu spät.", argdown_type: "evidence", created_at: tm(10,30) }); av(p,[5,2,9,4],[6]);
  p = pid(); allPosts.push({ id: p, topic_id: t2, author_id: uid(7), content: "Können wir aufhören, Wien und Berlin zu vergleichen? Wien baut seit den 1920ern systematisch. Was wir JETZT brauchen, sind pragmatische Lösungen.", argdown_type: "objection", created_at: tm(11,10) }); av(p,[1,10],[5]);
  p = pid(); allPosts.push({ id: p, topic_id: t2, author_id: uid(8), content: "Das Problem ist nicht nur der Preis, sondern die Diskriminierung. Mit meinem arabischen Namen werde ich oft nicht zur Besichtigung eingeladen.", argdown_type: "concern", created_at: tm(11,45) }); av(p,[2,5,4,9],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t2, author_id: uid(2), content: "Amirs Punkt wird in der Debatte oft übersehen. Anti-Diskriminierungsgesetze beim Wohnen werden kaum durchgesetzt. Eine Miet-Ombudsstelle könnte helfen.", argdown_type: "proposal", created_at: tm(12,5) }); av(p,[5,8,3,7],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t2, author_id: uid(10), content: "Ich höre jeden Tag Miet-Geschichten im Taxi. Rentnerin aus Schöneberg: 1.200€ warm für 55qm. Rente: 1.400. Irgendwas muss passieren.", argdown_type: "question", created_at: tm(13,0) }); av(p,[4,7,2],[]);

  // T3: Görlitzer Park
  const t3 = topics[2].id;
  p = pid(); allPosts.push({ id: p, topic_id: t3, author_id: uid(1), content: "Der Zaun war richtig. Punkt. Seit der Zaun steht ist es deutlich ruhiger. Meine Bekannte an der Görlitzer Straße schläft wieder durch.", argdown_type: "claim", created_at: tm(8,20) }); av(p,[10,7],[2,9,5]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t3, author_id: uid(2), content: "Der Zaun hat das Problem nur verschoben. Der Drogenhandel ist jetzt im Wrangelkiez, am Kotti, im Görlitzer Bahnhof. Für die Anwohner dort ist es schlimmer.", argdown_type: "rebuttal", parent_post_id: p, depth: 1, created_at: tm(8,45) }); av(p2,[5,9,8],[1]);
  p = pid(); allPosts.push({ id: p, topic_id: t3, author_id: uid(9), content: "Der Görli war immer ein Ort der Freiheit, der Subkultur. Jetzt kommt ein Zaun drum. Das ist Disneyfizierung. Als nächstes: Eintritt für den Mauerpark?", argdown_type: "objection", created_at: tm(9,0) }); av(p,[6],[1,7,10]);
  p = pid(); allPosts.push({ id: p, topic_id: t3, author_id: uid(7), content: "Sorry, als Mutter: Subkultur ist schön, aber meine 7-Jährige sollte nicht an Spritzen vorbeilaufen. Das hat nichts mit Disneyfizierung zu tun.", argdown_type: "objection", created_at: tm(9,30) }); av(p,[1,10,4],[9]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t3, author_id: uid(2), content: "Genau dafür gibt es Konsumräume. Weniger Spritzen im Park. Pragmatische Gesundheitspolitik. Frankfurt hat damit gute Erfahrungen.", argdown_type: "alternative", parent_post_id: p, depth: 1, created_at: tm(9,50) }); av(p2,[5,3,8],[1]);
  p = pid(); allPosts.push({ id: p, topic_id: t3, author_id: uid(5), content: "Forschungslage zu Drug Consumption Rooms ist klar: weniger Überdosen, weniger HIV, weniger öffentlicher Konsum. Evidenz aus Frankfurt, Hamburg, Zürich ist robust.", argdown_type: "evidence", created_at: tm(10,20) }); av(p,[3,2,8,9],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t3, author_id: uid(4), content: "Warum wird sowas nie in Zehlendorf diskutiert? Dort gibt es auch Drogenprobleme. Ist halt ein Kiez wo arme Leute wohnen.", argdown_type: "question", created_at: tm(11,0) }); av(p,[2,8,9],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t3, author_id: uid(6), content: "Ich habe eine Bar am Görlitzer Bahnhof. Seit dem Zaun kommen mehr Touristen, Umsatz gestiegen. Manchmal muss man einfach handeln.", argdown_type: "support", created_at: tm(11,30) }); av(p,[1,10],[9,5]);
  p = pid(); allPosts.push({ id: p, topic_id: t3, author_id: uid(3), content: "Integrierter Ansatz: Streetwork + Konsumraum + Polizei + Parkgestaltung. Der Zaun allein ist symptomatisch. Aber alles fordern und nichts finanzieren – Berliner Spezialität.", argdown_type: "proposal", created_at: tm(12,15) }); av(p,[5,2,7,8],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t3, author_id: uid(10), content: "Das eigentliche Problem: Berlin hat keine Drogenpolitik. Wir reagieren nur. Seit 20 Jahren das gleiche Spiel.", argdown_type: "concern", created_at: tm(13,0) }); av(p,[4,7,1],[]);

  // T4: Integrationskurse
  const t4 = topics[3].id;
  p = pid(); allPosts.push({ id: p, topic_id: t4, author_id: uid(8), content: "Ich habe 2016 einen Integrationskurs gemacht. Lehrer gut, Organisation katastrophal. 6 Monate Wartezeit. Kurs in Spandau obwohl ich in Wedding wohnte. 90 Min Fahrt täglich. Mit B1-Zertifikat keinen Job, weil Arbeitgeber C1 wollen.", argdown_type: "evidence", created_at: tm(8,15) }); av(p,[2,5,3,7,4],[]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t4, author_id: uid(5), content: "BAMF-Statistiken: durchschnittliche Wartezeit Berlin 4,5 Monate. Abbruchquote 38%. Keine Einzelfälle, systemisches Versagen.", argdown_type: "evidence", parent_post_id: p, depth: 1, created_at: tm(8,40) }); av(p2,[3,2,8,9],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t4, author_id: uid(1), content: "Natürlich muss man Deutsch lernen. Aber wir machen es den Leuten unnötig schwer. Weder links noch rechts, einfach schlechte Verwaltung.", argdown_type: "claim", created_at: tm(9,0) }); av(p,[4,6,7,10,2],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t4, author_id: uid(6), content: "Kurse sollten Pflicht bleiben. Wer nicht mitmacht, muss mit Konsequenzen rechnen. Fair gegenüber denen, die sich anstrengen.", argdown_type: "claim", created_at: tm(9,30) }); av(p,[1,10],[2,9]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t4, author_id: uid(2), content: "\"Konsequenzen\" – Leistungskürzungen für alleinerziehende Mütter ohne Kitaplatz? Bevor wir über Pflichten reden, müssen Rahmenbedingungen stimmen.", argdown_type: "objection", parent_post_id: p, depth: 1, created_at: tm(9,50) }); av(p2,[5,8,9,4],[6,1]);
  p = pid(); allPosts.push({ id: p, topic_id: t4, author_id: uid(7), content: "Als Lehrerin: Die Eltern wollen Deutsch lernen. Aber Kinder bringen, abholen, arbeiten. Wann soll der Kurs sein? Abends sind sie fertig.", argdown_type: "concern", created_at: tm(10,20) }); av(p,[2,8,5,4],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t4, author_id: uid(3), content: "Vorschlag: Integrationskurse direkt in Schulen anbieten, parallel zum Unterricht der Kinder. Stärkt Integration auf mehreren Ebenen.", argdown_type: "proposal", created_at: tm(11,0) }); av(p,[2,7,8,5,9,4],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t4, author_id: uid(10), content: "In meinem Taxi sitzen Leute, die seit 3 Jahren hier sind und kaum Deutsch sprechen. Nicht aus bösem Willen – die wurden vergessen. Dann wundern wir uns über Parallelgesellschaften.", argdown_type: "concern", created_at: tm(11,30) }); av(p,[1,2,4,7],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t4, author_id: uid(9), content: "Absurd, dass Kurse nur auf Deutsch fokussieren. Was ist mit demokratischer Bildung, Gleichberechtigung? Und was mit der Integrationspflicht der Aufnahmegesellschaft?", argdown_type: "question", created_at: tm(12,0) }); av(p,[5,2],[1,6]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t4, author_id: uid(1), content: "Integrationspflicht der Aufnahmegesellschaft – was soll das heißen? Ich erwarte, dass die Regeln gelten, die hier gelten. Grundrichtung ist klar.", argdown_type: "rebuttal", parent_post_id: p, depth: 1, created_at: tm(12,20) }); av(p2,[6,10],[9,2]);

  // T5: E-Scooter
  const t5 = topics[4].id;
  p = pid(); allPosts.push({ id: p, topic_id: t5, author_id: uid(7), content: "Dreimal in einer Woche über E-Scooter gestolpert. Einmal mit Kinderwagen. Die Anbieter kassieren, die Allgemeinheit räumt auf.", argdown_type: "concern", created_at: tm(8,30) }); av(p,[1,4,10,2],[6]);
  p = pid(); allPosts.push({ id: p, topic_id: t5, author_id: uid(6), content: "Sollen wir auch Fahrräder verbieten? Problem ist Verhalten einzelner Nutzer, nicht das Produkt. Regulierung ja, Verbotsfantasien nein.", argdown_type: "objection", created_at: tm(9,0) }); av(p,[10],[7,4,1]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t5, author_id: uid(3), content: "Fahrräder gehören Nutzern. E-Scooter gehören Unternehmen, die öffentlichen Raum als kostenloses Lager nutzen. Privatisierung des Gehwegs.", argdown_type: "rebuttal", parent_post_id: p, depth: 1, created_at: tm(9,20) }); av(p2,[7,1,5,9],[6]);
  p = pid(); allPosts.push({ id: p, topic_id: t5, author_id: uid(9), content: "Ökologische Bilanz katastrophal. Kurze Lebensdauer, Lithium-Akkus, LKW-Transporte. Ersetzen nicht Auto, sondern Fußwege und ÖPNV. Greenwashing.", argdown_type: "evidence", created_at: tm(9,45) }); av(p,[5,2,7],[6]);
  p = pid(); allPosts.push({ id: p, topic_id: t5, author_id: uid(5), content: "UBA-Studie 2025: Nur 8% der Fahrten ersetzen Autofahrt. 40% ersetzen Fußwege, 35% ÖPNV. Spricht gegen 'letzte Meile'-Narrativ.", argdown_type: "evidence", created_at: tm(10,10) }); av(p,[3,9,2],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t5, author_id: uid(8), content: "Ich nutze sie gerne. 1,2 km vom U-Bahnhof zur Arbeit. Bus nur alle 20 Min. In 4 Minuten da. Pauschal verbieten wäre falsch.", argdown_type: "support", created_at: tm(10,40) }); av(p,[6,3],[7]);
  p = pid(); allPosts.push({ id: p, topic_id: t5, author_id: uid(10), content: "Feste Abstellzonen gibt es in Paris seit 2023. Funktioniert. Berlin will halt nicht. Zu viel Lobby.", argdown_type: "alternative", created_at: tm(11,15) }); av(p,[1,7,3,4],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t5, author_id: uid(4), content: "Nachts fahren betrunkene Touristen durch Marzahn und schreien rum. App sollte Alkoholsperre haben. Will kein Anbieter.", argdown_type: "concern", created_at: tm(11,50) }); av(p,[7,10,1],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t5, author_id: uid(1), content: "Vorschlag: Nutzungsgebühr pro Scooter/Monat an den Bezirk. Geld für Gehwegsanierung und Barrierefreiheit. Öffentlichen Raum nutzen = zahlen.", argdown_type: "proposal", created_at: tm(12,30) }); av(p,[7,4,3,10],[6]);

  // T6: Müllproblem Neukölln
  const t6 = topics[5].id;
  p = pid(); allPosts.push({ id: p, topic_id: t6, author_id: uid(2), content: "Ich arbeite seit 12 Jahren in Neukölln. Das Müllproblem hat viele Ursachen. Erstens: 15.000 Einwohner/km², dreimal Berliner Durchschnitt. Zweitens: Zu kleine Mülltonnen, weil Hausverwaltungen sparen. Mittwoch voll, nächste Leerung Montag.", argdown_type: "evidence", created_at: tm(8,0) }); av(p,[5,3,7,4,8],[]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t6, author_id: uid(3), content: "BSR-Daten: Neukölln hat pro Kopf weniger Leerungen als Charlottenburg, obwohl doppelte Dichte. Strukturelles Versagen der Ressourcenverteilung.", argdown_type: "evidence", parent_post_id: p, depth: 1, created_at: tm(8,30) }); av(p2,[5,2,9,4],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t6, author_id: uid(1), content: "Ich sage es ungern, aber es hat auch was mit der Bevölkerung zu tun. Viele kennen deutsche Mülltrennung nicht. In Steglitz trennt jeder brav. Keine Rassismus-Aussage, Beobachtung.", argdown_type: "claim", created_at: tm(9,0) }); av(p,[10,6],[2,9,5,8]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t6, author_id: uid(2), content: "Jürgen, klingt nach einfacher Erklärung, stimmt aber nicht. Deutsche, Türken, Araber stehen vor den gleichen überquellenden Tonnen. Problem ist Infrastruktur, nicht Herkunft.", argdown_type: "rebuttal", parent_post_id: p, depth: 1, created_at: tm(9,20) }); av(p2,[5,9,8,3,4],[1,6]);
  p3 = pid(); allPosts.push({ id: p3, topic_id: t6, author_id: uid(5), content: "TU-Studien zeigen: Müllprobleme in dicht besiedelten Vierteln treten unabhängig von ethnischer Zusammensetzung auf. Moabit und Wedding haben ähnliche Probleme.", argdown_type: "evidence", parent_post_id: p2, depth: 2, created_at: tm(9,45) }); av(p3,[3,2,8,9],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t6, author_id: uid(4), content: "Wohne in Marzahn. Kein Müllproblem. Warum? Platten haben Platz für große Container, BSR kommt regelmäßig. Neukölln: winzige Hinterhöfe. Baulich anders.", argdown_type: "alternative", created_at: tm(10,0) }); av(p,[2,3,7],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t6, author_id: uid(6), content: "Hausverwaltungen sind das Hauptproblem. Bestellen absichtlich zu wenig Tonnen. Ordnungsamt muss härter durchgreifen. Bußgelder, die wehtun.", argdown_type: "proposal", created_at: tm(10,30) }); av(p,[1,4,7,10,2],[]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: t6, author_id: uid(3), content: "Bezirksamt Neukölln: 3 Mitarbeiter für Ordnungswidrigkeiten Abfall. Drei. Für 330.000 Einwohner. Bußgelder beschließen kann man – durchsetzen nicht.", argdown_type: "concern", parent_post_id: p, depth: 1, created_at: tm(10,50) }); av(p2,[2,5,4,9],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t6, author_id: uid(7), content: "Neben dem Schulhof meiner Kinder: illegale Müllkippe. Matratzen, Kühlschränke. BSR hat es dreimal abgeholt, dreimal kam es wieder. Meine Tochter fragt: Warum macht keiner was?", argdown_type: "concern", created_at: tm(11,0) }); av(p,[1,4,10,2,8],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t6, author_id: uid(9), content: "Müllproblem = Gerechtigkeitsproblem. In Zehlendorf würde eine illegale Kippe keine 24h stehen. In Neukölln seit Monaten. Stadt investiert nicht gleich.", argdown_type: "claim", created_at: tm(11,30) }); av(p,[2,4,8,5],[1]);
  p = pid(); allPosts.push({ id: p, topic_id: t6, author_id: uid(8), content: "In meinem Haus in Wedding: Hausgemeinschaft hat mehrsprachige Regeln aufgestellt, Müllbeauftragten gewählt. Seitdem deutlich besser. Nachbarn reden statt auf Verwaltung warten.", argdown_type: "alternative", created_at: tm(12,0) }); av(p,[3,7,1],[9]);
  p = pid(); allPosts.push({ id: p, topic_id: t6, author_id: uid(10), content: "Unterirdische Container wie Barcelona/Amsterdam. Sieht besser aus, fasst mehr, kein Ratten-/Vandalismusproblem. Wir bauen U-Bahnen für Milliarden und kriegen den Müll nicht geregelt?", argdown_type: "proposal", created_at: tm(12,30) }); av(p,[3,7,2,6,4],[]);
  p = pid(); allPosts.push({ id: p, topic_id: t6, author_id: uid(5), content: "Kiezbotschafter-Idee am vielversprechendsten. Wien hat 'Waste Watchers': niedrigschwellige Beratung + Ordnungswidrigkeiten melden. 30% weniger Fehlwürfe in Pilotgebieten.", argdown_type: "support", created_at: tm(13,0) }); av(p,[3,2,7,8],[]);

  // Posts for existing topics
  const tRent = "e683e4cd-3722-4fc8-9f1a-1688802a2795";
  p = pid(); allPosts.push({ id: p, topic_id: tRent, author_id: uid(4), content: "3% pro Jahr klingt fair. In meinem Mietvertrag steht 'ortsübliche Vergleichsmiete', wird jedes Jahr höher gesetzt. So ein Deckel wäre wenigstens klar.", argdown_type: "support", created_at: tm(9,0) }); av(p,[2,8,9],[6]);
  p = pid(); allPosts.push({ id: p, topic_id: tRent, author_id: uid(6), content: "Jeder Mietendeckel vernichtet Investitionsanreize. Dann verrotten die Wohnungen halt. Ist das besser?", argdown_type: "objection", created_at: tm(10,0) }); av(p,[1,10],[4,9]);
  p = pid(); allPosts.push({ id: p, topic_id: tRent, author_id: uid(3), content: "Welche Art Mietendeckel? Pauschale Begrenzung vs. indexbasiert vs. nur nach Modernisierung. Details machen den Unterschied.", argdown_type: "question", created_at: tm(11,0) }); av(p,[5,7,2],[]);
  p = pid(); allPosts.push({ id: p, topic_id: tRent, author_id: uid(9), content: "Solange Wohnungen Kapitalanlage sind, löst kein Deckel das Grundproblem. Wohnen muss dem Markt entzogen werden.", argdown_type: "claim", created_at: tm(12,0) }); av(p,[2,4],[1,6,10]);

  const tCar = "188961de-9ede-41bd-80a0-b71788f6f374";
  p = pid(); allPosts.push({ id: p, topic_id: tCar, author_id: uid(10), content: "Autofreie Innenstadt – wie kommen Handwerker zu Kunden? Wie liefert der Bäcker? Ich fahre 200km täglich. Nicht aus Spaß.", argdown_type: "concern", created_at: tm(8,30) }); av(p,[1,4,6],[9]);
  p = pid(); allPosts.push({ id: p, topic_id: tCar, author_id: uid(9), content: "Oslo zeigt: Autofrei heißt nicht autofrei. Lieferverkehr, Taxis, Behindertentransport erlaubt. Es geht um Durchgangsverkehr.", argdown_type: "rebuttal", created_at: tm(9,15) }); av(p,[3,5,2],[10]);
  p = pid(); allPosts.push({ id: p, topic_id: tCar, author_id: uid(7), content: "Dafür, wenn gleichzeitig ÖPNV ausgebaut wird. Kein Bus im 20-Min-Takt, kein Nachtbus der um 1 aufhört.", argdown_type: "support", created_at: tm(10,30) }); av(p,[1,4,8,2,10],[]);
  p = pid(); allPosts.push({ id: p, topic_id: tCar, author_id: uid(1), content: "Immer Skandinavien-Vergleiche. Oslo: 700k Einwohner, Ölfonds. Berlin: 3,7 Mio, kein Geld. Komplett andere Voraussetzungen.", argdown_type: "objection", created_at: tm(11,30) }); av(p,[6,10],[5,9]);

  const tDT = "cae26269-f96c-44c0-933c-4dbb0f1abe28";
  p = pid(); allPosts.push({ id: p, topic_id: tDT, author_id: uid(4), content: "49€ sind schon viel. 69€? Kann ich gleich Auto fahren. Ticket muss billig bleiben, sonst nutzt es den Falschen nix.", argdown_type: "concern", created_at: tm(9,0) }); av(p,[2,8,7],[6]);
  p = pid(); allPosts.push({ id: p, topic_id: tDT, author_id: uid(3), content: "Sozialstaffelung: 29€ Geringverdiener, 49€ Standard, 69€ Premium mit IC. Gerechter als Einheitspreis.", argdown_type: "proposal", created_at: tm(10,0) }); av(p,[5,2,7,8,4],[]);
  p = pid(); allPosts.push({ id: p, topic_id: tDT, author_id: uid(10), content: "Das Ticket hat mein Leben verändert. Spare 80€/Monat. Aber Züge voller, Qualität sinkt. Kapazität muss mit.", argdown_type: "support", created_at: tm(11,0) }); av(p,[1,4,7],[]);
  p = pid(); allPosts.push({ id: p, topic_id: tDT, author_id: uid(6), content: "Warum ÖPNV-Milliarden, aber nichts für Straßen? Autobahnen zerfallen. Brücken gesperrt. Symbolpolitik.", argdown_type: "objection", created_at: tm(12,0) }); av(p,[1,10],[9,2,5]);

  const tSchool = "4e7209da-b4f1-4f0e-a8e3-6db9cff19cbb";
  p = pid(); allPosts.push({ id: p, topic_id: tSchool, author_id: uid(7), content: "Als Grundschullehrerin: Frühe Selektion macht Kinder kaputt. Mit 10 wird über ihre Zukunft entschieden. Spätentwickler haben keine Chance.", argdown_type: "support", created_at: tm(8,45) }); av(p,[2,5,8,9],[1]);
  p = pid(); allPosts.push({ id: p, topic_id: tSchool, author_id: uid(1), content: "Gymnasium hat sich bewährt. Meine Enkel werden gefördert. Einheitsschule senkt Niveau. PISA-Ergebnisse Gesamtschulen sprechen für sich.", argdown_type: "objection", created_at: tm(9,30) }); av(p,[6,10],[2,5,9]);
  p2 = pid(); allPosts.push({ id: p2, topic_id: tSchool, author_id: uid(5), content: "PISA-Ergebnisse Gesamtschulen: niedriger wegen Selektionseffekt, nicht Qualität. Finnland hat nur Gesamtschulen und schneidet besser ab.", argdown_type: "rebuttal", parent_post_id: p, depth: 1, created_at: tm(9,55) }); av(p2,[3,2,7,9],[1]);
  p = pid(); allPosts.push({ id: p, topic_id: tSchool, author_id: uid(8), content: "Bin mit 15 nach Deutschland gekommen, kein Wort Deutsch. Hauptschule zugewiesen. Heute Fachinformatiker – trotz des Systems. Wie viele schaffen es nicht?", argdown_type: "evidence", created_at: tm(10,30) }); av(p,[2,5,7,9,4],[]);
  p = pid(); allPosts.push({ id: p, topic_id: tSchool, author_id: uid(4), content: "Mein Sohn auf der Sekundarschule hat aufgegeben. Sagt er wird eh kein Abi machen. Er ist 12. Was macht das mit einem Kind?", argdown_type: "concern", created_at: tm(11,15) }); av(p,[2,7,8,9],[]);

  // Update existing profiles to Berlin context
  const profileUpdates = [
    { user_id: "dac2f80e-0754-467e-b520-9de868ec20fc", bio: "Verkehrspolitik-Forscherin und ÖPNV-Aktivistin.", location: "Berlin-Schöneberg" },
    { user_id: "d65c427d-b604-4b2f-9643-a5178ce2b597", bio: "Tech-Gründer. Freie Märkte, weniger Regulierung.", location: "Berlin-Charlottenburg" },
    { user_id: "5386fb5b-fbb3-421c-abf9-8a32d9a6ce2f", bio: "Stadtteilorganisatorin. Bezahlbarer Wohnraum und Arbeitnehmerrechte.", location: "Berlin-Kreuzberg" },
    { user_id: "3ba301b6-928c-43cd-9804-e806adfa0152", bio: "Datenanalyst. Ich folge der Evidenz.", location: "Berlin-Mitte" },
    { user_id: "9dda5214-a293-42b2-8ac7-52f9558039f3", bio: "Ladeninhaberin. Politik sollte an die kleinen Leute denken.", location: "Berlin-Prenzlauer Berg" },
    { user_id: "8223afcf-4b8c-4d9d-b518-43d5d96feea9", bio: "Elektriker, 30 Jahre Gewerkschaft.", location: "Berlin-Spandau" },
    { user_id: "d0f3adb2-a2c1-448f-8b02-a0f209c2a8d9", bio: "Umweltwissenschaftlerin. Klimaschutz duldet keinen Aufschub.", location: "Berlin-Friedrichshain" },
    { user_id: "c089c940-806e-4b5f-ada6-f7a4c114b9d6", bio: "Steuerberater. Haushaltsdisziplin zählt.", location: "Berlin-Wilmersdorf" },
    { user_id: "6db0cbcc-909d-47ba-92a6-3070d9979dd6", bio: "Sozialarbeiterin und Gleichstellungsbeauftragte.", location: "Berlin-Wedding" },
    { user_id: "c8b8f3b3-b3bd-47f2-8e52-a50b48d7a19e", bio: "Stadtplanerin. Gutes Design löst Probleme.", location: "Berlin-Kreuzberg" },
    { user_id: "987ce6b7-ae1b-4fc6-9466-4351397668ea", bio: "Public-Health-Forscherin. Gesundheitliche Chancengleichheit.", location: "Berlin-Neukölln" },
  ];
  for (const pu of profileUpdates) {
    await supabase.from("profiles").update({ bio: pu.bio, location: pu.location }).eq("user_id", pu.user_id);
  }

  // Insert posts
  const bs = 50;
  for (let i = 0; i < allPosts.length; i += bs) {
    const batch = allPosts.slice(i, i + bs);
    const { error } = await supabase.from("posts").upsert(batch, { onConflict: "id" });
    if (error) console.error("Posts error:", JSON.stringify(error));
  }

  // Insert votes
  const votesWithId = allVotes.map((v, i) => ({ ...v, id: `d4000001-0000-0000-0000-${i.toString(16).padStart(12,"0")}` }));
  for (let i = 0; i < votesWithId.length; i += bs) {
    const batch = votesWithId.slice(i, i + bs);
    const { error } = await supabase.from("votes").upsert(batch, { onConflict: "id" });
    if (error) console.error("Votes error:", JSON.stringify(error));
  }

  // Update scores
  for (const post of allPosts) {
    const score = allVotes.filter(v => v.post_id === post.id).reduce((s, v) => s + v.value, 0);
    await supabase.from("posts").update({ score }).eq("id", post.id);
  }

  return new Response(JSON.stringify({ success: true, profiles: users.length, topics: topics.length, posts: allPosts.length, votes: allVotes.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
