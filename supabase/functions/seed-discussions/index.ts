import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 10 fictional German users
  const users = [
    { id: "a1000001-0000-0000-0000-000000000001", display_name: "Jörg Wendland", bio: "Retired engineer from Spandau. Keeps a balcony garden and reads Tagesspiegel every morning.", avatar_url: null },
    { id: "a1000001-0000-0000-0000-000000000002", display_name: "Aylin Demir", bio: "Social worker in Neukölln, born in Berlin to Turkish parents. Passionate about education equity.", avatar_url: null },
    { id: "a1000001-0000-0000-0000-000000000003", display_name: "Franziska Möller", bio: "Urban planner at a research institute. Thinks in systems, writes in paragraphs.", avatar_url: null },
    { id: "a1000001-0000-0000-0000-000000000004", display_name: "Kevin Brandt", bio: "Electrician from Marzahn. Skeptical of grand plans but always ready to talk shop.", avatar_url: null },
    { id: "a1000001-0000-0000-0000-000000000005", display_name: "Dr. Claudia Reinhardt", bio: "Public health researcher at Charité. Evidence-first, policy-curious.", avatar_url: null },
    { id: "a1000001-0000-0000-0000-000000000006", display_name: "Tomas Kowalczyk", bio: "Moved from Poland 12 years ago. Runs a small IT company in Prenzlauer Berg.", avatar_url: null },
    { id: "a1000001-0000-0000-0000-000000000007", display_name: "Lena Hartmann", bio: "Mother of two, works part-time in a Kreuzberg bookshop. Chronically sleep-deprived.", avatar_url: null },
    { id: "a1000001-0000-0000-0000-000000000008", display_name: "Markus Fiedler", bio: "FDP-leaning freelance consultant. Believes in markets and personal responsibility.", avatar_url: null },
    { id: "a1000001-0000-0000-0000-000000000009", display_name: "Sana El-Masri", bio: "Student of political science at FU Berlin. Activist for climate justice and housing rights.", avatar_url: null },
    { id: "a1000001-0000-0000-0000-000000000010", display_name: "Ralf Petersen", bio: "Bus driver for BVG since 2004. Union member, pragmatic, and tired of being ignored.", avatar_url: null },
  ];

  // Create profiles
  for (const u of users) {
    const { error } = await supabase.from("profiles").upsert({
      user_id: u.id,
      display_name: u.display_name,
      bio: u.bio,
      avatar_url: u.avatar_url,
    }, { onConflict: "user_id" });
    if (error) console.error("Profile error:", u.display_name, error.message);
  }

  const uid = (n: number) => `a1000001-0000-0000-0000-00000000000${n}`;

  // 5 new Berlin topics
  const newTopics = [
    {
      id: "b2000001-0000-0000-0000-000000000001",
      title: "Should Friedrichstraße stay car-free permanently?",
      description: "The car-free trial on Friedrichstraße divided opinions. Retailers complained about lost foot traffic, cyclists celebrated, and residents were split. Now the Senate must decide: make it permanent, reverse it, or try a new compromise?",
      category: "Urban Planning",
      proposal: "Make the Friedrichstraße car-free zone between Leipziger Straße and Französische Straße permanent, with delivery windows before 10am.",
      status: "active",
      author_id: uid(3),
      slug: "friedrichstrasse-car-free-permanent",
    },
    {
      id: "b2000001-0000-0000-0000-000000000002",
      title: "Mietendeckel 2.0: Should Berlin try another rent cap?",
      description: "After the federal court struck down Berlin's first rent cap (Mietendeckel), housing costs have continued to rise sharply. Some argue for a new attempt within constitutional limits. Others say only building more will help.",
      category: "Housing",
      proposal: "Introduce a new rent cap mechanism for existing contracts in Berlin, capped at inflation + 2% per year, combined with mandatory social housing quotas for new developments.",
      status: "active",
      author_id: uid(9),
      slug: "mietendeckel-2-rent-cap-berlin",
    },
    {
      id: "b2000001-0000-0000-0000-000000000003",
      title: "Policing in Görlitzer Park: more presence or different approach?",
      description: "Görlitzer Park remains a flashpoint for debates about public safety, drug policy, and racial profiling. The new fence and increased police presence have not resolved the underlying tensions. What should actually change?",
      category: "Public Safety",
      proposal: "Replace the current police-heavy approach with a community-based safety concept including social workers, supervised drug consumption rooms nearby, and park rangers.",
      status: "active",
      author_id: uid(5),
      slug: "goerlitzer-park-policing-approach",
    },
    {
      id: "b2000001-0000-0000-0000-000000000004",
      title: "Integrationskurse overhaul: Are they actually working?",
      description: "Germany's integration courses (Integrationskurse) are meant to help newcomers learn German and understand society. But wait times are long, quality varies wildly, and many participants say they don't prepare them for real life in Germany.",
      category: "Public Services",
      proposal: "Reform integration courses with smaller class sizes, job-specific language tracks, and mandatory quality audits. Increase funding by 40% and allow asylum seekers to attend from day one.",
      status: "seeking-consensus",
      author_id: uid(2),
      slug: "integrationskurse-overhaul-working",
    },
    {
      id: "b2000001-0000-0000-0000-000000000005",
      title: "Should Berlin ban e-scooters from sidewalks and parks?",
      description: "E-scooters litter sidewalks, block wheelchair ramps, and end up in the Spree. Companies promise self-regulation but little changes. Should Berlin impose strict parking zones or ban rental scooters altogether?",
      category: "Infrastructure",
      proposal: "Mandate geo-fenced parking zones for all rental e-scooters, fine operators €50 per misparked scooter, and ban riding in all public parks.",
      status: "active",
      author_id: uid(7),
      slug: "berlin-ban-escooters-sidewalks-parks",
    },
  ];

  for (const t of newTopics) {
    const { error } = await supabase.from("topics").upsert(t, { onConflict: "id" });
    if (error) console.error("Topic error:", t.title, error.message);
  }

  // Get the 5 existing active topics to also populate
  const { data: existingTopics } = await supabase
    .from("topics")
    .select("id, title")
    .neq("status", "deleted")
    .not("id", "in", `(${newTopics.map(t => t.id).join(",")})`)
    .order("created_at", { ascending: false })
    .limit(5);

  const allTopicIds = [
    ...newTopics.map(t => t.id),
    ...(existingTopics || []).map(t => t.id),
  ];

  // Delete existing posts for these topics to avoid duplicates on re-run
  for (const tid of allTopicIds) {
    await supabase.from("votes").delete().in("post_id", 
      (await supabase.from("posts").select("id").eq("topic_id", tid)).data?.map(p => p.id) || ["00000000-0000-0000-0000-000000000000"]
    );
    await supabase.from("posts").delete().eq("topic_id", tid);
  }

  // ================================================================
  // DISCUSSION CONTENT
  // ================================================================

  // Helper to create a post ID
  let postCounter = 0;
  const pid = () => {
    postCounter++;
    return `c3000001-0000-0000-0000-${String(postCounter).padStart(12, "0")}`;
  };

  interface PostData {
    id: string;
    topic_id: string;
    parent_post_id: string | null;
    author_id: string;
    content: string;
    argdown_type: string | null;
    depth: number;
    score: number;
    created_at: string;
  }

  const allPosts: PostData[] = [];

  const ts = (daysAgo: number, hoursAgo: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(d.getHours() - hoursAgo);
    return d.toISOString();
  };

  // ================================================================
  // TOPIC 1: Friedrichstraße car-free
  // ================================================================
  const t1 = newTopics[0].id;
  const t1p1 = pid();
  allPosts.push({ id: t1p1, topic_id: t1, parent_post_id: null, author_id: uid(3), content: "I've been studying the Friedrichstraße pilot data for months now. Pedestrian counts increased 40% on weekdays, but retail revenue dropped 12% in the first year. The question isn't simply 'car-free yes or no' — it's about what kind of street design actually serves mixed uses. The current implementation with those sad concrete planters is the worst of both worlds.", argdown_type: "claim", depth: 0, score: 23, created_at: ts(6, 14) });

  const t1p2 = pid();
  allPosts.push({ id: t1p2, topic_id: t1, parent_post_id: null, author_id: uid(4), content: "I've done electrical work in three shops on Friedrichstraße. You know what killed their business? Not the car ban. It was the construction that lasted 18 months before that, the pandemic, and the fact that online shopping exists. Blaming the car-free zone is convenient but lazy.", argdown_type: "objection", depth: 0, score: 31, created_at: ts(6, 12) });

  const t1p3 = pid();
  allPosts.push({ id: t1p3, topic_id: t1, parent_post_id: null, author_id: uid(1), content: "I've lived near Friedrichstraße for 22 years. The car-free experiment made the street feel empty, not lively. No one sits on those benches. There's no shade, no greenery worth mentioning, and the bike lane is dangerous because delivery vans ignore it. Just reopen it to traffic and be done with it.", argdown_type: "concern", depth: 0, score: 18, created_at: ts(6, 10) });

  const t1p3r1 = pid();
  allPosts.push({ id: t1p3r1, topic_id: t1, parent_post_id: t1p3, author_id: uid(9), content: "\"Just reopen it\" ignores 30 years of urban planning research. Every successful pedestrian zone in Europe went through an initial period where residents complained. Look at Stroget in Copenhagen — shop owners literally protested. Now it's the most valuable retail street in Scandinavia.", argdown_type: "objection", depth: 1, score: 14, created_at: ts(6, 8) });

  const t1p3r2 = pid();
  allPosts.push({ id: t1p3r2, topic_id: t1, parent_post_id: t1p3, author_id: uid(1), content: "Copenhagen has different weather, different shopping culture, different transit access. You can't just copy-paste urban concepts across cities. Friedrichstraße is not Stroget.", argdown_type: "rebuttal", depth: 2, score: 9, created_at: ts(6, 6) });

  const t1p4 = pid();
  allPosts.push({ id: t1p4, topic_id: t1, parent_post_id: null, author_id: uid(8), content: "The real issue is property rights. Shop owners signed leases based on certain traffic conditions. Changing those conditions unilaterally is effectively a regulatory taking. If the city wants car-free, fine — but compensate the businesses that lose revenue during transition.", argdown_type: "alternative", depth: 0, score: 7, created_at: ts(5, 20) });

  const t1p5 = pid();
  allPosts.push({ id: t1p5, topic_id: t1, parent_post_id: null, author_id: uid(6), content: "In Warsaw, when they pedestrianized Nowy Świat, they kept one lane for buses and taxis. That compromise worked. Maybe Friedrichstraße doesn't need to be 100% car-free. Allow buses and licensed delivery, ban private cars. That's the pragmatic solution.", argdown_type: "proposal", depth: 0, score: 27, created_at: ts(5, 16) });

  const t1p5r1 = pid();
  allPosts.push({ id: t1p5r1, topic_id: t1, parent_post_id: t1p5, author_id: uid(3), content: "This is actually very close to what Barcelona does with superblocks. They don't fully ban cars — they make through-traffic impossible while keeping local access. The data from Barcelona shows air quality improvement of 25% and noise reduction of 5dB. I'd support a Friedrichstraße superblock model.", argdown_type: "support", depth: 1, score: 19, created_at: ts(5, 14) });

  const t1p6 = pid();
  allPosts.push({ id: t1p6, topic_id: t1, parent_post_id: null, author_id: uid(10), content: "I drive a bus on the M48 line. The Friedrichstraße detour adds 7 minutes to every round trip. That's not trivial — it affects our schedules, our breaks, and ultimately service quality for thousands of passengers. Whatever you decide, please think about public transit routing.", argdown_type: "concern", depth: 0, score: 35, created_at: ts(5, 10) });

  const t1p7 = pid();
  allPosts.push({ id: t1p7, topic_id: t1, parent_post_id: null, author_id: uid(7), content: "Honestly? I don't care about the urban planning theory. I care that I can safely walk there with my kids. Right now there's no clear separation between the bike lane and pedestrian area, and my 4-year-old almost got hit by a cargo bike last week. Fix the basics before debating the grand vision.", argdown_type: "concern", depth: 0, score: 42, created_at: ts(5, 6) });

  const t1p8 = pid();
  allPosts.push({ id: t1p8, topic_id: t1, parent_post_id: null, author_id: uid(2), content: "What nobody mentions: the car-free zone mostly benefits tourists and office workers. The people who actually live in the surrounding blocks — many of them elderly, many with migration background — were never consulted. The Bürgerbeteiligung was a joke. Three workshops, all in German, all during work hours.", argdown_type: "concern", depth: 0, score: 28, created_at: ts(4, 22) });

  const t1p9 = pid();
  allPosts.push({ id: t1p9, topic_id: t1, parent_post_id: null, author_id: uid(5), content: "From a public health perspective, car-free zones reduce PM2.5 exposure by 15-30% for adjacent residents. That's equivalent to preventing roughly 2-3 premature deaths per year per kilometer of car-free street. These numbers aren't speculative — they're from the WHO urban health framework applied to Berlin's pollution data.", argdown_type: "evidence", depth: 0, score: 16, created_at: ts(4, 18) });

  const t1p9r1 = pid();
  allPosts.push({ id: t1p9r1, topic_id: t1, parent_post_id: t1p9, author_id: uid(8), content: "Those WHO models assume steady-state conditions. The actual measured PM2.5 on Friedrichstraße during the trial barely changed because the traffic just shifted to parallel streets. You moved pollution, you didn't reduce it.", argdown_type: "rebuttal", depth: 1, score: 11, created_at: ts(4, 16) });

  const t1p10 = pid();
  allPosts.push({ id: t1p10, topic_id: t1, parent_post_id: null, author_id: uid(9), content: "Can we stop pretending this is just about one street? Friedrichstraße is a test case for Berlin's entire mobility transition. If we can't even keep ONE street car-free, we have zero credibility on climate targets. The 2030 goal of 30% car traffic reduction requires hundreds of streets like this.", argdown_type: "claim", depth: 0, score: 20, created_at: ts(4, 12) });

  // ================================================================
  // TOPIC 2: Mietendeckel 2.0
  // ================================================================
  const t2 = newTopics[1].id;
  const t2p1 = pid();
  allPosts.push({ id: t2p1, topic_id: t2, parent_post_id: null, author_id: uid(9), content: "The first Mietendeckel failed because of federalism, not because rent caps don't work. Vienna has had rent controls for decades and their housing market is the most stable in Europe. Berlin needs to push for a federal solution while implementing whatever is constitutionally possible at the state level. Waiting for the market to self-correct is a fantasy.", argdown_type: "claim", depth: 0, score: 38, created_at: ts(7, 20) });

  const t2p2 = pid();
  allPosts.push({ id: t2p2, topic_id: t2, parent_post_id: null, author_id: uid(8), content: "Rent caps are economically illiterate. Every single study shows they reduce housing supply in the medium term. Stockholm has rent control and a 20-year waitlist for apartments. The only solution is building more — remove regulations, speed up permits, let the market work.", argdown_type: "objection", depth: 0, score: 15, created_at: ts(7, 18) });

  const t2p2r1 = pid();
  allPosts.push({ id: t2p2r1, topic_id: t2, parent_post_id: t2p2, author_id: uid(3), content: "The 'just build more' argument ignores that Berlin approved 22,000 units in 2024 but only 8,500 were completed. The bottleneck isn't regulation — it's construction costs, skilled labor shortage, and interest rates. Deregulation won't conjure builders out of thin air.", argdown_type: "rebuttal", depth: 1, score: 29, created_at: ts(7, 16) });

  const t2p2r2 = pid();
  allPosts.push({ id: t2p2r2, topic_id: t2, parent_post_id: t2p2, author_id: uid(8), content: "Fair point on construction capacity. But rent caps actively discourage investment in new supply. Why would a developer build if returns are capped? We need both: more supply AND market-rate rents with targeted subsidies for those who can't afford them.", argdown_type: "alternative", depth: 2, score: 8, created_at: ts(7, 14) });

  const t2p3 = pid();
  allPosts.push({ id: t2p3, topic_id: t2, parent_post_id: null, author_id: uid(7), content: "Theory is nice. Here's my reality: my rent went from 680€ to 1,100€ after the Mietendeckel was struck down. I'm a single mom working 30 hours. I can't move because there's nothing available. I can't pay more because there's nothing left. Whatever policy you propose, it needs to help people like me NOW, not in 10 years when new apartments are built.", argdown_type: "concern", depth: 0, score: 56, created_at: ts(7, 10) });

  const t2p3r1 = pid();
  allPosts.push({ id: t2p3r1, topic_id: t2, parent_post_id: t2p3, author_id: uid(5), content: "This is exactly why we need a two-track approach: immediate relief through direct housing subsidies (Wohngeld reform) and long-term structural change. The current Wohngeld doesn't cover actual Berlin rents. Adjusting it to market reality would help thousands of families within months.", argdown_type: "proposal", depth: 1, score: 22, created_at: ts(7, 8) });

  const t2p4 = pid();
  allPosts.push({ id: t2p4, topic_id: t2, parent_post_id: null, author_id: uid(4), content: "I'm a tenant and I didn't benefit from the Mietendeckel. My landlord just stopped maintaining the building. No repairs for two years. The elevator broke, took 4 months to fix. Rent caps sound great until your building falls apart because the owner has no incentive to invest.", argdown_type: "evidence", depth: 0, score: 19, created_at: ts(6, 22) });

  const t2p5 = pid();
  allPosts.push({ id: t2p5, topic_id: t2, parent_post_id: null, author_id: uid(6), content: "I bought my apartment in 2019. I'm paying a mortgage. If rents are capped but mortgages aren't, property values collapse and people like me are underwater on our loans. Nobody ever talks about what rent caps do to small private owners who have one or two apartments. We're not all Vonovia.", argdown_type: "concern", depth: 0, score: 14, created_at: ts(6, 18) });

  const t2p6 = pid();
  allPosts.push({ id: t2p6, topic_id: t2, parent_post_id: null, author_id: uid(1), content: "My apartment in Spandau cost 4.50€/sqm when I moved in 1998. Now comparable units go for 12€. That's not the market working — that's speculation and artificial scarcity. The big landlords deliberately keep units empty to drive up prices. A rent cap at least limits the damage.", argdown_type: "claim", depth: 0, score: 24, created_at: ts(6, 14) });

  const t2p7 = pid();
  allPosts.push({ id: t2p7, topic_id: t2, parent_post_id: null, author_id: uid(2), content: "In my work I see families who spend 50-60% of their income on rent. Mostly migrant families, single parents, people with insecure employment. The housing crisis is a social crisis. Whatever instrument we use — caps, subsidies, public housing — the urgency is real. We can't afford another decade of debate.", argdown_type: "claim", depth: 0, score: 33, created_at: ts(6, 10) });

  const t2p8 = pid();
  allPosts.push({ id: t2p8, topic_id: t2, parent_post_id: null, author_id: uid(10), content: "I make 2,800€ net. My rent is 1,050€. That's 37%. After transit pass, food, and my kid's Kita fees, I have maybe 200€ left. And I'm supposed to be middle class. Something is deeply broken. I don't care if it's a cap or subsidies or whatever — just do SOMETHING.", argdown_type: "concern", depth: 0, score: 45, created_at: ts(5, 22) });

  const t2p9 = pid();
  allPosts.push({ id: t2p9, topic_id: t2, parent_post_id: null, author_id: uid(3), content: "A more nuanced proposal: differentiated rent regulation by neighborhood and building age. Pre-1990 buildings in high-demand areas get strict caps. New construction is exempt for 15 years to incentivize building. Social housing quota of 30% for all new developments over 20 units. This isn't radical — it's basically the Viennese model adapted to Berlin.", argdown_type: "proposal", depth: 0, score: 26, created_at: ts(5, 18) });

  const t2p10 = pid();
  allPosts.push({ id: t2p10, topic_id: t2, parent_post_id: null, author_id: uid(8), content: "Has anyone actually read the constitutional court ruling? It wasn't just about federalism. The court said rent regulation is federal competence. Berlin literally CANNOT do a rent cap without the Bundestag. So this entire discussion is moot unless someone has a plan to change federal law.", argdown_type: "question", depth: 0, score: 12, created_at: ts(5, 14) });

  const t2p10r1 = pid();
  allPosts.push({ id: t2p10r1, topic_id: t2, parent_post_id: t2p10, author_id: uid(9), content: "The ruling said Berlin couldn't do what it did BECAUSE there was already federal regulation (BGB §556d). But there's legal scholarship arguing that additional state-level measures are possible if they don't contradict federal law. A cap on rent increases (not absolute rents) might be constitutional. It's not settled.", argdown_type: "rebuttal", depth: 1, score: 17, created_at: ts(5, 12) });

  // ================================================================
  // TOPIC 3: Görlitzer Park
  // ================================================================
  const t3 = newTopics[2].id;
  const t3p1 = pid();
  allPosts.push({ id: t3p1, topic_id: t3, parent_post_id: null, author_id: uid(5), content: "I've reviewed the Berlin police statistics for Görlitzer Park from 2019-2025. Drug-related offenses are up 45%, but violent crime is actually flat. The perception of danger far exceeds the statistical reality. Most 'safety' complaints are about feeling uncomfortable, not actual victimization. This matters because it shapes which interventions make sense.", argdown_type: "evidence", depth: 0, score: 21, created_at: ts(8, 20) });

  const t3p2 = pid();
  allPosts.push({ id: t3p2, topic_id: t3, parent_post_id: null, author_id: uid(1), content: "Statistics don't capture what it feels like to walk through that park after dark. I'm 67, I've lived in Kreuzberg since 1985. I've seen the park change. The aggressive drug dealing, the groups blocking paths, the needles near the playground — I don't need a study to tell me I don't feel safe. And my feeling is valid.", argdown_type: "objection", depth: 0, score: 34, created_at: ts(8, 18) });

  const t3p2r1 = pid();
  allPosts.push({ id: t3p2r1, topic_id: t3, parent_post_id: t3p2, author_id: uid(9), content: "Your feeling is valid. But policy based on feelings leads to racial profiling and over-policing of Black men who happen to be in a park. 78% of people stopped by police in Görli are Black or Middle Eastern. That's not public safety — that's institutionalized racism.", argdown_type: "objection", depth: 1, score: 18, created_at: ts(8, 16) });

  const t3p2r2 = pid();
  allPosts.push({ id: t3p2r2, topic_id: t3, parent_post_id: t3p2r1, author_id: uid(1), content: "I'm not advocating for racial profiling. I'm saying my neighborhood park is unusable for families. Can we address that without being accused of racism? There must be solutions between 'do nothing' and 'police state'.", argdown_type: "concern", depth: 2, score: 25, created_at: ts(8, 14) });

  const t3p3 = pid();
  allPosts.push({ id: t3p3, topic_id: t3, parent_post_id: null, author_id: uid(2), content: "I work with many of the people who sell drugs in Görlitzer Park. Most are asylum seekers who've been waiting 3+ years for their cases to be processed. They can't legally work. They have no income. What exactly are they supposed to do? This is a failure of asylum policy, not a park management issue.", argdown_type: "claim", depth: 0, score: 30, created_at: ts(8, 12) });

  const t3p4 = pid();
  allPosts.push({ id: t3p4, topic_id: t3, parent_post_id: null, author_id: uid(4), content: "I live on Görlitzer Straße. The drug consumption room proposal keeps coming up but nobody wants it on THEIR street. Classic NIMBY. But it actually works — Lisbon, Zurich, Vancouver all showed that supervised facilities reduce public drug use by 30-50%. Can we at least try it?", argdown_type: "proposal", depth: 0, score: 16, created_at: ts(8, 8) });

  const t3p5 = pid();
  allPosts.push({ id: t3p5, topic_id: t3, parent_post_id: null, author_id: uid(8), content: "Personal responsibility matters. The dealers chose to break the law. The users chose to use drugs. I don't see why my taxes should fund consumption rooms to make illegal activity more comfortable. Enforce existing laws, deport those without legal residence, and the problem is solved.", argdown_type: "claim", depth: 0, score: -4, created_at: ts(7, 22) });

  const t3p5r1 = pid();
  allPosts.push({ id: t3p5r1, topic_id: t3, parent_post_id: t3p5, author_id: uid(5), content: "\"Deport them and the problem is solved\" — this has been the stated policy for years and the situation has gotten worse, not better. The definition of insanity is doing the same thing and expecting different results. The evidence overwhelmingly supports harm reduction over punitive approaches.", argdown_type: "rebuttal", depth: 1, score: 22, created_at: ts(7, 20) });

  const t3p6 = pid();
  allPosts.push({ id: t3p6, topic_id: t3, parent_post_id: null, author_id: uid(7), content: "My kids used to play in Görli. Now I drive them to Tempelhofer Feld instead. That's 20 minutes by car. I don't have an opinion on drug policy, I just want a park where my kids can play without stepping on broken glass. Is that really too much to ask?", argdown_type: "concern", depth: 0, score: 39, created_at: ts(7, 18) });

  const t3p7 = pid();
  allPosts.push({ id: t3p7, topic_id: t3, parent_post_id: null, author_id: uid(6), content: "When I came to Berlin from Wrocław, I heard Görli was 'dangerous'. I went there — it's a park with a drug problem. I've seen much worse. But the interesting thing is how differently Germans and immigrants perceive risk. Many newcomers don't complain about Görli because their baseline is different. The 'safety' debate is partly a cultural privilege issue.", argdown_type: "claim", depth: 0, score: 8, created_at: ts(7, 14) });

  const t3p8 = pid();
  allPosts.push({ id: t3p8, topic_id: t3, parent_post_id: null, author_id: uid(10), content: "I drive the M29 past Görli every day. The fence they built? Waste of money. People just go around it. What actually helps is the park manager program they started — real people who know the regulars, de-escalate situations, and keep the playground clean. Fund that properly instead of more fences and more cops.", argdown_type: "alternative", depth: 0, score: 28, created_at: ts(7, 10) });

  const t3p9 = pid();
  allPosts.push({ id: t3p9, topic_id: t3, parent_post_id: null, author_id: uid(3), content: "Here's a question nobody is asking: what would a successful Görlitzer Park look like? If we can't define success, we can't measure progress. Is it zero drug dealing? That's unrealistic anywhere. Is it families using the park comfortably? Then let's design for that specific outcome.", argdown_type: "question", depth: 0, score: 32, created_at: ts(6, 22) });

  const t3p10 = pid();
  allPosts.push({ id: t3p10, topic_id: t3, parent_post_id: null, author_id: uid(9), content: "Reminder that Görlitzer Park was occupied by the Turkish community in the 80s and 90s as a gathering space that was actively neglected by the city. The current 'crisis' is the latest chapter in a long history of Berlin using Kreuzberg as a dumping ground for problems it doesn't want to solve elsewhere. The pattern is: neglect → crisis → over-policing → gentrification.", argdown_type: "claim", depth: 0, score: 15, created_at: ts(6, 18) });

  // ================================================================
  // TOPIC 4: Integrationskurse
  // ================================================================
  const t4 = newTopics[3].id;
  const t4p1 = pid();
  allPosts.push({ id: t4p1, topic_id: t4, parent_post_id: null, author_id: uid(2), content: "I've been teaching integration courses for 6 years. Here's the reality: classes of 25 people with completely different education levels. A Syrian doctor sits next to an Afghan woman who never went to school. One curriculum for both. It doesn't work. The BAMF knows this. Everyone knows this. Nothing changes because the funding model rewards quantity over quality.", argdown_type: "evidence", depth: 0, score: 47, created_at: ts(9, 20) });

  const t4p2 = pid();
  allPosts.push({ id: t4p2, topic_id: t4, parent_post_id: null, author_id: uid(6), content: "I took the integration course in 2014. My teacher was excellent but the materials were absurd. Chapter 1: the German flag. Chapter 5: how to sort recycling. Chapter 12: the Grundgesetz. Nothing about how to find an apartment, deal with the Bürgeramt, or navigate the school system. I learned more German from my Polish neighbors than from 600 hours of class.", argdown_type: "evidence", depth: 0, score: 41, created_at: ts(9, 18) });

  const t4p2r1 = pid();
  allPosts.push({ id: t4p2r1, topic_id: t4, parent_post_id: t4p2, author_id: uid(3), content: "The curriculum issue is well documented. The BAMF's own evaluation from 2023 showed that only 48% of participants reach B1 level. The EU average for comparable programs is 62%. Germany spends more per participant but gets worse outcomes. It's a structural problem, not a funding problem.", argdown_type: "support", depth: 1, score: 18, created_at: ts(9, 16) });

  const t4p3 = pid();
  allPosts.push({ id: t4p3, topic_id: t4, parent_post_id: null, author_id: uid(8), content: "Why should taxpayers fund 600+ hours of language courses for people who may not stay? Many participants don't even attend regularly. I'd support a system where course fees are refunded upon completion — that creates an incentive to actually learn. Otherwise it's just a subsidy for language school owners.", argdown_type: "alternative", depth: 0, score: -2, created_at: ts(9, 14) });

  const t4p3r1 = pid();
  allPosts.push({ id: t4p3r1, topic_id: t4, parent_post_id: t4p3, author_id: uid(2), content: "Most participants in my courses desperately want to learn. They travel 90 minutes across Berlin because that's where a spot was available. They juggle childcare, trauma therapy, and asylum hearings. The '195€ co-payment' is already a barrier for many. Adding financial risk would exclude the most vulnerable.", argdown_type: "rebuttal", depth: 1, score: 33, created_at: ts(9, 12) });

  const t4p4 = pid();
  allPosts.push({ id: t4p4, topic_id: t4, parent_post_id: null, author_id: uid(5), content: "From a public health angle: the correlation between integration course completion and mental health outcomes is significant. Participants who reach B1 show 40% lower rates of clinical depression compared to non-participants. Language isn't just practical — it's protective. Cutting funding would create downstream health costs.", argdown_type: "evidence", depth: 0, score: 14, created_at: ts(8, 22) });

  const t4p5 = pid();
  allPosts.push({ id: t4p5, topic_id: t4, parent_post_id: null, author_id: uid(10), content: "My wife came from Turkey in 2012. Waited 8 months for a course spot. By the time she got in, she'd already learned basic German from YouTube and our daughter's kindergarten friends. The system is too slow. If you want people to integrate, let them work and learn simultaneously. A classroom in Lichtenberg 5 days a week is not how adults learn languages.", argdown_type: "concern", depth: 0, score: 29, created_at: ts(8, 18) });

  const t4p6 = pid();
  allPosts.push({ id: t4p6, topic_id: t4, parent_post_id: null, author_id: uid(1), content: "I volunteer at a Willkommenscafé in Spandau. The integration course is the only structure many newcomers have. Without it, they'd be even more isolated. Yes, improve it — smaller classes, better teachers, practical content. But don't pretend the solution is to throw people into the job market with zero German and call that 'integration'.", argdown_type: "objection", depth: 0, score: 20, created_at: ts(8, 14) });

  const t4p7 = pid();
  allPosts.push({ id: t4p7, topic_id: t4, parent_post_id: null, author_id: uid(9), content: "The entire framing of 'integration courses' is colonial. It assumes newcomers need to be taught how to be German. How about mutual integration? How about courses for German institutions on how to work with diverse populations? The Ausländerbehörde can't even send letters in anything other than bureaucratic German.", argdown_type: "alternative", depth: 0, score: 10, created_at: ts(8, 10) });

  const t4p7r1 = pid();
  allPosts.push({ id: t4p7r1, topic_id: t4, parent_post_id: t4p7, author_id: uid(4), content: "Come on. Learning the language of the country you live in isn't 'colonial'. I moved from East Germany to West Germany as a kid and had to adapt too. That's just life. Making everything about power dynamics doesn't help the Syrian engineer who just wants to pass B2 and get back to work.", argdown_type: "objection", depth: 1, score: 16, created_at: ts(8, 8) });

  const t4p8 = pid();
  allPosts.push({ id: t4p8, topic_id: t4, parent_post_id: null, author_id: uid(3), content: "Concrete reform proposal: 1) Differentiated tracks by education level (alpha, A1-B1, B2+professional). 2) Maximum class size of 15. 3) Childcare provided on-site. 4) Job-specific language modules (healthcare, trades, IT). 5) Quality audits with participant satisfaction scores. Estimated additional cost: €340M/year. That's 0.07% of the federal budget.", argdown_type: "proposal", depth: 0, score: 36, created_at: ts(7, 22) });

  const t4p9 = pid();
  allPosts.push({ id: t4p9, topic_id: t4, parent_post_id: null, author_id: uid(7), content: "Quick question — are integration courses available to EU citizens? My neighbor from Romania has lived here 8 years, speaks broken German, works in construction. He was never offered a course. Integration isn't just about refugees.", argdown_type: "question", depth: 0, score: 11, created_at: ts(7, 18) });

  const t4p10 = pid();
  allPosts.push({ id: t4p10, topic_id: t4, parent_post_id: null, author_id: uid(6), content: "I'll share what actually helped me integrate: a German colleague who invited me for Kaffee und Kuchen every Sunday. Not a course. Not an app. A person who treated me like a neighbor. Maybe we should spend less on institutional programs and more on community mentorship. Pair every newcomer with a local volunteer. That's integration.", argdown_type: "alternative", depth: 0, score: 25, created_at: ts(7, 14) });

  // ================================================================
  // TOPIC 5: E-Scooters
  // ================================================================
  const t5 = newTopics[4].id;
  const t5p1 = pid();
  allPosts.push({ id: t5p1, topic_id: t5, parent_post_id: null, author_id: uid(7), content: "I use a wheelchair. E-scooters are not a minor inconvenience for me — they're a safety hazard. Last month I had to go on the street because three scooters blocked the entire sidewalk on Sonnenallee. That's not 'urban mobility'. That's privatizing public space at the expense of disabled people.", argdown_type: "claim", depth: 0, score: 52, created_at: ts(5, 20) });

  const t5p2 = pid();
  allPosts.push({ id: t5p2, topic_id: t5, parent_post_id: null, author_id: uid(8), content: "E-scooters fill a genuine gap in last-mile transit. Not everyone can bike. Not every trip justifies a car. Banning them is a lazy solution. Regulate parking, sure. But don't throw out a useful transport mode because some people are inconsiderate. We don't ban cars because of bad parking.", argdown_type: "objection", depth: 0, score: 9, created_at: ts(5, 18) });

  const t5p2r1 = pid();
  allPosts.push({ id: t5p2r1, topic_id: t5, parent_post_id: t5p2, author_id: uid(10), content: "But we DO regulate car parking. Heavily. You need a license, insurance, designated spots, pay for parking. Scooter companies pay almost nothing for using public space. The comparison actually makes the case FOR strict regulation, not against it.", argdown_type: "rebuttal", depth: 1, score: 24, created_at: ts(5, 16) });

  const t5p3 = pid();
  allPosts.push({ id: t5p3, topic_id: t5, parent_post_id: null, author_id: uid(4), content: "I pulled 12 scooters out of the Landwehrkanal last summer as part of a volunteer cleanup. TWELVE. In one afternoon. The environmental cost of these things is insane. Lithium batteries in the river. The average rental scooter lasts 3 months before it's trashed. This is not green transport — it's e-waste with a marketing budget.", argdown_type: "evidence", depth: 0, score: 38, created_at: ts(5, 14) });

  const t5p4 = pid();
  allPosts.push({ id: t5p4, topic_id: t5, parent_post_id: null, author_id: uid(3), content: "Paris banned rental e-scooters after a referendum. 89% voted against them. Berlin should hold a similar vote. Let the citizens decide. The data from Paris shows no negative impact on mobility — people just walked more or took transit. The 'last mile gap' was largely manufactured by scooter companies to justify their business model.", argdown_type: "proposal", depth: 0, score: 20, created_at: ts(5, 10) });

  const t5p5 = pid();
  allPosts.push({ id: t5p5, topic_id: t5, parent_post_id: null, author_id: uid(9), content: "Hot take: the scooter debate is a distraction. Cars take up 1000x more public space, kill 30+ people per year in Berlin, and cause orders of magnitude more pollution. Where's the referendum to ban SUVs from inner-city streets? The outrage about scooters is wildly disproportionate.", argdown_type: "alternative", depth: 0, score: 13, created_at: ts(4, 22) });

  const t5p5r1 = pid();
  allPosts.push({ id: t5p5r1, topic_id: t5, parent_post_id: t5p5, author_id: uid(1), content: "Both things can be true. Cars are a bigger problem AND scooters are a nuisance. Pointing at a bigger problem doesn't make the smaller one go away. My neighbor broke her hip tripping over a scooter. She's 73.", argdown_type: "objection", depth: 1, score: 30, created_at: ts(4, 20) });

  const t5p6 = pid();
  allPosts.push({ id: t5p6, topic_id: t5, parent_post_id: null, author_id: uid(6), content: "In Warsaw and Prague, they introduced mandatory parking zones with a €100 fine per violation charged directly to the scooter company. Within 3 months, sidewalk clutter dropped 70%. It works. Berlin just needs to enforce it. The technology exists — geofencing is trivial to implement.", argdown_type: "evidence", depth: 0, score: 26, created_at: ts(4, 18) });

  const t5p7 = pid();
  allPosts.push({ id: t5p7, topic_id: t5, parent_post_id: null, author_id: uid(5), content: "E-scooter injuries cost Berlin's health system approximately €2.3M per year. 40% of injuries involve alcohol. The single most effective intervention would be mandatory breathalyzer unlock — technically feasible but scooter companies lobby against it. Follow the money.", argdown_type: "evidence", depth: 0, score: 17, created_at: ts(4, 14) });

  const t5p8 = pid();
  allPosts.push({ id: t5p8, topic_id: t5, parent_post_id: null, author_id: uid(10), content: "As a bus driver I can tell you: the most dangerous thing about scooters is people riding them in bus lanes. Happens 10 times a day on my route. They're invisible in mirrors, they weave unpredictably, and when I brake hard to avoid one, 40 passengers stumble. Separate infrastructure or nothing.", argdown_type: "concern", depth: 0, score: 31, created_at: ts(4, 10) });

  const t5p9 = pid();
  allPosts.push({ id: t5p9, topic_id: t5, parent_post_id: null, author_id: uid(2), content: "Accessibility question: has anyone checked whether the proposed geo-fenced parking zones are themselves accessible? In Neukölln, many designated parking areas are on cobblestones or have curbs. If you can barely walk there, you definitely can't park a scooter there. Design for the margins, not the average.", argdown_type: "question", depth: 0, score: 15, created_at: ts(3, 22) });

  const t5p10 = pid();
  allPosts.push({ id: t5p10, topic_id: t5, parent_post_id: null, author_id: uid(7), content: "You know what I think? Scooter companies should be required to hire people whose full-time job is picking up and redistributing scooters. Create actual jobs instead of gig work. Make the companies responsible for every scooter at all times. If it's on its side, they're fined. If it's blocking a ramp, they're fined double.", argdown_type: "proposal", depth: 0, score: 22, created_at: ts(3, 18) });

  // ================================================================
  // EXISTING TOPICS — populate the top 5 existing ones
  // ================================================================

  // Existing topic 1 (most recent existing)
  if (existingTopics && existingTopics.length > 0) {
    const et1 = existingTopics[0].id;
    const et1posts = [
      { content: "I think we need to differentiate between cosmetic renovation and genuine energy retrofitting. Solar panels on a listed Gründerzeit building look terrible and produce minimal energy due to the typical roof orientation. Insulating historical facades destroys exactly what makes them worth preserving.", argdown_type: "claim", author_id: uid(1), score: 14 },
      { content: "The climate doesn't care about aesthetics. We either retrofit ALL buildings or we miss our targets. Listed buildings account for 12% of Berlin's housing stock. You can't just exempt them.", argdown_type: "objection", author_id: uid(9), score: 19 },
      { content: "There are interior insulation techniques that preserve the facade while achieving 60% of the thermal improvement of external insulation. More expensive, yes. But technically feasible. The 'either-or' framing is outdated.", argdown_type: "alternative", author_id: uid(3), score: 25 },
      { content: "My building in Prenzlauer Berg got new windows last year. Triple-glazed, look exactly like the originals from the outside. Cost twice as much as standard windows. Who pays the difference? My landlord passed it through as a Modernisierungsumlage — my rent went up €180/month. Energy efficient AND unaffordable.", argdown_type: "evidence", author_id: uid(4), score: 32 },
      { content: "In Denmark, they solved this with public subsidies for heritage-compatible retrofitting. Up to 40% of costs covered. Germany's KfW programs don't differentiate between listed and non-listed buildings. That's the policy gap.", argdown_type: "proposal", author_id: uid(6), score: 18 },
      { content: "Has anyone considered that some buildings just aren't worth preserving? Not every 1905 apartment block is architectural heritage. Half of what's 'listed' in Berlin is mediocre late-Wilhelmine stuff that's neither beautiful nor historically significant. Delist the unremarkable, protect the truly significant.", argdown_type: "alternative", author_id: uid(8), score: 6 },
      { content: "As someone who grew up in a GDR Plattenbau, I find this whole 'heritage preservation' debate very Wessi. Nobody ever cared about preserving our buildings. They just demolish them. But a 120-year-old bourgeois apartment? Oh, that's sacred. The double standard is real.", argdown_type: "concern", author_id: uid(4), score: 21 },
      { content: "I teach at a school in Charlottenburg housed in a beautiful 1910 building. No insulation. Single-glazed windows. In winter, children sit in coats. Last January the heating bill was €14,000 for one month. Heritage preservation vs. children's wellbeing — the choice should be obvious.", argdown_type: "evidence", author_id: uid(2), score: 37 },
      { content: "We need a decision matrix: for each protected building, calculate the energy savings potential vs. heritage value. Some buildings should be fully retrofitted, some partially, some preserved as-is with carbon offsets. One-size-fits-all doesn't work in either direction.", argdown_type: "proposal", author_id: uid(5), score: 15 },
    ];
    let prevTs = 8;
    for (const p of et1posts) {
      const postId = pid();
      allPosts.push({ id: postId, topic_id: et1, parent_post_id: null, author_id: p.author_id, content: p.content, argdown_type: p.argdown_type, depth: 0, score: p.score, created_at: ts(prevTs, Math.floor(Math.random()*20)) });
      prevTs -= 0.5;
    }
  }

  // Existing topic 2
  if (existingTopics && existingTopics.length > 1) {
    const et2 = existingTopics[1].id;
    const et2posts = [
      { content: "The Deutschlandticket was the single best transport policy in decades. Extending it to RE trains would transform mobility in Brandenburg. People commute from Bernau, Oranienburg, Potsdam — paying extra for regional express is absurd when the S-Bahn is included.", argdown_type: "claim", author_id: uid(10), score: 40 },
      { content: "Who pays? The Deutschlandticket already has a €3 billion annual subsidy gap. Adding RE trains would double it. I'm all for cheap transit but not if it means cutting bus routes in rural areas to fund urban commuters.", argdown_type: "concern", author_id: uid(8), score: 12 },
      { content: "I commute from Königs Wusterhausen. RE vs. S-Bahn saves me 25 minutes each way. That's almost an hour of my life every day. For a single parent, that's the difference between picking up my kid from Hort on time or paying late fees.", argdown_type: "evidence", author_id: uid(7), score: 35 },
      { content: "The financing model is simple: increase the ticket from 49€ to 59€, add a 'Metropol' option at 69€ that includes RE/IC within 100km. Those who need it pay a bit more. Those who don't, keep the base ticket. Progressive, optional, sustainable.", argdown_type: "proposal", author_id: uid(3), score: 28 },
      { content: "Austria's Klimaticket includes ALL trains nationwide for €1,095/year. Germany with its federal mess can't even include regional trains in a €588/year ticket. The problem isn't money — it's political will and DB's monopoly pricing.", argdown_type: "claim", author_id: uid(9), score: 22 },
      { content: "I work for a logistics company. Our drivers can't use public transit — they need vehicles. Not everyone's life fits on a train. The fetishization of public transit ignores that millions of jobs require cars. Stop subsidizing one mode and start thinking about the whole system.", argdown_type: "objection", author_id: uid(4), score: 8 },
      { content: "Data point: since the Deutschlandticket launched, car trips on the A100 decreased by 4%. Small but measurable. Modeled projections for RE inclusion suggest an additional 6-8% reduction. Combined with congestion pricing, we could reach 15%.", argdown_type: "evidence", author_id: uid(5), score: 16 },
      { content: "The elephant in the room is DB's reliability. I'd happily give up my car if RE trains were on time. Last month, 34% of my RE1 trains were delayed by more than 5 minutes. You can't replace the car with a system people can't depend on.", argdown_type: "concern", author_id: uid(6), score: 44 },
      { content: "Why are we even discussing incremental improvements? The whole fare system should be replaced with distance-based pricing using contactless cards, like London or Singapore. The technology exists. The flat-rate model incentivizes long-distance commuting — exactly what we should be discouraging from a climate perspective.", argdown_type: "alternative", author_id: uid(3), score: 7 },
      { content: "Einfach machen. Enough studies, enough commissions, enough pilot projects. Include the RE, raise the price by 10€, evaluate after one year. Germany's obsession with planning everything to perfection before starting is why nothing ever changes.", argdown_type: "claim", author_id: uid(10), score: 31 },
    ];
    let prevTs2 = 10;
    for (const p of et2posts) {
      const postId = pid();
      allPosts.push({ id: postId, topic_id: et2, parent_post_id: null, author_id: p.author_id, content: p.content, argdown_type: p.argdown_type, depth: 0, score: p.score, created_at: ts(prevTs2, Math.floor(Math.random()*20)) });
      prevTs2 -= 0.7;
    }
  }

  // Existing topic 3
  if (existingTopics && existingTopics.length > 2) {
    const et3 = existingTopics[2].id;
    const et3posts = [
      { content: "The three-track school system is designed to reproduce inequality. Children are sorted at age 10 based on their parents' education, not their potential. 75% of Gymnasium students have academic parents. This isn't meritocracy — it's hereditary privilege.", argdown_type: "claim", author_id: uid(2), score: 33 },
      { content: "I went to Hauptschule. I'm an electrician. I make 55k/year, own my apartment, and I'm happy. Not everyone needs Abitur. The skilled trades are dying because everyone thinks they need to go to university. The three-track model gives dignity to practical work.", argdown_type: "objection", author_id: uid(4), score: 27 },
      { content: "Finland combines all students until age 16 and consistently ranks top 5 in PISA. Germany sorts at 10 and ranks average. The evidence is overwhelming. Early tracking harms disadvantaged students without helping advantaged ones.", argdown_type: "evidence", author_id: uid(3), score: 24 },
      { content: "My son is in 4th grade. His teacher told us he's 'not Gymnasium material'. He's 9. NINE. How can you know someone's potential at nine? This sorting is traumatic for children and parents alike.", argdown_type: "concern", author_id: uid(7), score: 42 },
      { content: "Berlin already has Gemeinschaftsschulen. They work well in some places, terribly in others. The problem isn't the structure — it's teacher quality, class sizes, and resources. You can have a comprehensive school that's just as unequal if you underfund it.", argdown_type: "concern", author_id: uid(5), score: 19 },
      { content: "As an employer: I don't care about Schulformen. I care about what people can do. The obsession with certificates and tracks is a German cultural disease. Let kids learn longer together, assess them on competencies, and let the market decide what matters.", argdown_type: "alternative", author_id: uid(8), score: 11 },
      { content: "My parents came from Lebanon. They didn't understand the German school system. Nobody explained the difference between Gymnasium and Realschule. My teacher recommended Realschule. My parents accepted it. I later did Abitur the hard way, through evening school. How many kids like me never got that second chance?", argdown_type: "evidence", author_id: uid(2), score: 38 },
      { content: "Careful with international comparisons. Finland has 5.5 million people, low immigration, high social trust, and well-paid teachers. Germany has 83 million people, 16 different education systems, and massive social diversity. Copying Finland isn't realistic — we need German solutions.", argdown_type: "rebuttal", author_id: uid(1), score: 15 },
      { content: "Proposal: keep differentiated pathways but delay sorting to age 14 (end of 8th grade). This gives late bloomers and immigrant children more time. It's not as radical as full comprehensivization but addresses the worst excesses of early tracking.", argdown_type: "proposal", author_id: uid(6), score: 20 },
      { content: "The teachers' union will block any real reform. They blocked it in the 70s, the 80s, the 90s. Gymnasium teachers don't want 'those kids' in their classrooms. Until we break that lobby, structural reform is fantasy.", argdown_type: "concern", author_id: uid(9), score: 16 },
      { content: "What I find strange: Germany insists on early tracking but then offers countless 'second chance' pathways — Abendgymnasium, Fachhochschulreife, berufliches Gymnasium. The system acknowledges its own failure by building elaborate workarounds. Why not just fix the initial sorting?", argdown_type: "question", author_id: uid(3), score: 29 },
    ];
    let prevTs3 = 12;
    for (const p of et3posts) {
      const postId = pid();
      allPosts.push({ id: postId, topic_id: et3, parent_post_id: null, author_id: p.author_id, content: p.content, argdown_type: p.argdown_type, depth: 0, score: p.score, created_at: ts(prevTs3, Math.floor(Math.random()*20)) });
      prevTs3 -= 0.8;
    }
  }

  // Existing topic 4
  if (existingTopics && existingTopics.length > 3) {
    const et4 = existingTopics[3].id;
    const et4posts = [
      { content: "Solar mandates sound great on paper. In practice: my building's roof faces north. Solar panels would produce 30% less energy. The payback period extends from 12 to 22 years. Should I still be forced to install them?", argdown_type: "question", author_id: uid(4), score: 23 },
      { content: "Mandates work. California required solar on all new homes since 2020. The cost per unit dropped 12% within two years because of scale. Germany needs to stop asking nicely and start requiring. The technology is ready, the economics are clear.", argdown_type: "claim", author_id: uid(9), score: 18 },
      { content: "As a public health researcher, I want to point out that solar panels on flat roofs can reduce indoor temperatures by 3-5°C in summer. With heat-related deaths increasing (739 excess deaths in Berlin during the 2023 heat wave), this isn't just an energy issue. It's a health infrastructure issue.", argdown_type: "evidence", author_id: uid(5), score: 28 },
      { content: "The mandate should be on the developers, not the building owners. If solar is required at construction, the cost is marginal — 2-3% of total construction cost. Retrofitting existing buildings is 5-10x more expensive. Target new builds, leave existing ones for voluntary programs.", argdown_type: "proposal", author_id: uid(3), score: 31 },
      { content: "My concern is grid stability. Berlin's grid is already strained. Adding thousands of distributed solar sources without massive grid upgrades would cause voltage fluctuations. The mandate should be paired with mandatory battery storage and smart inverters.", argdown_type: "concern", author_id: uid(6), score: 14 },
      { content: "Why solar and not wind? Berlin's wind potential is surprisingly high in the outer districts. Small wind turbines on commercial buildings could produce more energy than solar in winter when we need it most. The solar fixation is driven by lobbying, not physics.", argdown_type: "alternative", author_id: uid(8), score: 5 },
      { content: "Let me be real: most Berliners can barely afford their rent. Now you want to add €10-15k per apartment in solar costs? Even with subsidies, this gets passed to tenants as Modernisierungsumlage. Climate policy that makes poor people poorer isn't progressive — it's regressive.", argdown_type: "objection", author_id: uid(10), score: 33 },
      { content: "I installed solar on my house in Steglitz two years ago. 8.4 kWp system, cost €11,200 after subsidies. My electricity bill went from €180/month to €40. I'll break even in 6 years. For homeowners, it's a no-brainer. The problem is only for renters, where the cost-benefit split is misaligned.", argdown_type: "evidence", author_id: uid(1), score: 20 },
      { content: "Can we separate the question of 'should solar be expanded?' (obviously yes) from 'should it be mandatory for ALL new buildings?' Those are very different positions and lumping them together poisons the debate.", argdown_type: "question", author_id: uid(7), score: 16 },
    ];
    let prevTs4 = 9;
    for (const p of et4posts) {
      const postId = pid();
      allPosts.push({ id: postId, topic_id: et4, parent_post_id: null, author_id: p.author_id, content: p.content, argdown_type: p.argdown_type, depth: 0, score: p.score, created_at: ts(prevTs4, Math.floor(Math.random()*20)) });
      prevTs4 -= 0.6;
    }
  }

  // Existing topic 5
  if (existingTopics && existingTopics.length > 4) {
    const et5 = existingTopics[4].id;
    const et5posts = [
      { content: "Bürgergeld needs sanctions. Not because I want to punish people, but because a system without consequences loses public legitimacy. When working people see neighbors choosing not to work while receiving benefits, it erodes social solidarity. That's not a right-wing talking point — it's a practical concern about system sustainability.", argdown_type: "claim", author_id: uid(1), score: 22 },
      { content: "Sanctions don't work. The IAB (Institute for Employment Research) published data showing that sanctioned recipients are MORE likely to drop out of the system entirely — homelessness, black market work, health deterioration. You're not motivating people. You're punishing poverty.", argdown_type: "rebuttal", author_id: uid(5), score: 30 },
      { content: "I was on Hartz IV for 14 months after my company went bankrupt. The Jobcenter sent me to three 'Maßnahmen' that were useless — Excel courses, 'application training', a 'personality workshop'. Meanwhile, the one thing I needed — a forklift license — took 8 months to approve. The system wastes money on pointless programs while blocking actual re-qualification.", argdown_type: "evidence", author_id: uid(4), score: 41 },
      { content: "The real question isn't sanctions vs. no sanctions. It's: what actually helps people find work? The answer from the evidence is: individual coaching, targeted training, and removing barriers (childcare, transport, health). None of these require sanctions. They require investment.", argdown_type: "proposal", author_id: uid(3), score: 26 },
      { content: "I employ 15 people in my IT company. I've tried hiring from the Jobcenter pipeline. The candidates they send are often completely unqualified for the positions. Not because they're lazy — because the matching system is broken. The Jobcenter doesn't understand the labor market. They think 'IT' is one job.", argdown_type: "evidence", author_id: uid(6), score: 18 },
      { content: "502€ per month plus rent. That's Bürgergeld. Try living on that in Berlin. Groceries alone cost 250€ if you're careful. After electricity, phone, and hygiene products, you have maybe 50€ left for EVERYTHING else. Anyone who thinks this is comfortable has never tried it.", argdown_type: "objection", author_id: uid(7), score: 36 },
      { content: "The Scandinavian model: high benefits, high support, high expectations. Denmark's 'flexicurity' combines generous unemployment insurance with active labor market policies and employer flexibility. The result: unemployment duration is 40% shorter than Germany's. We need the whole package, not cherry-picked elements.", argdown_type: "alternative", author_id: uid(5), score: 19 },
      { content: "I'm tired of this debate pretending everyone on Bürgergeld is the same. There are single mothers, disabled people, long-term unemployed 58-year-olds, and yes, some people who could work but don't. Policy that treats them all the same will fail all of them.", argdown_type: "concern", author_id: uid(2), score: 34 },
      { content: "Hot take: universal basic income would solve this entire debate. No more bureaucracy, no more Jobcenter humiliation, no more sanctions theater. Just give everyone a floor and let them decide what to do with their lives. The savings from eliminating the welfare bureaucracy alone would fund a significant portion.", argdown_type: "alternative", author_id: uid(9), score: 13 },
      { content: "Has anyone calculated the administrative cost of sanctions? Each sanction decision requires case worker time, legal review, potential appeal — the Sozialgerichte are drowning in Bürgergeld cases. The sanctions might cost more to implement than they save. Does anyone have actual numbers?", argdown_type: "question", author_id: uid(3), score: 17 },
      { content: "My wife works 40 hours/week in retail and brings home 1,600€ net. After rent and Kita, we have less disposable income than our neighbor who's on Bürgergeld with two kids. I don't resent my neighbor. I resent a system where full-time work doesn't guarantee a decent life. Raise wages, don't cut benefits.", argdown_type: "claim", author_id: uid(10), score: 48 },
    ];
    let prevTs5 = 11;
    for (const p of et5posts) {
      const postId = pid();
      allPosts.push({ id: postId, topic_id: et5, parent_post_id: null, author_id: p.author_id, content: p.content, argdown_type: p.argdown_type, depth: 0, score: p.score, created_at: ts(prevTs5, Math.floor(Math.random()*20)) });
      prevTs5 -= 0.7;
    }
  }

  // Insert all posts
  const batchSize = 20;
  for (let i = 0; i < allPosts.length; i += batchSize) {
    const batch = allPosts.slice(i, i + batchSize);
    const { error } = await supabase.from("posts").insert(batch);
    if (error) console.error(`Post batch ${i} error:`, error.message);
  }

  // Generate votes based on scores
  // For each post, create vote records to match the score
  // We'll use a subset of the fictional users as voters
  const voterIds = users.map(u => u.id);
  const allVotes: { post_id: string; user_id: string; value: number }[] = [];

  for (const post of allPosts) {
    if (post.score === 0) continue;
    const absScore = Math.abs(post.score);
    const isNegative = post.score < 0;

    // For positive scores: mostly upvotes with some downvotes
    // For negative scores: mostly downvotes with some upvotes
    const totalVotes = Math.min(absScore + Math.floor(Math.random() * 3), voterIds.length);
    const shuffled = [...voterIds].sort(() => Math.random() - 0.5).slice(0, totalVotes);

    for (let i = 0; i < shuffled.length; i++) {
      if (shuffled[i] === post.author_id) continue; // Don't self-vote
      
      let value: number;
      if (isNegative) {
        value = i < absScore ? -1 : 1;
      } else {
        // For controversial posts (high score but polarizing), add some downvotes
        const isControversial = post.score > 15 && Math.random() < 0.2;
        value = isControversial ? -1 : 1;
      }
      allVotes.push({ post_id: post.id, user_id: shuffled[i], value });
    }
  }

  // Insert votes in batches
  for (let i = 0; i < allVotes.length; i += 50) {
    const batch = allVotes.slice(i, i + 50);
    const { error } = await supabase.from("votes").insert(batch);
    if (error) console.error(`Vote batch ${i} error:`, error.message);
  }

  return new Response(JSON.stringify({
    success: true,
    profiles_created: users.length,
    topics_created: newTopics.length,
    existing_topics_populated: existingTopics?.length ?? 0,
    posts_created: allPosts.length,
    votes_created: allVotes.length,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
