import { useState } from 'react';
import { findBestSkiing, type BestSkiingRecommendation } from './skiApi';

export default function FindBest() {
  const [region, setRegion] = useState('Colorado');
  const [recommendations, setRecommendations] = useState<BestSkiingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await findBestSkiing({ region });
      setRecommendations(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold text-center mb-8">Find Best Skiing</h1>

      <div className="flex gap-2">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="Colorado">Colorado</option>
          <option value="Utah">Utah</option>
          <option value="California">California</option>
          <option value="Wyoming">Wyoming</option>
          <option value="Vermont">Vermont</option>
          <option value="British Columbia">British Columbia</option>
          <option value="Alps">European Alps</option>
          <option value="North America">North America</option>
          <option value="World">Anywhere in the World</option>
        </select>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Find Best Snow'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">
          Analyzing current conditions across resorts...
        </div>
      )}

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold">{rec.resort}</h3>
                <p className="text-gray-600">{rec.location}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {rec.score}
                </div>
                <div className="text-xs text-gray-500">score</div>
              </div>
            </div>

            <p className="text-gray-700 mb-4 leading-relaxed">{rec.reasoning}</p>

            {rec.currentConditions && (
              <div className="flex gap-6 text-sm pt-4 border-t">
                {rec.currentConditions.newSnow24h !== undefined && (
                  <div>
                    <span className="font-semibold text-gray-700">24h Snow:</span>{' '}
                    <span className="text-blue-600 font-bold">{rec.currentConditions.newSnow24h}"</span>
                  </div>
                )}
                {rec.currentConditions.snowDepth && (
                  <div>
                    <span className="font-semibold text-gray-700">Base:</span>{' '}
                    <span className="text-blue-600 font-bold">{rec.currentConditions.snowDepth}"</span>
                  </div>
                )}
                {rec.currentConditions.weather && (
                  <div>
                    <span className="font-semibold text-gray-700">Temp:</span>{' '}
                    <span className="text-blue-600 font-bold">{rec.currentConditions.weather.temp}°F</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && recommendations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Select a region and click "Find Best Snow" to get AI-powered recommendations
        </div>
      )}
    </div>
  );
}
