import { Injectable } from '@angular/core';

export interface Vehicle {
  id: string;
  designation: string; 
  type: string;        
  status: 'ACTIVE' | 'MAINTENANCE' | 'DEPLOYED';
  serialNumber: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private readonly DB_KEY = 'IMPERIAL_FLEET_DB_V2';
  private readonly LATENCY_MS = 800; // Simulate network delay

  constructor() {}

  // Simulate GET /vehicles
  async getVehicles(): Promise<Vehicle[]> {
    await this.delay();
    const data = localStorage.getItem(this.DB_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Simulate POST /vehicles
  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    await this.delay();
    const current = await this.getInternal();
    const updated = [vehicle, ...current];
    this.saveInternal(updated);
    return vehicle;
  }

  // Simulate DELETE /vehicles/:id
  async deleteVehicle(id: string): Promise<void> {
    await this.delay();
    const current = await this.getInternal();
    const updated = current.filter(v => v.id !== id);
    this.saveInternal(updated);
  }

  // Simulate PATCH /vehicles/:id
  async updateVehicleStatus(id: string, status: Vehicle['status']): Promise<void> {
    await this.delay();
    const current = await this.getInternal();
    const updated = current.map(v => v.id === id ? { ...v, status } : v);
    this.saveInternal(updated);
  }

  private async getInternal(): Promise<Vehicle[]> {
    const data = localStorage.getItem(this.DB_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveInternal(data: Vehicle[]): void {
    localStorage.setItem(this.DB_KEY, JSON.stringify(data));
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.LATENCY_MS));
  }
}