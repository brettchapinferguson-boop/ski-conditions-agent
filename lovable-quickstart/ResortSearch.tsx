import { useState } from 'react';
import { getResortConditions, type SkiConditions } from './skiApi';

export default function ResortSearch() {
  const [resortName, setResortName] = useState('');
  const [conditions, setConditions] = useState<SkiConditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!resortName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await getResortConditions(resortName);
      setConditions(data);
    } catch (err) {
      setError('Failed to fetch conditions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold text-center mb-8">Ski Conditions Tracker</h1>

      <div className="flex gap-2">
        <input
          type="text"
          value={resortName}
          onChange={(e) => setResortName(e.target.value)}
          placeholder="Enter resort name (e.g., Vail, Aspen, Whistler)"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Get Conditions'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {conditions && (
        <div className="p-6 bg-white rounded-lg shadow-lg space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{conditions.resort}</h2>
            <p className="text-sm text-gray-500">
              Updated: {new Date(conditions.lastUpdated).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {conditions.snowDepth && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {conditions.snowDepth}"
                </div>
                <div className="text-sm text-gray-600">Base Depth</div>
              </div>
            )}

            {conditions.newSnow24h !== undefined && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {conditions.newSnow24h}"
                </div>
                <div className="text-sm text-gray-600">24h Snow</div>
              </div>
            )}

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {conditions.weather.temp}°F
              </div>
              <div className="text-sm text-gray-600">{conditions.weather.current}</div>
            </div>

            {conditions.lifts && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {conditions.lifts.open}/{conditions.lifts.total}
                </div>
                <div className="text-sm text-gray-600">Lifts Open</div>
              </div>
            )}
          </div>

          {conditions.surfaceConditions && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-semibold mb-1">Surface Conditions</p>
              <p className="text-gray-800">{conditions.surfaceConditions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
