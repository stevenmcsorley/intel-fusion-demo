import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UkPoliceService {
  private readonly baseUrl = 'https://data.police.uk/api';

  async getStreetCrime(lat: number, lng: number, date: string) {
    const response = await axios.get(
      `${this.baseUrl}/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${date}`,
    );
    return response.data;
  }

  async getForces() {
    const response = await axios.get(`${this.baseUrl}/forces`);
    return response.data;
  }

  async getNeighbourhoods(forceId: string) {
    const response = await axios.get(`${this.baseUrl}/${forceId}/neighbourhoods`);
    return response.data;
  }

  async getNeighbourhoodBoundary(forceId: string, neighbourhoodId: string) {
    const response = await axios.get(`${this.baseUrl}/${forceId}/${neighbourhoodId}/boundary`);
    return response.data;
  }

  async getNeighbourhoodCrimes(forceId: string, neighbourhoodId: string, date: string) {
    try {
      // Get neighbourhood boundary first
      const boundary = await this.getNeighbourhoodBoundary(forceId, neighbourhoodId);

      if (boundary && boundary.length > 0) {
        // Create polygon string for neighbourhood crimes
        const poly = boundary.map(point => `${point.latitude},${point.longitude}`).join(':');

        const response = await axios.get(
          `${this.baseUrl}/crimes-street/all-crime?poly=${poly}&date=${date}`
        );

        return response.data.map(crime => ({
          ...crime,
          _neighbourhood: neighbourhoodId,
          _force: forceId
        }));
      }

      return [];
    } catch (error) {
      console.error(`Failed to get neighbourhood crimes for ${forceId}/${neighbourhoodId}:`, error.message);
      return [];
    }
  }
}
