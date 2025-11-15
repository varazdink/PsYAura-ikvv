

import React from 'react';
import { VisualizationData } from '../types';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RelationshipVisualizerProps {
  data: VisualizationData;
}

const RelationshipVisualizer: React.FC<RelationshipVisualizerProps> = ({ data }) => {
  if (!data || !data.strengths || !data.weaknesses) {
    return null; // Or some fallback UI
  }

  const chartData = [
      ...data.strengths.map(item => ({ subject: item.name, score: item.score, fullMark: 10 })),
      ...data.weaknesses.map(item => ({ subject: item.name, score: item.score, fullMark: 10 })),
  ];

  return (
    <div className="bg-gray-900 text-gray-300 self-start rounded-2xl shadow-md p-4 md:p-6 my-4 mx-auto w-full max-w-xl md:max-w-2xl border border-gray-800">
      <h3 className="text-xl font-bold text-center mb-4 text-amber-500">Relationship Dynamics Snapshot</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#4b5563" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#4b5563"/>
            <Radar name="Score" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                borderColor: '#f59e0b',
                color: '#ffffff',
                borderRadius: '0.5rem'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-lg mb-3 text-green-400">Strengths</h4>
          <ul className="space-y-3">
            {data.strengths.map((item, index) => (
              <li key={`strength-${index}`}>
                <strong className="font-semibold text-gray-100">{item.name} (Score: {item.score})</strong>
                <p className="text-sm text-gray-400">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-lg mb-3 text-red-400">Areas for Growth</h4>
          <ul className="space-y-3">
            {data.weaknesses.map((item, index) => (
              <li key={`weakness-${index}`}>
                <strong className="font-semibold text-gray-100">{item.name} (Score: {item.score})</strong>
                <p className="text-sm text-gray-400">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {data.archetypes && data.archetypes.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h4 className="font-semibold text-lg mb-4 text-center text-gray-100">Dominant Archetypes in Context</h4>
          <div className="space-y-4">
            {data.archetypes.map((item, index) => (
              <div key={`archetype-${index}`} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <strong className="font-semibold text-amber-400">{item.person}: The {item.archetype}</strong>
                <p className="text-sm text-gray-300 mt-2">
                    <span className="font-semibold">In Your Context:</span> {item.contextDescription}
                </p>
                 <p className="text-sm text-gray-300 mt-2">
                    <span className="font-semibold">General Manifestation:</span> {item.generalManifestation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.archetypeInteraction && (
        <div className="mt-8 pt-6 border-t border-gray-700">
            <h4 className="font-semibold text-lg mb-4 text-center text-gray-100">Archetypal Interaction Analysis</h4>
            <div className="space-y-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <strong className="font-semibold text-amber-400">Influence on Communication Patterns</strong>
                    <p className="text-sm text-gray-300 mt-1">{data.archetypeInteraction.communicationPatterns.analysis}</p>
                    <div className="mt-3 pt-3 border-t border-gray-600 space-y-3">
                        {data.archetypeInteraction.communicationPatterns.examples.map((ex, index) => (
                             <div key={`comm-ex-${index}`}>
                                <h5 className="text-sm font-semibold text-gray-400">Example: {ex.scenario}</h5>
                                <p className="text-sm text-gray-300 mt-1 italic">"{ex.detail}"</p>
                             </div>
                        ))}
                    </div>
                </div>
                 <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <strong className="font-semibold text-amber-400">Influence on Conflict Styles</strong>
                    <p className="text-sm text-gray-300 mt-1">{data.archetypeInteraction.conflictStyles.analysis}</p>
                    <div className="mt-3 pt-3 border-t border-gray-600 space-y-3">
                        {data.archetypeInteraction.conflictStyles.examples.map((ex, index) => (
                            <div key={`conflict-ex-${index}`}>
                               <h5 className="text-sm font-semibold text-gray-400">Example: {ex.scenario}</h5>
                               <p className="text-sm text-gray-300 mt-1 italic">"{ex.detail}"</p>
                            </div>
                       ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipVisualizer;