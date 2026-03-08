import { Topic, TopicMeta, ArgumentNode } from '@/types/discussion';

const authors = {
  maria: { id: 'a1', name: 'Maria Chen', avatar: '👩‍💼', role: 'Urban Planner' },
  james: { id: 'a2', name: 'James Okafor', avatar: '🧑‍💻', role: 'Daily Commuter' },
  linda: { id: 'a3', name: 'Linda Vasquez', avatar: '👩‍🔬', role: 'Environmental Researcher' },
  tom: { id: 'a4', name: 'Tom Brennan', avatar: '🧑‍🍳', role: 'Small Business Owner' },
  aisha: { id: 'a5', name: 'Aisha Patel', avatar: '👩‍⚕️', role: 'Disability Advocate' },
  chen: { id: 'a6', name: 'Chen Wei', avatar: '🧑‍🏫', role: 'Transit Rider' },
  sarah: { id: 'a7', name: 'Sarah Johansson', avatar: '👩‍🎓', role: 'Graduate Student' },
  mike: { id: 'a8', name: 'Mike DeLuca', avatar: '🧑‍🔧', role: 'Delivery Driver' },
  priya: { id: 'a9', name: 'Priya Sharma', avatar: '👩‍💻', role: 'Data Analyst' },
  david: { id: 'a10', name: 'David Kim', avatar: '🧑‍⚖️', role: 'City Council Aide' },
};

