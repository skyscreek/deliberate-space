import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const users = [
    { email: 'sarah.chen@seed.local', display_name: 'Sarah Chen', bio: 'Urban policy researcher and transit advocate. I believe cities should be designed for people, not cars.', location: 'Brooklyn, NY' },
    { email: 'marcus.johnson@seed.local', display_name: 'Marcus Johnson', bio: 'Tech entrepreneur. Free markets and individual liberty. Less regulation, more innovation.', location: 'Austin, TX' },
    { email: 'elena.rodriguez@seed.local', display_name: 'Elena Rodriguez', bio: 'Community organizer fighting for affordable housing and workers rights. Proud union family.', location: 'Chicago, IL' },
    { email: 'david.kim@seed.local', display_name: 'David Kim', bio: 'Data analyst. I follow the evidence wherever it leads. Show me the numbers.', location: 'Seattle, WA' },
    { email: 'rachel.foster@seed.local', display_name: 'Rachel Foster', bio: 'Small business owner, 20 years in retail. Policies should help Main Street, not just Wall Street.', location: 'Columbus, OH' },
    { email: 'james.obrien@seed.local', display_name: "James O'Brien", bio: 'Union electrician, 30 years IBEW. Working people deserve a seat at the table.', location: 'Detroit, MI' },
    { email: 'priya.patel@seed.local', display_name: 'Priya Patel', bio: "Environmental scientist studying urban heat islands. Climate action can't wait.", location: 'Portland, OR' },
    { email: 'tyler.morrison@seed.local', display_name: 'Tyler Morrison', bio: 'CPA and young professional. Fiscal responsibility matters. Show me the budget.', location: 'Denver, CO' },
    { email: 'aisha.williams@seed.local', display_name: 'Aisha Williams', bio: 'Social worker and equity advocate. Every policy decision is a values decision.', location: 'Atlanta, GA' },
    { email: 'robert.schneider@seed.local', display_name: 'Robert Schneider', bio: 'Retired high school teacher, 35 years. Moderate and proud of it.', location: 'Minneapolis, MN' },
    { email: 'lisa.chang@seed.local', display_name: 'Lisa Chang', bio: 'Urban planner specializing in mixed-use development. Good design solves problems.', location: 'San Francisco, CA' },
    { email: 'mike.kowalski@seed.local', display_name: 'Mike Kowalski', bio: 'Truck driver. I see the real effects of bad policy every day on the road.', location: 'Pittsburgh, PA' },
    { email: 'fatima.alrashid@seed.local', display_name: 'Fatima Al-Rashid', bio: 'Public health researcher. Health equity is the foundation of a just society.', location: 'Boston, MA' },
    { email: 'chris.brennan@seed.local', display_name: 'Chris Brennan', bio: 'Software engineer. Pragmatic moderate — I just want things that actually work.', location: 'Raleigh, NC' },
    { email: 'natasha.volkov@seed.local', display_name: 'Natasha Volkov', bio: 'Immigrated 15 years ago. Small business owner. I value both opportunity and community.', location: 'Philadelphia, PA' },
  ]

  // Create auth users and collect IDs
  const userIds: string[] = []
  for (const u of users) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: 'SeedPass123!',
      email_confirm: true,
      user_metadata: { display_name: u.display_name },
    })
    if (error) {
      // If user already exists, look up their id
      if (error.message?.includes('already been registered')) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers()
        const found = list?.users?.find(x => x.email === u.email)
        if (found) { userIds.push(found.id); continue }
      }
      return new Response(JSON.stringify({ error: error.message, user: u.email }), { status: 500, headers: corsHeaders })
    }
    userIds.push(data.user.id)
  }

  // Update profiles with bio and location (the trigger already created them)
  for (let i = 0; i < users.length; i++) {
    await supabaseAdmin.from('profiles').update({
      bio: users[i].bio,
      location: users[i].location,
    }).eq('user_id', userIds[i])
  }

  // Create topics
  const topicsData = [
    { author_idx: 0, title: 'Should we implement congestion pricing downtown?', description: 'Several cities have introduced congestion pricing to reduce traffic and fund transit. Should our city follow suit? What would the impacts be on different communities?', category: 'Transportation', proposal: 'Implement a $15 daily charge for vehicles entering the downtown core during peak hours (6am-8pm weekdays), with revenue dedicated to public transit improvements.' },
    { author_idx: 2, title: 'Universal Basic Income: Pilot program proposal', description: 'A proposal to launch a 2-year UBI pilot providing $1,000/month to 1,000 randomly selected residents. How should we evaluate success?', category: 'Economy', proposal: 'Launch a 24-month UBI pilot: $1,000/month to 1,000 residents selected by lottery, funded by reallocating existing welfare administration costs and a small tech sector surcharge.' },
    { author_idx: 6, title: 'Green infrastructure plan for urban heat islands', description: 'Our city loses an average of 12 residents per year to extreme heat. Tree canopy coverage has dropped 15% in the last decade. What should our green infrastructure priorities be?', category: 'Environment', proposal: null },
    { author_idx: 10, title: 'Zoning reform: Allow mixed-use in residential areas?', description: 'Current zoning restricts commercial activity in most residential neighborhoods. Should we allow corner stores, cafes, and small offices in residential zones?', category: 'Housing', proposal: 'Amend zoning code to allow small-scale commercial use (under 2,000 sq ft) on corner lots in all residential zones, with design review.' },
    { author_idx: 12, title: 'Community health centers: Funding and access expansion', description: 'Wait times at community health centers have doubled in 3 years. Emergency room visits for non-emergency care cost the city $45M annually. How do we fix primary care access?', category: 'Healthcare', proposal: null },
  ]

  const topicIds: string[] = []
  for (const t of topicsData) {
    const { data, error } = await supabaseAdmin.from('topics').insert({
      author_id: userIds[t.author_idx],
      title: t.title,
      description: t.description,
      category: t.category,
      proposal: t.proposal,
      status: 'active',
    }).select('id').single()
    if (error) return new Response(JSON.stringify({ error: error.message, topic: t.title }), { status: 500, headers: corsHeaders })
    topicIds.push(data.id)
  }

  // Helper to insert a post and return its id
  async function insertPost(topicIdx: number, authorIdx: number, content: string, parentId: string | null, depth: number, argdownType: string | null) {
    const { data, error } = await supabaseAdmin.from('posts').insert({
      topic_id: topicIds[topicIdx],
      author_id: userIds[authorIdx],
      content,
      parent_post_id: parentId,
      depth,
      argdown_type: argdownType,
      score: 0,
    }).select('id').single()
    if (error) throw new Error(error.message)
    return data.id
  }

  // ===== TOPIC 0: Congestion Pricing =====
  const p0_1 = await insertPost(0, 0, "I've studied congestion pricing in London, Stockholm, and Singapore. The evidence is overwhelming: traffic drops 15-25%, transit ridership increases, air quality improves, and the revenue funds better alternatives. The $15 charge is reasonable — Stockholm started at roughly $6 and still saw massive benefits. The key is dedicating 100% of revenue to transit, not general funds.", null, 0, 'support')
  const p0_2 = await insertPost(0, 1, "Another tax disguised as policy. Small businesses that depend on vehicle deliveries will be crushed. Have you calculated the impact on a restaurant that gets 5 deliveries a day? That's $75/day in new costs passed straight to consumers. The free market should determine transportation choices, not government pricing schemes.", null, 0, 'objection')
  const p0_3 = await insertPost(0, 4, "As someone who runs a shop downtown, I'm genuinely torn. Less traffic means more foot traffic and a nicer environment for shoppers. But my suppliers will raise delivery costs. Could we exempt commercial vehicles or have off-peak delivery windows instead?", null, 0, 'concern')
  const p0_4 = await insertPost(0, 8, "We need to center equity in this conversation. Low-income workers who drive because there's no reliable transit to their jobs will bear the heaviest burden. Any congestion pricing plan MUST include income-based exemptions and simultaneous transit improvements, not promises of future improvements.", null, 0, 'concern')
  const p0_5 = await insertPost(0, 3, "Let me share some data: In our city, 68% of downtown commuters already use transit. Of the 32% who drive, the median household income is $95K — well above the city median of $62K. The equity concern is real but often overstated. That said, I'd support income-based discounts as a safeguard.", null, 0, 'evidence')

  // Replies to p0_1
  await insertPost(0, 11, "Sarah's right about the evidence. I'd add that congestion pricing also creates a funding mechanism for the transit improvements that make car-free living viable. It's a virtuous cycle. The cities that implemented it saw benefits compound over 5-10 years.", p0_1, 1, 'support')
  await insertPost(0, 5, "Those studies are from cities with much better existing transit. Our bus system is a joke — buses stuck in the same traffic as cars. Fix transit first, then talk about pricing people off the road.", p0_1, 1, 'objection')

  // Replies to p0_2
  const p0_2r1 = await insertPost(0, 13, "Marcus, I think you're overestimating the per-business impact. Most delivery services would consolidate trips and shift to off-peak hours. London saw delivery efficiency actually improve after congestion pricing because there was less traffic for trucks to sit in.", p0_2, 1, 'rebuttal')
  await insertPost(0, 1, "Chris, consolidation sounds nice in theory. In practice, my friend runs a catering company and her costs went up 30% when NYC did this. Theory and lived experience are different things.", p0_2r1, 2, 'rebuttal')

  // Replies to p0_4
  await insertPost(0, 9, "Aisha makes an important point. When Stockholm implemented their system, they included a hardship exemption for low-income drivers and heavily subsidized transit passes. The net effect was progressive — wealthier drivers subsidized better transit for everyone.", p0_4, 1, 'support')
  await insertPost(0, 14, "In my experience as an immigrant business owner, the bus is already how most working-class people get around. The real question is whether congestion pricing revenue will actually reach underserved routes. I've seen too many promises evaporate.", p0_4, 1, 'concern')

  // More top-level on topic 0
  const p0_6 = await insertPost(0, 7, "Has anyone modeled the environmental impact? Even a 15% traffic reduction downtown could significantly improve air quality in adjacent neighborhoods — which are disproportionately low-income and communities of color. This is also a public health issue.", null, 0, 'evidence')
  await insertPost(0, 12, "Priya, absolutely. Our hospital sees 340 asthma-related ER visits per year from the three zip codes bordering the downtown highway corridor. Reducing vehicle emissions there would have measurable health benefits within the first year.", p0_6, 1, 'support')

  // ===== TOPIC 1: UBI =====
  const p1_1 = await insertPost(1, 2, "I've worked with families trapped in the benefits cliff for 15 years. The current welfare system punishes people for earning more. UBI eliminates that perverse incentive entirely. $1,000/month won't make anyone rich, but it provides a floor of dignity.", null, 0, 'support')
  const p1_2 = await insertPost(1, 7, "$1,000/month x 1,000 people x 24 months = $24 million. Where exactly is this money coming from? 'Reallocating welfare administration costs' is hand-waving. Our welfare admin budget is $8M. The math doesn't add up.", null, 0, 'objection')
  const p1_3 = await insertPost(1, 1, "I'm actually more open to UBI than most people expect. It's simpler than our current welfare bureaucracy, respects individual choice, and could replace dozens of overlapping programs. The libertarian case for UBI is strong — Milton Friedman proposed a version decades ago.", null, 0, 'support')
  await insertPost(1, 5, "I worry about inflation. If everyone gets $1,000 more, won't landlords just raise rent by $1,000? We've seen this with student loans — more aid, higher tuition. Without rent control alongside UBI, it's just a transfer to landlords.", null, 0, 'concern')
  await insertPost(1, 3, "The Stockton SEED pilot (2019-2021) showed: full-time employment increased from 28% to 40%, mental health improved significantly, and recipients spent primarily on food, utilities, and transportation. The inflation concern didn't materialize at that scale. But scaling from 125 to 1,000 people is a different question.", null, 0, 'evidence')

  // Replies on topic 1
  await insertPost(1, 8, "Elena, I respect the intent, but the Stockton pilot was funded by private donors. A city-funded version needs sustainable revenue. I'd support this if we identified specific, permanent funding — maybe a land value tax? That would also address the rent inflation concern.", p1_1, 1, 'alternative')
  await insertPost(1, 9, "Robert Schneider here isn't participating but I think we should also consider: what metrics define 'success' for this pilot? Employment? Health outcomes? Self-reported wellbeing? If we can't agree on metrics upfront, we'll just argue about the results later.", p1_2, 1, 'question')

  // ===== TOPIC 2: Green Infrastructure =====
  const p2_1 = await insertPost(2, 6, "Tree canopy is great, but let's not forget about practical green infrastructure: bioswales, green roofs, permeable pavement. These handle stormwater AND reduce heat. My union can train workers to install and maintain these systems — good jobs and green infrastructure.", null, 0, 'proposal')
  await insertPost(2, 0, "Priority mapping should drive this. Overlay heat island data with income data and health outcomes. The neighborhoods that need trees most are exactly the ones that had them removed for highway construction decades ago. This is also an environmental justice issue.", null, 0, 'support')
  await insertPost(2, 7, "Our research shows that increasing tree canopy by 10% in the hottest census tracts could reduce peak temperatures by 3-5°F and cut heat-related ER visits by roughly 20%. The ROI in healthcare savings alone justifies the investment.", null, 0, 'evidence')
  await insertPost(2, 1, "I support green infrastructure in principle, but who maintains it? Our parks department can barely mow the existing parks. Before planting 10,000 trees, show me the 20-year maintenance budget.", null, 0, 'concern')
  await insertPost(2, 11, "Marcus raises a fair point. The maintenance question is why I'd advocate for a green infrastructure district with dedicated funding — similar to a business improvement district. Property owners pay a small assessment, trees increase property values by 7-15%, everyone wins.", p2_1, 1, 'alternative')

  // ===== TOPIC 3: Zoning Reform =====
  const p3_1 = await insertPost(3, 10, "Corner stores and cafes in residential areas help build community. I grew up with a bodega on the corner — it was where neighbors met. We should allow this by right, not force small business owners through expensive variance processes.", null, 0, 'support')
  await insertPost(3, 4, "I'd welcome the chance to open a second location in a residential area. My concern is the 'design review' in the proposal — that can mean $10,000+ in architect fees and months of delay. If we're going to reform zoning, actually make it easier, don't just shift the bureaucracy.", null, 0, 'concern')
  await insertPost(3, 11, "Good design review doesn't have to be expensive. I'd propose a pattern book approach: pre-approved designs that meet neighborhood character standards. Pick from the book, skip the review. Custom designs get reviewed. This balances quality and speed.", null, 0, 'alternative')
  await insertPost(3, 12, "I've seen what happens when commercial uses creep into residential areas without guardrails. Parking problems, late-night noise, trash. The 2,000 sq ft limit helps, but we need operating hour restrictions and parking requirements too.", null, 0, 'concern')
  await insertPost(3, 14, "My corner store employs 4 people from the neighborhood. We open at 6am, close at 9pm, and we're quieter than the bar three blocks away that's already zoned commercial. Most of the objections to mixed-use come from people who've never lived near a well-run small business.", null, 0, 'rebuttal')

  // ===== TOPIC 4: Community Health =====
  await insertPost(4, 12, "The $45M in avoidable ER costs alone could fund 6 new community health centers. This is the most straightforward cost-saving investment our city can make. Every dollar spent on primary care saves $3-4 in emergency care.", null, 0, 'evidence')
  await insertPost(4, 8, "Before expanding, we need to fix the staffing crisis. Our health centers can't fill nursing positions because they pay 30% below hospital rates. More buildings without staff is just more empty waiting rooms.", null, 0, 'concern')
  await insertPost(4, 2, "Community health workers — trained residents who do outreach, help with appointments, connect people to services — are the missing piece. They're affordable, effective, and they build trust in communities that are skeptical of the healthcare system.", null, 0, 'proposal')
  await insertPost(4, 13, "Mobile health clinics could address geographic access gaps immediately while we plan permanent locations. Our research shows a mobile clinic costs $400K/year to operate but serves 3,000 patients who otherwise use the ER.", null, 0, 'alternative')
  await insertPost(4, 9, "Don't forget mental health. Half of our ER non-emergency visits have a behavioral health component. Community health centers need integrated mental health services — not referrals to a 6-month waitlist.", null, 0, 'support')

  // ===== VOTES =====
  // Realistic voting patterns based on user personalities
  const votes = [
    // Topic 0 votes (congestion pricing - controversial, mixed)
    // p0_1 (Sarah's evidence-based support) - liked by progressives, planners, data people
    { post_id: p0_1, voters: [2, 3, 6, 7, 9, 10, 12, 13], value: 1 },
    { post_id: p0_1, voters: [1, 4, 11], value: -1 },
    // p0_2 (Marcus's objection) - liked by business/libertarian, disliked by urbanists  
    { post_id: p0_2, voters: [1, 4, 5, 11], value: 1 },
    { post_id: p0_2, voters: [0, 2, 6, 8, 10, 13], value: -1 },
    // p0_3 (Rachel's balanced concern) - widely liked
    { post_id: p0_3, voters: [0, 1, 2, 3, 5, 7, 8, 9, 10, 13, 14], value: 1 },
    // p0_4 (Aisha's equity concern) - liked by progressives
    { post_id: p0_4, voters: [0, 2, 5, 6, 8, 9, 12, 14], value: 1 },
    { post_id: p0_4, voters: [1, 7], value: -1 },
    // p0_5 (David's data) - widely respected
    { post_id: p0_5, voters: [0, 1, 2, 6, 7, 9, 10, 13], value: 1 },
    // p0_6 (Priya's environmental angle)
    { post_id: p0_6, voters: [0, 2, 5, 8, 10, 12], value: 1 },
    // Topic 1 votes (UBI)
    { post_id: p1_1, voters: [0, 3, 5, 6, 8, 12, 13], value: 1 },
    { post_id: p1_1, voters: [1, 4, 7], value: -1 },
    { post_id: p1_2, voters: [1, 3, 4, 7, 9, 13], value: 1 },
    { post_id: p1_3, voters: [0, 2, 3, 7, 9, 13], value: 1 },
    // Topic 2 votes (Green infra)
    { post_id: p2_1, voters: [0, 2, 5, 6, 7, 8, 9, 10, 13], value: 1 },
    // Topic 3 votes (Zoning)
    { post_id: p3_1, voters: [0, 2, 3, 4, 5, 10, 13, 14], value: 1 },
    { post_id: p3_1, voters: [11], value: -1 },
  ]

  for (const v of votes) {
    for (const voterIdx of v.voters) {
      await supabaseAdmin.from('votes').insert({
        post_id: v.post_id,
        user_id: userIds[voterIdx],
        value: v.value,
      })
    }
  }

  // Update post scores based on votes
  const allPostIds = new Set<string>()
  for (const v of votes) allPostIds.add(v.post_id)
  for (const postId of allPostIds) {
    const { data: voteData } = await supabaseAdmin.from('votes').select('value').eq('post_id', postId)
    const score = voteData?.reduce((sum: number, v: any) => sum + v.value, 0) ?? 0
    await supabaseAdmin.from('posts').update({ score }).eq('id', postId)
  }

  return new Response(JSON.stringify({ 
    success: true, 
    users: userIds.length, 
    topics: topicIds.length,
    message: 'Seeded 15 users, 5 topics, posts, replies, and votes'
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
