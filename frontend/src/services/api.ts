import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
});

export const getIncidents = (params: any) => api.get('/incidents', { params });

export const semanticSearch = (query: string, limit?: number) =>
  api.post('/incidents/semantic-search', { query, limit });

export const findSimilarIncidents = (incidentId: string, limit?: number) =>
  api.get(`/incidents/${incidentId}/similar`, { params: { limit } });

export const getTemporalAnalytics = (params?: any) =>
  api.get('/incidents/analytics/temporal', { params });

export const getThreatTrends = (params?: any) =>
  api.get('/incidents/analytics/threat-trends', { params });

export const getDataQualityMetrics = (params?: any) =>
  api.get('/incidents/analytics/data-quality', { params });

export const getDateRange = () =>
  api.get('/incidents/date-range');

export const getEntity = (id: string) => api.get(`/entities/${id}`);

export const createCase = (data: any) => api.post('/cases', data);

export const getEntities = (params?: any) => api.get('/entities', { params });

export const getEntityRelationships = (params?: any) => api.get('/entities/relationships', { params });
