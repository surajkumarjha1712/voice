import { VoiceInfo, StylePreset, PresetScript } from '../types';

export const VOICES_CATALOG: VoiceInfo[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female / Articulate',
    timbre: 'Warm, luminous, balanced, and empathetic',
    description: 'Polished eloquence with crystal-clear diction. The gold standard for audiobooks, guided meditations, and documentary narrations.',
    recommendedStyles: ['Warm Storyteller', 'Calm Meditation', 'Audiobook Chapter', 'Reflective Essay'],
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male / Youthful',
    timbre: 'Crisp, punchy, dynamic, and modern',
    description: 'Brimming with intellectual enthusiasm and high engagement. Perfect for tech podcasts, rapid explainers, commercials, and gaming dialogue.',
    recommendedStyles: ['Energetic Host', 'Tech Podcast', 'Vibrant Commercial', 'Playful Narrator'],
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male / Deep Baritone',
    timbre: 'Sub-bass resonance, authoritative, solemn, and cinematic',
    description: 'Heavy gravitational presence. Ideal for blockbuster trailers, philosophical treatises, noir fiction, and historical documentaries.',
    recommendedStyles: ['Cinematic Trailer', 'Deep Documentary', 'Authoritative Voice', 'Late Night Noir'],
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male / Husky & Textured',
    timbre: 'Rich, gravelly, commanding, and grounded',
    description: 'Weathered intensity with grit. Unbeatable for military sci-fi, rugged character voices, high-stakes drama, and dramatic monologues.',
    recommendedStyles: ['Gritty Sci-Fi', 'Intense Thriller', 'Commanding Speech', 'Mystery Novelist'],
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Neutral / Gentle',
    timbre: 'Smooth, relaxed, conversational, and effortless',
    description: 'Soft and approachable with a natural modern lilt. Perfect for AI companions, ambient meditations, lifestyle vlogs, and customer touchpoints.',
    recommendedStyles: ['Relaxed Companion', 'Lifestyle Host', 'Gentle Guide', 'Conversational AI'],
  },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cinematic-documentary',
    label: 'Cinematic Documentary',
    prompt: 'Solemn, awe-inspiring documentary narrator with measured cadence and deep tonal gravitas',
    category: 'Cinematic',
  },
  {
    id: 'warm-audiobook',
    label: 'Warm Audiobook Reader',
    prompt: 'Warm, intimate storyteller sitting by a hearth, expressive and rich in emotional cadence',
    category: 'Narrative',
  },
  {
    id: 'energetic-podcast',
    label: 'Dynamic Tech Podcast',
    prompt: 'High-energy, intellectually sharp, engaging, and spontaneous podcast host',
    category: 'Broadcast',
  },
  {
    id: 'calm-meditation',
    label: 'Calm Meditation Guide',
    prompt: 'Whisper-soft, soothing, peaceful mindfulness instructor with slow relaxed breath pacing',
    category: 'Lifestyle',
  },
  {
    id: 'breaking-news',
    label: 'Breaking News Anchor',
    prompt: 'Urgent, professional, razor-sharp broadcast journalist delivering critical updates',
    category: 'Broadcast',
  },
  {
    id: 'noir-mystery',
    label: 'Gritty Noir Mystery',
    prompt: 'Low-register, smoky, cynical private investigator narrating through rain-slicked streets',
    category: 'Dramatic',
  },
  {
    id: 'commercial-keynote',
    label: 'Inspiring Keynote',
    prompt: 'Visionary, magnetic tech keynote presenter inspiring an auditorium of thousands',
    category: 'Cinematic',
  },
  {
    id: 'conversational-friend',
    label: 'Casual Conversation',
    prompt: 'Effortless, friendly, natural everyday companion speaking with genuine warmth',
    category: 'Lifestyle',
  },
];

export const VOCAL_EXPRESSION_TAGS = [
  { tag: '<breath>', label: 'Breath', desc: 'Natural inhalation pause' },
  { tag: '<laugh>', label: 'Laugh', desc: 'Chuckle / light laughter' },
  { tag: '<gasp>', label: 'Gasp', desc: 'Surprise / sudden breath' },
  { tag: '|mhm|', label: 'Mhm', desc: 'Affirmative conversational backchannel' },
  { tag: '|yeah|', label: 'Yeah', desc: 'Casual agreement backchannel' },
  { tag: '...', label: 'Dramatic Pause', desc: 'Paced silence' },
];

export const PRESET_SCRIPTS: PresetScript[] = [
  {
    id: 'space-voyage',
    title: 'The Interstellar Frontier',
    category: 'Documentary',
    mode: 'single',
    voice: 'Charon',
    style: 'Deep, cinematic documentary narrator with cosmic reverence',
    content: `Beyond the heliopause, where the solar wind gives way to the interstellar medium, our silent probes drift through eternal cold. <breath> They carry not just titanium instruments, but the faint harmonic echoes of Earth. <breath> To look into that deep silence is to remember how precious this single pale blue dot truly is.`,
  },
  {
    id: 'tech-dialogue',
    title: 'Podcast: The Frontier of Neural Audio',
    category: 'Tech Dialogue',
    mode: 'dialogue',
    voice: 'Puck',
    style: 'Spontaneous podcast banter',
    content: '',
    dialogueLines: [
      {
        speaker: 'Alex',
        voice: 'Puck',
        style: 'Enthusiastic, rapid tech podcast host',
        text: 'Welcome back to Neural Pulse! <laugh> Sam, did you see the synthetic speech benchmarks dropped this morning?',
      },
      {
        speaker: 'Sam',
        voice: 'Kore',
        style: 'Insightful, articulate co-host',
        text: "That's right, |yeah| the nuance in the vocal bursts is uncanny. You can barely distinguish the micro-hesitations from human breathing.",
      },
      {
        speaker: 'Alex',
        voice: 'Puck',
        style: 'Excited and curious',
        text: 'Exactly! <breath> It means screenwriters can direct real multi-character table reads with zero turnaround time.',
      },
      {
        speaker: 'Sam',
        voice: 'Kore',
        style: 'Thoughtful and warm',
        text: '|mhm| And the offline accessibility means you can curate entire audio libraries on a flight with zero connectivity.',
      },
    ],
  },
  {
    id: 'mindfulness-breath',
    title: 'Evening Solitude & Breath',
    category: 'Mindfulness',
    mode: 'single',
    voice: 'Kore',
    style: 'Soothing, gentle mindfulness meditation guide with soft pacing',
    content: `Close your eyes. Let your shoulders drop away from your ears. <breath> Notice the weight of the air resting gently around you. <breath> The day is behind you now. Inhale quiet strength... <breath> and release all the noise you carried today.`,
  },
  {
    id: 'scifi-thriller',
    title: 'Protocol 9: Sub-Orbital Descent',
    category: 'Sci-Fi Drama',
    mode: 'single',
    voice: 'Fenrir',
    style: 'Tense, gravelly military commander log',
    content: `Commander's log, standard cycle forty-two. Atmospheric re-entry angle is steep. <breath> Hull temperature climbing past three thousand kelvin. If the retro-thrusters don't engage in thirty seconds... <gasp> we skip off the thermosphere into dead orbit. Hold your stations.`,
  },
];
