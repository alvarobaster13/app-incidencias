export type IncidentType = 'DELAYED_ORDER' | 'FAILED_DELIVERY' | 'CLAIM' | 'SYSTEM_ERROR';

export interface Incident {
  id: string;
  type: IncidentType;
  zone: string;
  description: string;
  timestamp: number;
  status: 'PENDING' | 'RESOLVED' | 'ESCALATED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DailyReport {
  date: string;
  totalIncidents: number;
  incidentsByZone: Record<string, number>;
  summary: string;
  generatedAt: number;
}