const argumentMap: ArgumentNode[] = [
  {
    id: 'am-1',
    type: 'claim',
    text: 'Congestion pricing will reduce downtown traffic by 15–25% and improve air quality',
    author: 'Maria Chen',
    relatedPostIds: ['p1'],
    children: [
      {
        id: 'am-1-1',
        type: 'support',
        text: 'Evidence from London, Stockholm, and Singapore confirms significant traffic reduction',
        author: 'Maria Chen',
        relatedPostIds: ['p1'],
        children: [
          {
            id: 'am-1-1-1',
            type: 'concern',
            text: 'Stockholm had much better transit infrastructure before pricing — our city doesn\'t',
            author: 'Sarah Johansson',
            relatedPostIds: ['p1'],
            children: [],
          },
        ],
      },
      {
        id: 'am-1-2',
        type: 'support',
        text: 'Pediatric asthma rates downtown are 40% above city average — health costs of inaction are real',
        author: 'Linda Vasquez',
        relatedPostIds: ['p3'],
        children: [],
      },
      {
        id: 'am-1-3',
        type: 'objection',
        text: 'The $9 fee is effectively a tax on people who have no transit alternative',
        author: 'James Okafor',
        relatedPostIds: ['p2'],
        children: [
          {
            id: 'am-1-3-1',
            type: 'support',
            text: 'Bus routes to suburbs were cut 3 years ago — many commuters have zero alternative',
            author: 'James Okafor',
            relatedPostIds: ['p2'],
            children: [],
          },
          {
            id: 'am-1-3-2',
            type: 'support',
            text: 'For minimum wage workers, the fee is a much bigger share of income',
            author: 'Tom Brennan',
            relatedPostIds: ['p7'],
            children: [],
          },
        ],
      },
      {
        id: 'am-1-4',
        type: 'objection',
        text: 'Small businesses will suffer from higher delivery costs and reduced foot traffic',
        author: 'Tom Brennan',
        relatedPostIds: ['p4'],
        children: [
          {
            id: 'am-1-4-1',
            type: 'question',
            text: 'Has anyone modeled the economic impact on local businesses?',
            author: 'Tom Brennan',
            relatedPostIds: ['p4'],
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 'am-2',
    type: 'proposal',
    text: 'Phased approach: start at $4–5, invest in transit for 2 years, then raise to $9',
    author: 'Sarah Johansson',
    relatedPostIds: ['p10'],
    children: [
      {
        id: 'am-2-1',
        type: 'support',
        text: 'Addresses the "no alternative" problem while still making progress',
        author: 'Sarah Johansson',
        relatedPostIds: ['p10'],
        children: [],
      },
      {
        id: 'am-2-2',
        type: 'concern',
        text: 'Lower initial fee may not generate enough revenue for meaningful transit improvements',
        relatedPostIds: [],
        children: [],
      },
    ],
  },
  {
    id: 'am-3',
    type: 'claim',
    text: 'Exemptions and equity measures are essential for the policy to be fair',
    relatedPostIds: ['p5', 'p9'],
    children: [
      {
        id: 'am-3-1',
        type: 'support',
        text: 'Disabled residents depend on door-to-door car transport — full exemptions needed',
        author: 'Aisha Patel',
        relatedPostIds: ['p5'],
        children: [],
      },
      {
        id: 'am-3-2',
        type: 'support',
        text: 'Delivery drivers will absorb costs — commercial exemptions or reduced rates needed',
        author: 'Mike DeLuca',
        relatedPostIds: ['p8'],
        children: [],
      },
      {
        id: 'am-3-3',
        type: 'concern',
        text: '200% poverty line threshold creates a cliff effect that hurts the working poor',
        author: 'Aisha Patel',
        relatedPostIds: ['p9'],
        children: [],
      },
      {
        id: 'am-3-4',
        type: 'question',
        text: 'How will revenue allocation be enforced and made accountable?',
        author: 'Chen Wei',
        relatedPostIds: ['p6'],
        children: [],
      },
    ],
  },
  {
    id: 'am-4',
    type: 'alternative',
    text: 'Consider parking reform, employer levies, or other mechanisms instead',
    relatedPostIds: [],
    children: [
      {
        id: 'am-4-1',
        type: 'question',
        text: 'Could the same goals be achieved without congestion pricing?',
        relatedPostIds: [],
        children: [],
      },
    ],
  },
];

export const congestionTopic: Topic = {
  id: 'topic-1',
  title: 'Should the city implement a congestion pricing zone?',
  category: 'Urban Policy',
  status: 'active',
  author: authors.david,
  createdAt: '2026-03-01T10:00:00Z',
  participantCount: 47,
  postCount: 10,
  proposal: `The city council is considering a congestion pricing zone covering the downtown core. Vehicles entering the zone during peak hours (7–10 AM, 4–7 PM) would pay a $9 daily fee. Revenue would fund public transit expansion and cycling infrastructure.\n\nThis discussion aims to gather community perspectives before the public hearing on April 15th. We want to understand: Who benefits? Who is harmed? What conditions would make this acceptable? What alternatives should be considered?`,

  summary: {
    text: 'The discussion is polarized between economic concerns and environmental benefits. There is emerging agreement that exemptions and revenue allocation are key design questions. A phased approach is gaining traction as a compromise.',
    positions: [
      { authorName: 'Maria Chen', position: 'Supports pricing based on international evidence showing 15–25% traffic reduction', postId: 'p1' },
      { authorName: 'James Okafor', position: 'Opposes the fee as a regressive tax on commuters without transit alternatives', postId: 'p2' },
      { authorName: 'Linda Vasquez', position: 'Argues health costs of inaction disproportionately affect low-income communities', postId: 'p3' },
      { authorName: 'Tom Brennan', position: 'Warns about economic impact on small businesses and delivery costs', postId: 'p4' },
      { authorName: 'Aisha Patel', position: 'Demands full exemptions for disabled residents and caregivers', postId: 'p5' },
      { authorName: 'Sarah Johansson', position: 'Proposes a phased approach starting with lower fees', postId: 'p10' },
    ],
    tensions: [], // will be filled from topic tensions
    openQuestions: [], // will be filled from topic openQuestions
    emergingProposals: [
      {
        id: 'ep-1',
        title: 'Phased pricing with transit investment first',
        description: 'Start at $4–5, invest revenue in transit for 2 years, then raise to $9 once alternatives exist.',
        supportedBy: ['Sarah Johansson'],
        relatedPostIds: ['p10'],
      },
      {
        id: 'ep-2',
        title: 'Broad exemptions with sliding scale',
        description: 'Exemptions for disabled residents, caregivers, and a sliding scale replacing the hard poverty-line cutoff.',
        supportedBy: ['Aisha Patel', 'David Kim'],
        relatedPostIds: ['p5', 'p9'],
      },
    ],
  },

  emergingProposals: [
    {
      id: 'ep-1',
      title: 'Phased pricing with transit investment first',
      description: 'Start at $4–5, invest revenue in transit for 2 years, then raise to $9 once alternatives exist.',
      supportedBy: ['Sarah Johansson'],
      relatedPostIds: ['p10'],
    },
    {
      id: 'ep-2',
      title: 'Broad exemptions with sliding scale',
      description: 'Exemptions for disabled residents, caregivers, and a sliding scale replacing the hard poverty-line cutoff.',
      supportedBy: ['Aisha Patel', 'David Kim'],
      relatedPostIds: ['p5', 'p9'],
    },
  ],

  argumentMap,

  posts: [
    {
      id: 'p1',
      author: authors.maria,
      content: 'As an urban planner, I\'ve studied congestion pricing in London, Stockholm, and Singapore. The evidence is clear: it reduces traffic 15–25%, improves air quality, and generates revenue for transit. Stockholm\'s public approval went from 30% before implementation to 70% after. The key is designing the right exemptions and investing revenue visibly.',
      createdAt: '2026-03-01T11:30:00Z',
      reactions: [
        { type: 'support', count: 12, userReacted: false },
        { type: 'nuance', count: 3, userReacted: false },
        { type: 'disagree', count: 1, userReacted: false },
      ],
      replies: [
        {
          id: 'r1-1',
          author: authors.sarah,
          content: 'The Stockholm comparison is interesting but their public transit was already much better before pricing started. Can we really expect the same results without comparable transit infrastructure?',
          createdAt: '2026-03-01T12:15:00Z',
          reactions: [
            { type: 'support', count: 8, userReacted: false },
            { type: 'nuance', count: 2, userReacted: false },
            { type: 'disagree', count: 0, userReacted: false },
          ],
        },
      ],
    },
    {
      id: 'p2',
      author: authors.james,
      content: 'I drive 45 minutes each way from the suburbs because the bus route was cut three years ago. Now you want to charge me $9/day on top of gas and parking? That\'s $180/month for people who already have no alternative. This is a tax on people who can\'t afford to live downtown.',
      createdAt: '2026-03-01T14:00:00Z',
      reactions: [
        { type: 'support', count: 18, userReacted: false },
        { type: 'nuance', count: 1, userReacted: false },
        { type: 'disagree', count: 3, userReacted: false },
      ],
      replies: [],
    },
    {
      id: 'p3',
      author: authors.linda,
      content: 'Downtown air quality has been declining for 5 years. Pediatric asthma rates in the core are 40% above the city average. We need to account for the health costs of doing nothing — those costs are also disproportionately borne by low-income communities who live near major roads.',
      createdAt: '2026-03-02T09:00:00Z',
      reactions: [
        { type: 'support', count: 9, userReacted: false },
        { type: 'nuance', count: 5, userReacted: false },
        { type: 'disagree', count: 2, userReacted: false },
      ],
      replies: [
        {
          id: 'r3-1',
          author: authors.james,
          content: 'I agree air quality matters, but the solution can\'t be to price out the people who are already struggling. We need both: clean air AND affordable commuting options.',
          createdAt: '2026-03-02T10:30:00Z',
          reactions: [
            { type: 'support', count: 14, userReacted: false },
            { type: 'nuance', count: 0, userReacted: false },
            { type: 'disagree', count: 0, userReacted: false },
          ],
        },
      ],
    },
    {
      id: 'p4',
      author: authors.tom,
      content: 'My restaurant depends on delivery trucks and customers driving in. A $9 fee will raise my supply costs and reduce foot traffic. Small businesses downtown are already struggling post-pandemic. Has anyone modeled the economic impact on local businesses?',
      createdAt: '2026-03-02T15:00:00Z',
      reactions: [
        { type: 'support', count: 11, userReacted: false },
        { type: 'nuance', count: 2, userReacted: false },
        { type: 'disagree', count: 1, userReacted: false },
      ],
      replies: [],
    },
    {
      id: 'p5',
      author: authors.aisha,
      content: 'As a disability advocate, I need to flag that many disabled residents depend on door-to-door car transport. Public transit is not accessible enough for wheelchair users or people with chronic fatigue. Any pricing scheme MUST include full exemptions for disabled residents and their caregivers.',
      createdAt: '2026-03-03T08:00:00Z',
      reactions: [
        { type: 'support', count: 22, userReacted: false },
        { type: 'nuance', count: 0, userReacted: false },
        { type: 'disagree', count: 0, userReacted: false },
      ],
      replies: [],
    },
    {
      id: 'p6',
      author: authors.chen,
      content: 'I\'ve been riding the 42 bus for 8 years. It\'s overcrowded, late, and the shelters leak. If congestion pricing revenue actually goes to transit — real improvements, not just studies — I\'m in favor. But I\'ve heard these promises before. How do we ensure accountability?',
      createdAt: '2026-03-03T11:00:00Z',
      reactions: [
        { type: 'support', count: 15, userReacted: false },
        { type: 'nuance', count: 4, userReacted: false },
        { type: 'disagree', count: 0, userReacted: false },
      ],
      replies: [],
    },
    {
      id: 'p7',
      author: authors.priya,
      content: 'I pulled publicly available traffic data. Peak hour congestion costs the average commuter 38 minutes/day. At median wage, that\'s ~$4,200/year in lost time per person. The $9 fee would reduce entries by an estimated 20%, saving frequent commuters about $2,800/year in time value. The math works for most — but not for those with no transit alternative.',
      createdAt: '2026-03-04T10:00:00Z',
      reactions: [
        { type: 'support', count: 7, userReacted: false },
        { type: 'nuance', count: 6, userReacted: false },
        { type: 'disagree', count: 2, userReacted: false },
      ],
      replies: [
        {
          id: 'r7-1',
          author: authors.tom,
          content: 'These numbers assume people value their time at median wage. For a minimum wage worker, the fee is a much bigger share of income even if the time savings are the same.',
          createdAt: '2026-03-04T11:30:00Z',
          reactions: [
            { type: 'support', count: 9, userReacted: false },
            { type: 'nuance', count: 1, userReacted: false },
            { type: 'disagree', count: 0, userReacted: false },
          ],
        },
      ],
    },
    {
      id: 'p8',
      author: authors.mike,
      content: 'Delivery drivers like me will eat this cost directly. Companies won\'t absorb it — they\'ll cut our pay or raise delivery fees for customers. This needs a commercial vehicle exemption or reduced rate, at least for essential deliveries.',
      createdAt: '2026-03-04T14:00:00Z',
      reactions: [
        { type: 'support', count: 13, userReacted: false },
        { type: 'nuance', count: 1, userReacted: false },
        { type: 'disagree', count: 1, userReacted: false },
      ],
      replies: [],
    },
    {
      id: 'p9',
      author: authors.david,
      content: 'To clarify the current proposal: exemptions are planned for emergency vehicles, disabled permit holders, and low-income residents (below 200% poverty line would get a 75% discount). Revenue is legally earmarked for transit, with an independent oversight board. I want to hear whether these provisions address your concerns or if more is needed.',
      createdAt: '2026-03-05T09:00:00Z',
      reactions: [
        { type: 'support', count: 6, userReacted: false },
        { type: 'nuance', count: 8, userReacted: false },
        { type: 'disagree', count: 3, userReacted: false },
      ],
      replies: [
        {
          id: 'r9-1',
          author: authors.aisha,
          content: 'Disabled permit holders are covered — good. But "low-income" at 200% poverty line excludes many working poor who are just above the threshold. The cliff effect will hurt real people.',
          createdAt: '2026-03-05T10:00:00Z',
          reactions: [
            { type: 'support', count: 11, userReacted: false },
            { type: 'nuance', count: 2, userReacted: false },
            { type: 'disagree', count: 0, userReacted: false },
          ],
        },
      ],
    },
    {
      id: 'p10',
      author: authors.sarah,
      content: 'What about a phased approach? Start with a lower fee ($4–5), invest the initial revenue in transit improvements for 2 years, then raise to $9 once alternatives actually exist. This addresses the "no alternative" problem while still moving forward.',
      createdAt: '2026-03-06T08:00:00Z',
      reactions: [
        { type: 'support', count: 20, userReacted: false },
        { type: 'nuance', count: 3, userReacted: false },
        { type: 'disagree', count: 2, userReacted: false },
      ],
      replies: [],
    },
  ],

  tensions: [
    {
      id: 't1',
      label: 'Economic Burden vs. Environmental Benefit',
      sideA: 'The fee disproportionately hurts low-income commuters and small businesses who have no viable alternative',
      sideB: 'Inaction has serious health and environmental costs that also fall on vulnerable communities',
      relatedPostIds: ['p2', 'p3', 'p4', 'p7'],
    },
    {
      id: 't2',
      label: 'Immediate Action vs. Transit-First Approach',
      sideA: 'We should implement pricing now and invest the revenue into transit improvements',
      sideB: 'Transit alternatives must exist before pricing makes sense — otherwise we\'re charging people with no choice',
      relatedPostIds: ['p1', 'p6', 'p10', 'p2'],
    },
    {
      id: 't3',
      label: 'Universal Pricing vs. Targeted Exemptions',
      sideA: 'A simple universal fee is most effective and easiest to administer',
      sideB: 'Without broad exemptions and sliding scales, the policy becomes regressive',
      relatedPostIds: ['p5', 'p8', 'p9'],
    },
  ],

  clusters: [
    {
      id: 'c1',
      name: 'Equity & Affordability',
      description: 'Concerns about impact on low-income residents, working poor, and the income threshold for exemptions',
      postCount: 5,
      relatedPostIds: ['p2', 'p5', 'p7', 'p8', 'p9'],
    },
    {
      id: 'c2',
      name: 'Transit Infrastructure',
      description: 'Whether current public transit is adequate and how revenue should improve it',
      postCount: 4,
      relatedPostIds: ['p1', 'p6', 'p10', 'p2'],
    },
    {
      id: 'c3',
      name: 'Business Impact',
      description: 'Effects on small businesses, delivery costs, and commercial operations downtown',
      postCount: 3,
      relatedPostIds: ['p4', 'p8', 'p7'],
    },
    {
      id: 'c4',
      name: 'Implementation Design',
      description: 'Phasing, fee levels, exemption structures, oversight, and accountability mechanisms',
      postCount: 4,
      relatedPostIds: ['p9', 'p10', 'p1', 'p5'],
    },
  ],

  openQuestions: [
    {
      id: 'q1',
      question: 'Has anyone modeled the economic impact on local downtown businesses?',
      raisedInPostId: 'p4',
      raisedBy: 'Tom Brennan',
      relatedPostIds: ['p4', 'p8'],
    },
    {
      id: 'q2',
      question: 'How will revenue allocation be enforced and made accountable?',
      raisedInPostId: 'p6',
      raisedBy: 'Chen Wei',
      relatedPostIds: ['p6', 'p9'],
    },
    {
      id: 'q3',
      question: 'Is a phased approach with lower initial fees politically and practically viable?',
      raisedInPostId: 'p10',
      raisedBy: 'Sarah Johansson',
      relatedPostIds: ['p10', 'p9'],
    },
  ],

  guidance: [
    {
      id: 'g1',
      type: 'overrepresented',
      label: 'Cost concerns are well-covered',
      description: 'Multiple posts already address the financial burden. Consider building on existing points rather than restating them.',
    },
    {
      id: 'g2',
      type: 'evidence-needed',
      label: 'Business impact data is missing',
      description: 'Tom and Mike raised business concerns, but no one has shared data on how congestion pricing affected businesses in other cities.',
    },
    {
      id: 'g3',
      type: 'missing-perspective',
      label: 'No environmental justice voice yet',
      description: 'Linda mentioned health impacts, but no one from affected neighborhoods near highways has shared their experience.',
    },
    {
      id: 'g4',
      type: 'gap',
      label: 'Alternative revenue models unexplored',
      description: 'Could the same goals be achieved through parking reform, employer levies, or other mechanisms? No one has compared alternatives.',
    },
    {
      id: 'g5',
      type: 'missing-counterargument',
      label: 'No rebuttal to phased approach',
      description: 'Sarah\'s phased proposal has strong support but no one has raised potential downsides or risks.',
    },
    {
      id: 'g6',
      type: 'missing-alternative',
      label: 'No non-pricing alternatives proposed',
      description: 'All discussion assumes some form of pricing. What about congestion-reducing alternatives like remote work incentives or staggered hours?',
    },
    {
      id: 'g7',
      type: 'unresolved-question',
      label: 'Accountability mechanism undefined',
      description: 'Chen Wei asked how revenue oversight would work. David mentioned a board but specifics are missing.',
    },
  ],
};

export const stubTopics: TopicMeta[] = [
  {
    id: 'topic-1',
    title: 'Should the city implement a congestion pricing zone?',
    category: 'Urban Policy',
    status: 'active',
    author: authors.david,
    createdAt: '2026-03-01T10:00:00Z',
    participantCount: 47,
    postCount: 10,
    proposal: congestionTopic.proposal,
  },
  {
    id: 'topic-2',
    title: 'Redesigning the public library system for the digital age',
    category: 'Public Services',
    status: 'active',
    author: { id: 'a11', name: 'Fatima Al-Rashid', avatar: '👩‍📚', role: 'Head Librarian' },
    createdAt: '2026-02-20T09:00:00Z',
    participantCount: 31,
    postCount: 8,
    proposal: 'The library board proposes converting 30% of physical book space to digital labs, co-working areas, and community program rooms.',
  },
  {
    id: 'topic-3',
    title: 'Should schools ban smartphones during class hours?',
    category: 'Education',
    status: 'seeking-consensus',
    author: { id: 'a12', name: 'Robert Nguyen', avatar: '🧑‍🏫', role: 'School Board Member' },
    createdAt: '2026-02-15T14:00:00Z',
    participantCount: 89,
    postCount: 24,
    proposal: 'A proposal to require all students K-12 to store phones in locked pouches during school hours, with exceptions for medical needs.',
  },
];

export const topicDeliberationPreviews: Record<string, { tensions: number; openQuestions: number; topCluster: string; summary: string }> = {
  'topic-1': {
    tensions: 3,
    openQuestions: 3,
    topCluster: 'Equity & Affordability',
    summary: 'Polarized between economic burden and environmental benefits. Exemption design is emerging as key.',
  },
  'topic-2': {
    tensions: 2,
    openQuestions: 4,
    topCluster: 'Digital Access Equity',
    summary: 'Broad support for modernization but concern about losing quiet study spaces and serving elderly users.',
  },
  'topic-3': {
    tensions: 2,
    openQuestions: 2,
    topCluster: 'Student Autonomy',
    summary: 'Moving toward consensus on a trial period. Teachers largely supportive; students and some parents opposed.',
  },
};
