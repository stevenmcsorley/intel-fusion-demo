import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TflService {
  private readonly baseUrl = 'https://api.tfl.gov.uk';

  async getLineStatus(modes: string) {
    const response = await axios.get(`${this.baseUrl}/Line/Mode/${modes}/Status`);
    return response.data;
  }

  async getAccidentStats(year: number) {
    const response = await axios.get(`${this.baseUrl}/AccidentStats/${year}`);
    return response.data;
  }

  async getBusStatus() {
    const response = await axios.get(`${this.baseUrl}/Line/Mode/bus/Status`);
    return response.data;
  }

  async getOvergroundStatus() {
    const response = await axios.get(`${this.baseUrl}/Line/Mode/overground/Status`);
    return response.data;
  }

  async getDlrStatus() {
    const response = await axios.get(`${this.baseUrl}/Line/Mode/dlr/Status`);
    return response.data;
  }

  async getElizabethLineStatus() {
    const response = await axios.get(`${this.baseUrl}/Line/Mode/elizabeth-line/Status`);
    return response.data;
  }

  async getRoadStatus() {
    const response = await axios.get(`${this.baseUrl}/Road`);
    return response.data;
  }

  async getRoadDisruptions() {
    // Get all active road disruptions - use 'all' to get all road IDs
    const response = await axios.get(`${this.baseUrl}/Road/all/Disruption`);
    return response.data;
  }

  async getBikePoints() {
    const response = await axios.get(`${this.baseUrl}/BikePoint`);
    return response.data;
  }

  async getAllTransportModes() {
    const [tube, bus, overground, dlr, elizabeth, roads, roadDisruptions, bikes] = await Promise.all([
      this.getLineStatus('tube'),
      this.getBusStatus(),
      this.getOvergroundStatus(),
      this.getDlrStatus(),
      this.getElizabethLineStatus(),
      this.getRoadStatus(),
      this.getRoadDisruptions(),
      this.getBikePoints()
    ]);

    return {
      tube,
      bus,
      overground,
      dlr,
      elizabeth,
      roads,
      roadDisruptions,
      bikes
    };
  }
}
