import React, { useState } from 'react';

const PromptToCopy: React.FC<{ title: string; promptText: string }> = ({ title, promptText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg mb-4 border border-gray-800">
      <h4 className="font-semibold text-amber-400 mb-2">{title}</h4>
      <div className="relative bg-black p-3 rounded-md">
        <p className="text-sm text-gray-300 font-mono whitespace-pre-wrap">{promptText}</p>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-amber-400 text-xs font-semibold py-1 px-2 rounded-md transition-colors"
          aria-label={`Copy prompt for: ${title}`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

const generalPrompts = [
  {
    title: "1. The 'You' Map: A Deep Psychological Profile",
    promptText: "Aura, based on our entire conversation history, please construct a comprehensive psychological map of me. Your analysis must be multi-layered. First, detail my core personality structure, referencing established models like the Big Five. Second, identify my dominant Jungian archetypes (e.g., Warrior, Caregiver, Sage) and how they manifest in this relationship. Third, define my primary attachment style (e.g., Anxious, Avoidant, Secure) and explain how it influences my reactions during conflict. Fourth, list my core values and my deepest, most vulnerable fears. Finally, summarize my personal 'Hero's Journey' so far: What was my 'Call to Adventure,' what 'Trials' have I faced, and what 'Insights' have I gained? For every point, you must provide direct quotes or specific examples from our conversation to support your conclusions."
  },
  {
    title: "2. The 'Partner' Map: An Inferred Psychological Profile",
    promptText: "Aura, from everything I've described about my partner, construct an inferred psychological map for them. This analysis must be detailed and empathetic. First, infer their dominant Jungian archetypes (especially the 'Cautious Guardian' if applicable) and how these energies drive their behavior. Second, deduce their probable attachment style and explain how it shapes their responses to me, particularly under stress. Third, what are their deepest emotional needs that I've described (e.g., for safety, for validation, for autonomy)? Fourth, what are their primary triggers and fears as I have depicted them? Finally, how might they perceive *me* based on the interactions I've shared? For every conclusion, reference specific behaviors, statements, or scenarios I have told you about."
  },
  {
    title: "3. The 'Us' Map: The Relationship System",
    promptText: "Aura, analyze our relationship as a living system. First, create a 'Relationship Timeline' marking key turning points—both the 'Golden Moments' that built our bond and the 'Storms' that tested it. Second, conduct a 'Jungian Archetype Interaction Analysis': identify our primary archetypes and explain in detail how their interaction creates our specific dynamic (e.g., a Warrior/Guardian clash, a Caregiver/Orphan dance). Third, diagnose our primary negative interaction cycle (e.g., Pursuer-Distancer). Fourth, map our relationship's current stage on the 'Hero's Journey': Are we answering a 'Call,' facing an 'Ordeal,' or on the 'Road Back'? Finally, list our 'Relationship Treasures'—the core strengths and assets that serve as our foundation."
  },
  {
    title: "4. The Central Challenge: A Situational Analysis",
    promptText: "Aura, provide a multi-faceted analysis of the central challenge we're currently facing. First, clearly define the problem from a factual standpoint. Second, analyze the 'Roots vs. Symptoms': distinguish between the surface-level issue (the symptom) and the deeper, underlying causes rooted in our individual profiles and relationship history (the roots). Third, detail the emotional 'Stakes' for each of us: What does each of us stand to lose or fear losing in this situation? Fourth, outline my stated goals, both the immediate, short-term desired outcome and the deeper, long-term need I'm trying to meet. Finally, describe the emotional impact this is having on the 'Us'—the relationship entity itself."
  },
  {
    title: "5. The Ledger: Growth & Gratitude",
    promptText: "Aura, based on our entire conversation, compile a 'Ledger of Growth and Gratitude.' Create two distinct lists. The first, 'My Path for Growth,' should be a bulleted summary of every specific area for improvement, blind spot, or moment of accountability I have acknowledged for myself. The second, 'Our Shared Treasures,' should be a bulleted list of every core strength, positive memory, moment of connection, and point of gratitude I have expressed about my partner and our relationship."
  }
];

const specializedPrompts = [
    {
      title: "1. Conflict Cycle Diagnosis",
      promptText: `Analyze our recurring conflict cycle with clinical precision. Identify the common 'triggers' that initiate the cycle. Map the sequence of actions and reactions from both me and my partner. Pinpoint if any of Gottman's 'Four Horsemen' (Criticism, Contempt, Defensiveness, Stonewalling) appear. Describe the dominant emotional tone of these arguments. How does the cycle typically end—with repair, withdrawal, or resentment? What archetypes emerge in each of us when this cycle is activated?`
    },
    {
      title: "2. Non-Verbal Communication",
      promptText: `Conduct an analysis of the unspoken language between us, based on my descriptions. Detail the patterns of body language, vocal tone, eye contact, and physical touch (or lack thereof) during both moments of connection and moments of conflict. How are 'bids for connection' made and received non-verbally? What is the underlying emotional 'energy' I've described in our home?`
    },
    {
      title: "3. Unmet Needs & Attachment",
      promptText: `Using Attachment Theory as a lens, identify the primary unmet attachment needs for both myself and my partner. Are we seeking safety, security, to be seen, to be soothed, or to feel valued? Provide specific examples from our conversations where these unmet needs have surfaced as frustration, anger, or withdrawal. How do our attachment styles clash or complement each other in pursuit of these needs?`
    },
    {
      title: "4. Core Value Alignment",
      promptText: `Create a 'Core Values Map' for both of us, based on my statements and the conflicts I've described. Distinguish between our 'Stated Values' (what we say is important) and our 'Lived Values' (what our actions show is important). Pinpoint the exact areas of misalignment (e.g., Adventure vs. Security; Family vs. Career) and explain how these foundational differences are generating surface-level conflicts.`
    },
    {
      title: "5. External Stressors",
      promptText: `Analyze how external stressors (work, family, health, finances) are impacting the 'couple bubble.' Are these stressors bringing us together as a team, or are they depleting our resources and causing us to turn on each other? How does stress affect our individual capacities for empathy, patience, and connection? Provide specific examples I've shared.`
    },
    {
      title: "6. Support Systems",
      promptText: `Evaluate the health and effectiveness of our relationship's support system. This includes external support (friends, family, therapy) and internal support (our ability to self-soothe and co-regulate). Is our support system a source of strength and wisdom, or does it sometimes add complexity and stress? Do we function as a united front when interacting with our support systems?`
    },
    {
      title: "7. Intimacy & Connection",
      promptText: `Provide a holistic analysis of our intimacy across multiple dimensions: Emotional (vulnerability, sharing feelings), Physical (touch, affection, sex), Intellectual (sharing ideas, respectful debate), and Recreational (shared fun, play, adventure). Where are we strong, and where are the gaps? Describe the specific conditions or activities that foster a sense of closeness and the ones that create distance.`
    },
    {
      title: "8. Bids & Repair Attempts",
      promptText: `Using the Gottman Method framework, analyze our patterns of 'bids for connection.' What do our typical bids sound like? What is the ratio of 'turning towards' vs. 'turning away/against'? Crucially, analyze our 'repair attempts.' When a conflict starts, how do we try to de-escalate it? Are these repair attempts effective? If not, why do they fail?`
    },
    {
      title: "9. Shared Future Vision",
      promptText: `Construct our 'Shared Future Narrative' based on what I've shared. What are the dreams, goals, and aspirations we hold for our life together? Identify areas of strong alignment and areas of ambiguity or unspoken disagreement. What are the underlying hopes and fears I've expressed about where we are heading as a couple?`
    },
    {
      title: "10. Teamwork & Partnership",
      promptText: `Evaluate the strength of our partnership as a 'team.' How do we handle major life decisions? How do we manage shared responsibilities (finances, chores, etc.)? Do we operate with a sense of 'we're in this together,' or does it devolve into a 'you vs. me' dynamic? Analyze the balance of power and influence in the relationship as I have described it.`
    }
  ];

const PromptLibrary: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-black text-gray-300">
      <header className="p-4 border-b border-gray-800 sticky top-0 bg-black z-10">
        <h2 className="text-xl font-bold text-center text-amber-500">Prompt Library</h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          Use these detailed prompts to guide Aura's analysis.
        </p>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-lg font-semibold text-amber-400 mb-4 border-b border-gray-800 pb-2">Part 1: The General Foundation</h3>
        <div className="text-left mb-8">
          {generalPrompts.map((p, index) => (
            <PromptToCopy key={`gen-${index}`} title={p.title} promptText={p.promptText} />
          ))}
        </div>

        <h3 className="text-lg font-semibold text-amber-400 mb-4 border-b border-gray-800 pb-2">Part 2: Specialized Deep Dive</h3>
         <div className="text-left mb-6">
          {specializedPrompts.map((p, index) => (
            <PromptToCopy key={`spec-${index}`} title={p.title} promptText={p.promptText} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromptLibrary;
