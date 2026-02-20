import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TestSupabase() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [rawResponse, setRawResponse] = useState<any>(null);

  useEffect(() => {
    async function testFetch() {
      console.log('Testing Supabase connection...');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase client:', supabase);
      
      try {
        // Test 1: Simple query
        const response = await supabase
          .from('rooms')
          .select('*')
          .order('room_number');
        
        console.log('Full response:', response);
        setRawResponse(response);
        
        const { data, error, status, statusText } = response;
        
        console.log('Data:', data);
        console.log('Error:', error);
        console.log('Status:', status);
        console.log('Status Text:', statusText);
        
        if (error) {
          setError(JSON.stringify(error, null, 2));
        } else {
          setRooms(data || []);
        }
      } catch (err: any) {
        console.error('Catch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    testFetch();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px' }}>
      <h1>Supabase Connection Test</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Status:</h2>
        {loading && <p>Loading...</p>}
        {error && (
          <div style={{ background: '#fee', padding: '10px', borderRadius: '5px' }}>
            <h3>Error:</h3>
            <pre>{error}</pre>
          </div>
        )}
        {!loading && !error && (
          <div style={{ background: '#efe', padding: '10px', borderRadius: '5px' }}>
            <h3>Success! Found {rooms.length} rooms</h3>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Raw Response:</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', overflow: 'auto', maxHeight: '300px' }}>
          {JSON.stringify(rawResponse, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Rooms Data:</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', overflow: 'auto', maxHeight: '400px' }}>
          {JSON.stringify(rooms, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Environment:</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL}
          {'\n'}VITE_SUPABASE_PROJECT_ID: {import.meta.env.VITE_SUPABASE_PROJECT_ID}
          {'\n'}VITE_SUPABASE_KEY: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 30)}...
        </pre>
      </div>
    </div>
  );
}
