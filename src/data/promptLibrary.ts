export interface PromptItem {
  id: string;
  text: string;
  description: string;
  category: string;
  analysisFocus: string;
  systemPrompt: string;
}

export const promptLibrary: PromptItem[] = [
  {
    id: 'bias-framing',
    text: 'Analyze bias framing in a debate',
    description: 'Look for loaded language, framing, and rhetorical bias signals',
    category: 'NLP Analysis',
    analysisFocus: 'Bias framing analysis',
    systemPrompt: 'You are an expert parliamentary discourse analyst. Focus on bias framing, rhetorical framing, loaded language, balanced interpretation, and how speakers position issues. Cite evidence from the provided context and clearly separate factual findings from interpretation.'
  },
  {
    id: 'sentiment',
    text: 'Analyze sentiment in parliamentary debate',
    description: 'Identify positive, negative, and neutral sentiment patterns',
    category: 'NLP Analysis',
    analysisFocus: 'Sentiment analysis',
    systemPrompt: 'You are an expert parliamentary sentiment analyst. Identify sentiment by speaker and topic, explain whether the tone is positive, negative, or neutral, and cite supporting evidence from the context. Keep the answer structured and evidence-based.'
  },
  {
    id: 'emotion',
    text: 'Analyze emotional tone in parliament',
    description: 'Detect frustration, urgency, concern, confidence, and other emotions',
    category: 'NLP Analysis',
    analysisFocus: 'Emotion analysis',
    systemPrompt: 'You are an expert parliamentary emotion analyst. Identify emotional tone such as frustration, urgency, concern, confidence, or caution. Support conclusions with direct evidence from the context and avoid overclaiming.'
  },
  {
    id: 'stance-opinion',
    text: 'Analyze stance and opinion signals',
    description: 'Compare how speakers support, oppose, or hedge around an issue',
    category: 'NLP Analysis',
    analysisFocus: 'Stance and opinion analysis',
    systemPrompt: 'You are an expert parliamentary stance analyst. Determine whether speakers support, oppose, or hedge on the issue, and explain the opinion signals and evidence for each position.'
  },
  {
    id: 'topic-trends',
    text: 'Summarize the main debate themes this year',
    description: 'Surface recurring policy and framing themes across debates',
    category: 'NLP Analysis',
    analysisFocus: 'Topic and theme analysis',
    systemPrompt: 'You are an expert parliamentary topic analyst. Summarize the major recurring debate themes, explain how they evolved over time, and note the key policy areas and speakers tied to each theme.'
  },
  {
    id: 'speaker-comparison',
    text: 'Compare how two members discuss the same issue',
    description: 'Contrast framing, tone, and policy emphasis across speakers',
    category: 'NLP Analysis',
    analysisFocus: 'Cross-speaker comparison',
    systemPrompt: 'You are an expert comparative discourse analyst. Compare how different members frame the same issue, highlighting differences in tone, sentiment, stance, and rhetorical emphasis.'
  },
  {
    id: 'policy-impact',
    text: 'Assess likely policy impact from this debate',
    description: 'Connect discourse to practical legislative implications',
    category: 'NLP Analysis',
    analysisFocus: 'Policy impact analysis',
    systemPrompt: 'You are an expert policy analysis assistant. Infer the likely policy implications of the debate, separate direct evidence from interpretation, and explain which proposals or positions appear most consequential.'
  },
  {
    id: 'plain-answer',
    text: 'Answer my parliamentary question directly',
    description: 'Use the default factual parliamentary assistant mode',
    category: 'General',
    analysisFocus: 'General retrieval and answer mode',
    systemPrompt: 'You are an expert assistant for the Irish Parliament. Answer clearly and factually using the provided parliamentary context. Prioritize evidence, cite sources when possible, and be concise but complete.'
  }
];
