import React, { useState } from 'react';
import { UserService } from '../../services';

const ApiTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, data) => {
    setResults(prev => [...prev, { test, status, data, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testAPI = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Get user profile
    try {
      const result = await UserService.getUserProfile();
      addResult('Get User Profile', result.success ? 'SUCCESS' : 'FAILED', result);
    } catch (error) {
      addResult('Get User Profile', 'ERROR', error.message);
    }

    // Test 2: Request email change
    try {
      const result = await UserService.requestEmailChange('test@example.com');
      addResult('Request Email Change', result.success ? 'SUCCESS' : 'FAILED', result);
    } catch (error) {
      addResult('Request Email Change', 'ERROR', error.message);
    }

    setLoading(false);
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-bold mb-4">API Test Component</h3>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API Endpoints'}
      </button>

      {results.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Test Results:</h4>
          {results.map((result, index) => (
            <div key={index} className="mb-2 p-2 border rounded">
              <div className="flex items-center gap-2">
                <span className="font-medium">{result.test}:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  result.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                  result.status === 'FAILED' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>
              <pre className="text-xs mt-1 bg-gray-100 p-1 rounded overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiTest;
