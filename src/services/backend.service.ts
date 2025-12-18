import { Injectable } from '@angular/core';

export interface Vehicle {
  id: string;
  designation: string; 
  type: string;        
  category: 'LAND' | 'AIR' | 'SEA';
  status: 'ACTIVE' | 'MAINTENANCE' | 'DEPLOYED';
  serialNumber: string;
  timestamp: number;
  // New Metadata
  operator: string;
  fuelLevel: number;
  lastMaintained: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  // Key for persistent local storage
  private readonly DB_KEY = 'IMPERIAL_FLEET_DATA_PERSISTENT';
  // Reduced latency for snappier load times while maintaining "uplink" feel
  private readonly LATENCY_MS = 400;

  constructor() {}

  async getVehicles(): Promise<Vehicle[]> {
    await this.delay();
    return this.getInternalSafe();
  }

  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    await this.delay();
    const current = this.getInternalSafe();
    const updated = [vehicle, ...current];
    this.saveInternalSafe(updated);
    return vehicle;
  }

  async deleteVehicle(id: string): Promise<void> {
    await this.delay();
    const current = this.getInternalSafe();
    const updated = current.filter(v => v.id !== id);
    this.saveInternalSafe(updated);
  }

  async updateVehicle(updatedVehicle: Vehicle): Promise<void> {
    await this.delay();
    const current = this.getInternalSafe();
    const updated = current.map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
    this.saveInternalSafe(updated);
  }

  async updateVehicleStatus(id: string, status: Vehicle['status']): Promise<void> {
    await this.delay();
    const current = this.getInternalSafe();
    const updated = current.map(v => v.id === id ? { ...v, status } : v);
    this.saveInternalSafe(updated);
  }

  // Backup Protocol: Retrieve raw JSON string
  getRawData(): string {
    return localStorage.getItem(this.DB_KEY) || '[]';
  }

  // Restore Protocol: Overwrite DB with validated JSON and Schema Check
  importData(jsonData: string): void {
    try {
      const parsed = JSON.parse(jsonData);
      
      // 1. Structure Check
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid Protocol: Root must be an array.');
      }

      // 2. Schema Validation (Basic Check)
      const isValid = parsed.every((v: any) => 
        v.id && 
        v.designation && 
        v.serialNumber && 
        v.status
      );

      if (!isValid) {
        throw new Error('Corrupt Intel: Data schema mismatch.');
      }

      this.saveInternalSafe(parsed);
    } catch (e) {
      console.error('Import Failed:', e);
      throw new Error('Data Corruption Detected during Import.');
    }
  }

  // === SAFE STORAGE INTERFACE ===

  private getInternalSafe(): Vehicle[] {
    try {
      const data = localStorage.getItem(this.DB_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Ensure we actually got an array, otherwise reset to avoid app crash
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Imperial Archives Corrupted. Re-initializing database.', e);
      return [];
    }
  }

  private saveInternalSafe(data: Vehicle[]): void {
    try {
      // This write persists to the physical disk (browser storage)
      // Data survives restarts and shutdowns.
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.DB_KEY, serialized);
    } catch (e) {
      console.error('CRITICAL ERROR: Storage Write Failed. Quota exceeded or permission denied.', e);
    }
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.LATENCY_MS));
  }
}