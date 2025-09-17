import React, { useEffect, useState } from 'react';
import { productionAllotmentApi } from '@/lib/api-client';
import { apiUtils } from '@/lib/api-client';
import type { ProductionAllotmentResponseDto } from '@/types/api-types';

const TestAPI: React.FC = () => {
  const [data, setData] = useState<ProductionAllotmentResponseDto[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await productionAllotmentApi.getAllProductionAllotments();
        const extractedData = apiUtils.extractData(response);
        setData(extractedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Production Allotment API Test</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default TestAPI;