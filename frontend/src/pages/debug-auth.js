import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';

const DebugAuth = () => {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [corsStatus, setCorsStatus] = useState('Checking...');
  const [backendUrl, setBackendUrl] = useState('');
  const [testResponse, setTestResponse] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get backend URL from environment variables
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    setBackendUrl(apiUrl || 'Not configured');

    const checkConnection = async () => {
      try {
        // Check basic connectivity
        const response = await fetch(apiUrl || 'https://loan-app-tnuk.onrender.com');
        const data = await response.json();
        
        setApiStatus('Connected ✅');
        setTestResponse(data);
        
        // Now try a request with CORS headers
        try {
          const corsResponse = await axios.get(`${apiUrl || 'https://loan-app-tnuk.onrender.com'}/api/v1/auth/check`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          setCorsStatus('CORS Working ✅');
        } catch (corsError) {
          console.error('CORS Error:', corsError);
          setCorsStatus(`CORS Error ❌: ${corsError.message}`);
          setError(corsError);
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        setApiStatus(`Connection Failed ❌: ${apiError.message}`);
        setError(apiError);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  const testLogin = async () => {
    try {
      const response = await axios.post(`${backendUrl || 'https://loan-app-tnuk.onrender.com'}/api/v1/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      
      toast.success('Login test successful');
      console.log('Login response:', response.data);
    } catch (error) {
      toast.error(`Login test failed: ${error.message}`);
      console.error('Login test error:', error);
    }
  };

  return (
    <MainLayout title="Auth Debug">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-blue-600 text-white">
            <h1 className="text-2xl font-bold">Authentication Debugging</h1>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Configuration</h2>
              <div className="bg-gray-100 p-4 rounded">
                <p><strong>Backend URL:</strong> {backendUrl}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
              <div className="bg-gray-100 p-4 rounded">
                <p><strong>API Status:</strong> {apiStatus}</p>
                <p><strong>CORS Status:</strong> {corsStatus}</p>
                {isLoading && <p className="text-yellow-500">Testing connection...</p>}
              </div>
            </div>
            
            {testResponse && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">API Response</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(testResponse, null, 2)}
                </pre>
              </div>
            )}
            
            {error && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Error Details</h2>
                <pre className="bg-red-50 p-4 rounded text-red-800 overflow-auto">
                  {JSON.stringify(error.message, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-6 flex space-x-4">
              <button
                onClick={testLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test Login
              </button>
              <Link 
                href="/"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DebugAuth; 