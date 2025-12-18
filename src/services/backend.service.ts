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
  // Updated key to denote persistent storage requirement
  private readonly DB_KEY = 'IMPERIAL_FLEET_DATA_PERSISTENT';
  private readonly LATENCY_MS = 600;

  constructor() {}

  async getVehicles(): Promise<Vehicle[]> {
    await this.delay();
    const data = localStorage.getItem(this.DB_KEY);
    return data ? JSON.parse(data) : [];
  }

  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    await this.delay();
    const current = await this.getInternal();
    const updated = [vehicle, ...current];
    this.saveInternal(updated);
    return vehicle;
  }

  async deleteVehicle(id: string): Promise<void> {
    await this.delay();
    const current = await this.getInternal();
    const updated = current.filter(v => v.id !== id);
    this.saveInternal(updated);
  }

  async updateVehicle(updatedVehicle: Vehicle): Promise<void> {
    await this.delay();
    const current = await this.getInternal();
    const updated = current.map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
    this.saveInternal(updated);
  }

  async updateVehicleStatus(id: string, status: Vehicle['status']): Promise<void> {
    await this.delay();
    const current = await this.getInternal();
    const updated = current.map(v => v.id === id ? { ...v, status } : v);
    this.saveInternal(updated);
  }

  // Backup Protocol: Retrieve raw JSON string
  getRawData(): string {
    return localStorage.getItem(this.DB_KEY) || '[]';
  }

  // Restore Protocol: Overwrite DB with validated JSON
  importData(jsonData: string): void {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        this.saveInternal(parsed);
      } else {
        throw new Error('Invalid Data Structure');
      }
    } catch (e) {
      throw new Error('Data Corruption Detected');
    }
  }

  private async getInternal(): Promise<Vehicle[]> {
    const data = localStorage.getItem(this.DB_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveInternal(data: Vehicle[]): void {
    // This is the critical line that persists data to the machine's drive
    localStorage.setItem(this.DB_KEY, JSON.stringify(data));
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.LATENCY_MS));
  }
}