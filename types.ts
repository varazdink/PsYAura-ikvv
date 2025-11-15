


export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export type MessageMode = 'chat' | 'actionPlan' | 'realityCheck';

export type ChatMessage = {
  type: 'chat';
  role: MessageRole;
  content: string;
};

export type MetaMessage = {
    type: 'meta';
    content: string;
}

export type VisualizationPoint = {
    name: string;
    score: number;
    description: string;
};

export type ArchetypeAnalysis = {
    person: 'User' | 'Veronica';
    archetype: string;
    contextDescription: string;
    generalManifestation: string;
};

export type ExampleScenario = {
    scenario: string;
    detail: string;
}

export type InteractionDetail = {
    analysis: string;
    examples: ExampleScenario[];
}

export type ArchetypeInteraction = {
    communicationPatterns: InteractionDetail;
    conflictStyles: InteractionDetail;
}

export type VisualizationData = {
    strengths: VisualizationPoint[];
    weaknesses: VisualizationPoint[];
    archetypes: ArchetypeAnalysis[];
    archetypeInteraction: ArchetypeInteraction;
};

export type VisualizationMessage = {
    type: 'visualization';
    data: VisualizationData;
};


export type Message = ChatMessage | MetaMessage | VisualizationMessage;

export interface SessionMemory {
    userProfile: string[];
    partnerProfile: string[];
    relationshipStrengths: string[];
    relationshipChallenges: string[];
    keyEvents: string[];
}

export interface Session {
    id: string;
    title: string;
    history: Message[];
    sessionMemory: SessionMemory | null;
    lastModified: number;
}