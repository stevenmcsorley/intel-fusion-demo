import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { UkPoliceService } from '../../services/uk-police.service';
import { TflService } from '../../services/tfl.service';
import { GdeltService } from '../../services/gdelt.service';
import { IncidentsService } from '../incidents/incidents.service';
import { EntitiesService } from '../entities/entities.service';
import { Incident, Entity } from '../../entities';

@Processor('ingestion')
export class IngestionProcessor {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly ukPoliceService: UkPoliceService,
    private readonly tflService: TflService,
    private readonly gdeltService: GdeltService,
    private readonly incidentsService: IncidentsService,
    private readonly entitiesService: EntitiesService,
  ) {}

  @Process('ingest-all')
  async handleIngestAll(job: Job) {
    this.logger.log('Processing all ingestion sources...');

    try {
      // UK Police Data Ingestion - Enterprise Historical Coverage
      this.logger.log('Initiating comprehensive intelligence data collection for Greater London...');

      // Define comprehensive London intelligence sectors - expanded coverage
      const londonSectors = [
        // Core Central London
        { lat: 51.5074, lng: -0.1278, name: 'Central London', sector: 'CENTRAL' },
        { lat: 51.5155, lng: -0.1416, name: 'Westminster', sector: 'WESTMINSTER' },
        { lat: 51.5099, lng: -0.1180, name: 'City of London', sector: 'CITY' },
        { lat: 51.5033, lng: -0.1195, name: 'London Bridge Area', sector: 'LONDONBRIDGE' },

        // North London Expansion
        { lat: 51.5924, lng: -0.1559, name: 'North London', sector: 'NORTH' },
        { lat: 51.5488, lng: -0.1418, name: 'Camden', sector: 'CAMDEN' },
        { lat: 51.5362, lng: -0.1034, name: 'Islington', sector: 'ISLINGTON' },
        { lat: 51.5970, lng: -0.0780, name: 'Tottenham', sector: 'TOTTENHAM' },
        { lat: 51.6252, lng: -0.1517, name: 'Barnet', sector: 'BARNET' },
        { lat: 51.6094, lng: -0.2792, name: 'Harrow', sector: 'HARROW' },
        { lat: 51.6077, lng: -0.3528, name: 'Hillingdon', sector: 'HILLINGDON' },

        // East London Expansion
        { lat: 51.5074, lng: -0.0759, name: 'East London', sector: 'EAST' },
        { lat: 51.5099, lng: -0.0059, name: 'Canary Wharf', sector: 'CANARYWHARF' },
        { lat: 51.5153, lng: -0.0722, name: 'Tower Hamlets', sector: 'TOWERHAMLETS' },
        { lat: 51.5448, lng: -0.0553, name: 'Hackney', sector: 'HACKNEY' },
        { lat: 51.5445, lng: 0.0022, name: 'Greenwich', sector: 'GREENWICH' },
        { lat: 51.4934, lng: 0.0098, name: 'Lewisham', sector: 'LEWISHAM' },
        { lat: 51.4066, lng: 0.0180, name: 'Bromley', sector: 'BROMLEY' },
        { lat: 51.4415, lng: 0.1058, name: 'Bexley', sector: 'BEXLEY' },
        { lat: 51.5755, lng: 0.1826, name: 'Havering', sector: 'HAVERING' },

        // South London Expansion
        { lat: 51.4994, lng: -0.1270, name: 'South London', sector: 'SOUTH' },
        { lat: 51.4816, lng: -0.1916, name: 'Wimbledon', sector: 'WIMBLEDON' },
        { lat: 51.4554, lng: -0.1005, name: 'Croydon', sector: 'CROYDON' },
        { lat: 51.4050, lng: -0.1949, name: 'Sutton', sector: 'SUTTON' },
        { lat: 51.4619, lng: -0.0747, name: 'Southwark', sector: 'SOUTHWARK' },
        { lat: 51.4816, lng: -0.1265, name: 'Lambeth', sector: 'LAMBETH' },
        { lat: 51.4607, lng: -0.1163, name: 'Brixton', sector: 'BRIXTON' },
        { lat: 51.4781, lng: -0.0018, name: 'Woolwich', sector: 'WOOLWICH' },

        // West London Expansion
        { lat: 51.5074, lng: -0.2108, name: 'West London', sector: 'WEST' },
        { lat: 51.4994, lng: -0.1938, name: 'Kensington & Chelsea', sector: 'KENSINGTON' },
        { lat: 51.5138, lng: -0.2185, name: 'Hammersmith & Fulham', sector: 'HAMMERSMITH' },
        { lat: 51.5642, lng: -0.2817, name: 'Ealing', sector: 'EALING' },
        { lat: 51.5106, lng: -0.3340, name: 'Hounslow', sector: 'HOUNSLOW' },
        { lat: 51.4700, lng: -0.4139, name: 'Heathrow Area', sector: 'HEATHROW' },
        { lat: 51.4518, lng: -0.2073, name: 'Richmond', sector: 'RICHMOND' },
        { lat: 51.4240, lng: -0.2763, name: 'Kingston upon Thames', sector: 'KINGSTON' },

        // Strategic Areas
        { lat: 51.5434, lng: -0.0103, name: 'Olympic Park Area', sector: 'OLYMPIC' },
        { lat: 51.5577, lng: -0.2788, name: 'Wembley', sector: 'WEMBLEY' },
        { lat: 51.6156, lng: 0.0539, name: 'Redbridge', sector: 'REDBRIDGE' },
        { lat: 51.5986, lng: -0.0299, name: 'Enfield', sector: 'ENFIELD' },
        { lat: 51.5290, lng: -0.3947, name: 'Uxbridge', sector: 'UXBRIDGE' },
      ];

      // Generate temporal coverage for last 24 months (professional intelligence standard)
      const temporalCoverage = this.generateTemporalCoverage(24);
      this.logger.log(`Intelligence collection spanning ${temporalCoverage.length} months: ${temporalCoverage[0]} to ${temporalCoverage[temporalCoverage.length - 1]}`);

      // Professional neighbourhood-level intelligence collection for Metropolitan Police
      this.logger.log('Initiating neighbourhood-level intelligence collection for Metropolitan Police area...');
      const metropolitanNeighbourhoods = await this.getMetropolitanNeighbourhoods();
      this.logger.log(`Professional neighbourhood coverage: ${metropolitanNeighbourhoods.length} Metropolitan Police neighbourhoods identified`);

      let totalPoliceData = [];
      let totalApiCalls = 0;
      const startTime = Date.now();

      for (const period of temporalCoverage) {
        this.logger.log(`== TEMPORAL ANALYSIS PERIOD: ${period} ==`);

        for (const sector of londonSectors) {
          try {
            this.logger.log(`Collecting intelligence: ${sector.name} [${sector.sector}] - ${period}`);
            const sectorData = await this.ukPoliceService.getStreetCrime(sector.lat, sector.lng, period);
            totalPoliceData = totalPoliceData.concat(sectorData.map(incident => ({
              ...incident,
              _sector: sector.sector,
              _sectorName: sector.name,
              _period: period
            })));

            totalApiCalls++;
            this.logger.log(`Intelligence collected: ${sectorData.length} incidents [${sector.sector}-${period}]`);

            // Professional API rate management
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            this.logger.warn(`Intelligence collection failed: ${sector.name} [${period}] - ${error.message}`);
          }
        }

        // Breathing room between temporal periods
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const collectionDuration = (Date.now() - startTime) / 1000;
      this.logger.log(`Intelligence collection complete: ${totalPoliceData.length} raw incidents, ${totalApiCalls} API calls, ${collectionDuration.toFixed(2)}s duration`);

      // Enterprise-grade deduplication and data quality assessment
      const uniquePoliceData = totalPoliceData.filter((crime, index, self) =>
        index === self.findIndex(c => c.id === crime.id)
      );

      const dataQualityMetrics = {
        totalRaw: totalPoliceData.length,
        uniqueIncidents: uniquePoliceData.length,
        duplicateRate: ((totalPoliceData.length - uniquePoliceData.length) / totalPoliceData.length * 100).toFixed(2),
        temporalCoverage: temporalCoverage.length,
        geographicSectors: londonSectors.length,
        dataCompleteness: this.assessDataCompleteness(uniquePoliceData)
      };

      this.logger.log(`Data Quality Assessment: ${JSON.stringify(dataQualityMetrics)}`);
      this.logger.log(`Processing ${uniquePoliceData.length} validated intelligence records...`);

      for (const crime of uniquePoliceData) {
        try {
          const partialIncident = this.mapUKPoliceCrimeToIncident(crime);
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed UK Police incident: ${partialIncident.id}`);
        } catch (error) {
          // Skip duplicates or invalid data
          if (!error.message.includes('duplicate')) {
            this.logger.warn(`Failed to process incident ${crime.id}: ${error.message}`);
          }
        }
      }
      this.logger.log('UK Police data ingestion complete for Greater London.');

      // TfL Data Ingestion - Comprehensive Transport Network
      this.logger.log('Fetching TfL comprehensive transport data...');
      const tflAllData = await this.tflService.getAllTransportModes();

      // Process Tube Lines
      this.logger.log(`Processing ${tflAllData.tube.length} tube line statuses...`);
      for (const lineStatus of tflAllData.tube) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'tube');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed tube incident: ${partialIncident.id}`);
        }
      }

      // Process Bus Lines
      this.logger.log(`Processing ${tflAllData.bus.length} bus line statuses...`);
      for (const lineStatus of tflAllData.bus) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'bus');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed bus incident: ${partialIncident.id}`);
        }
      }

      // Process Overground Lines
      this.logger.log(`Processing ${tflAllData.overground.length} overground line statuses...`);
      for (const lineStatus of tflAllData.overground) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'overground');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed overground incident: ${partialIncident.id}`);
        }
      }

      // Process DLR
      this.logger.log(`Processing ${tflAllData.dlr.length} DLR line statuses...`);
      for (const lineStatus of tflAllData.dlr) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'dlr');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed DLR incident: ${partialIncident.id}`);
        }
      }

      // Process Elizabeth Line
      this.logger.log(`Processing ${tflAllData.elizabeth.length} Elizabeth line statuses...`);
      for (const lineStatus of tflAllData.elizabeth) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'elizabeth');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed Elizabeth line incident: ${partialIncident.id}`);
        }
      }

      // Process Road Incidents
      this.logger.log(`Processing ${tflAllData.roads.length} road corridor statuses...`);
      for (const roadStatus of tflAllData.roads) {
        const partialIncident = this.mapTfLRoadStatusToIncident(roadStatus);
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed road incident: ${partialIncident.id}`);
        }
      }

      // Process Road Disruptions (detailed)
      this.logger.log(`Processing ${tflAllData.roadDisruptions.length} detailed road disruptions...`);
      for (const disruption of tflAllData.roadDisruptions) {
        const partialIncident = this.mapTfLRoadDisruptionToIncident(disruption);
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed road disruption: ${partialIncident.id}`);
        }
      }

      // Process Bike Point Anomalies
      this.logger.log(`Processing ${tflAllData.bikes.length} bike point statuses...`);
      const bikeAnomalies = this.detectBikePointAnomalies(tflAllData.bikes);
      for (const anomaly of bikeAnomalies) {
        const extractedEntities = await this.extractEntitiesFromIncident(anomaly);
        anomaly.entities = extractedEntities;
        await this.incidentsService.create(anomaly);
        this.logger.debug(`Processed bike anomaly: ${anomaly.id}`);
      }

      this.logger.log('TfL comprehensive data ingestion complete.');

      // GDELT Data Ingestion (placeholder)
      this.logger.log('Fetching GDELT data...');
      const gdeltData = await this.gdeltService.getEvents();
      this.logger.log(`Fetched ${gdeltData.length} GDELT events.`);
      // for (const event of gdeltData) {
      //   const partialIncident = this.mapGDELTEventToIncident(event);
      //   const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
      //   partialIncident.entities = extractedEntities;
      //   await this.incidentsService.create(partialIncident);
      //   this.logger.debug(`Processed GDELT incident: ${partialIncident.id}`);
      // }
      this.logger.log('GDELT data ingestion complete (placeholder).');

    } catch (error) {
      this.logger.error('Error during ingestion process:', error.message, error.stack);
    }

    this.logger.log('Finished processing all ingestion sources.');
  }

  @Process('ingest-tfl')
  async handleIngestTfl(job: Job) {
    this.logger.log('Processing TfL transport data...');

    try {
      // TfL Data Ingestion - Comprehensive Transport Network
      this.logger.log('Fetching TfL comprehensive transport data...');
      const tflAllData = await this.tflService.getAllTransportModes();

      // Process Tube Lines
      this.logger.log(`Processing ${tflAllData.tube.length} tube line statuses...`);
      for (const lineStatus of tflAllData.tube) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'tube');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed tube incident: ${partialIncident.id}`);
        }
      }

      // Process Bus Lines
      this.logger.log(`Processing ${tflAllData.bus.length} bus line statuses...`);
      for (const lineStatus of tflAllData.bus) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'bus');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed bus incident: ${partialIncident.id}`);
        }
      }

      // Process Overground Lines
      this.logger.log(`Processing ${tflAllData.overground.length} overground line statuses...`);
      for (const lineStatus of tflAllData.overground) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'overground');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed overground incident: ${partialIncident.id}`);
        }
      }

      // Process DLR
      this.logger.log(`Processing ${tflAllData.dlr.length} DLR line statuses...`);
      for (const lineStatus of tflAllData.dlr) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'dlr');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed DLR incident: ${partialIncident.id}`);
        }
      }

      // Process Elizabeth Line
      this.logger.log(`Processing ${tflAllData.elizabeth.length} Elizabeth line statuses...`);
      for (const lineStatus of tflAllData.elizabeth) {
        const partialIncident = this.mapTfLLineStatusToIncident(lineStatus, 'elizabeth');
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed Elizabeth line incident: ${partialIncident.id}`);
        }
      }

      // Process Road Incidents
      this.logger.log(`Processing ${tflAllData.roads.length} road corridor statuses...`);
      for (const roadStatus of tflAllData.roads) {
        const partialIncident = this.mapTfLRoadStatusToIncident(roadStatus);
        if (partialIncident) {
          const extractedEntities = await this.extractEntitiesFromIncident(partialIncident);
          partialIncident.entities = extractedEntities;
          await this.incidentsService.create(partialIncident);
          this.logger.debug(`Processed road incident: ${partialIncident.id}`);
        }
      }

      // Process Bike Anomalies
      this.logger.log(`Processing ${tflAllData.bikes.length} bike sharing points...`);
      const bikeAnomalies = this.detectBikePointAnomalies(tflAllData.bikes);
      for (const anomaly of bikeAnomalies) {
        const extractedEntities = await this.extractEntitiesFromIncident(anomaly);
        anomaly.entities = extractedEntities;
        await this.incidentsService.create(anomaly);
        this.logger.debug(`Processed bike anomaly: ${anomaly.id}`);
      }

      this.logger.log('TfL comprehensive data ingestion complete.');
    } catch (error) {
      this.logger.error(`TfL data ingestion failed: ${error.message}`);
      throw error;
    }
  }

  private mapUKPoliceCrimeToIncident(crime: any): Partial<Incident> {
    return {
      id: `uk-police-${crime.id}`,
      type: 'crime',
      title: `${crime.category} - ${crime.location.street.name}`,
      description: crime.context,
      category: crime.category,
      source: 'UK Police API',
      location: { lat: parseFloat(crime.location.latitude), lng: parseFloat(crime.location.longitude), address: crime.location.street.name },
      datetime: new Date(`${crime.month}-01`).toISOString(),
      outcome_status: crime.outcome_status,
      persistent_id: crime.persistent_id,
    };
  }

  private mapTfLLineStatusToIncident(lineStatus: any, mode: string): Partial<Incident> | null {
    for (const status of lineStatus.lineStatuses) {
      // TFL severity: lower numbers = more severe (6=severe, 9=minor, 10=good)
      const severityThreshold = 10; // Capture anything worse than "Good Service"

      if (status.statusSeverity < severityThreshold) {
        const location = this.getTubeLineLocation(lineStatus.id);
        return {
          id: `tfl-${mode}-${lineStatus.id}`, // Stable ID without timestamp
          type: 'tfl',
          title: `${lineStatus.name} ${mode.charAt(0).toUpperCase() + mode.slice(1)} - ${status.statusSeverityDescription}`,
          description: status.reason || `${status.statusSeverityDescription} on ${lineStatus.name} ${mode}`,
          category: 'transport_disruption',
          source: `TfL ${mode.toUpperCase()} API`,
          location: { lat: location.lat, lng: location.lng, address: `${lineStatus.name} Line` },
          datetime: status.created ? new Date(status.created).toISOString() : new Date().toISOString(),
        };
      }
    }
    return null;
  }

  private getTubeLineLocation(lineId: string): { lat: number; lng: number } {
    // Major station coordinates for each tube line for better map positioning
    const lineCoordinates = {
      'bakerloo': { lat: 51.5074, lng: -0.1278 }, // Oxford Circus
      'central': { lat: 51.5154, lng: -0.1553 }, // Bond Street
      'circle': { lat: 51.5034, lng: -0.1276 }, // Westminster
      'district': { lat: 51.4941, lng: -0.1445 }, // Victoria
      'hammersmith-city': { lat: 51.5154, lng: -0.2056 }, // Hammersmith
      'jubilee': { lat: 51.5034, lng: -0.1276 }, // Westminster
      'metropolitan': { lat: 51.5154, lng: -0.1553 }, // Baker Street
      'northern': { lat: 51.5074, lng: -0.1278 }, // Oxford Circus
      'piccadilly': { lat: 51.5074, lng: -0.1362 }, // Piccadilly Circus
      'victoria': { lat: 51.4941, lng: -0.1445 }, // Victoria
      'waterloo-city': { lat: 51.5043, lng: -0.1132 }, // Waterloo
      'elizabeth': { lat: 51.5154, lng: -0.1553 }, // Bond Street
    };

    return lineCoordinates[lineId] || { lat: 51.5074, lng: -0.1278 }; // Default to central London
  }

  private mapTfLRoadStatusToIncident(roadStatus: any): Partial<Incident> | null {
    // Only create incidents for roads with issues
    if (roadStatus.statusSeverity !== 'Good') {
      const bounds = JSON.parse(roadStatus.bounds);
      const centerLat = (bounds[0][1] + bounds[1][1]) / 2;
      const centerLng = (bounds[0][0] + bounds[1][0]) / 2;

      return {
        id: `tfl-road-${roadStatus.id}`, // Stable ID without timestamp
        type: 'road_incident',
        title: `${roadStatus.displayName} - ${roadStatus.statusSeverityDescription}`,
        description: `Traffic incident on ${roadStatus.displayName}: ${roadStatus.statusSeverityDescription}`,
        category: 'traffic_incident',
        source: 'TfL Road API',
        location: { lat: centerLat, lng: centerLng, address: roadStatus.displayName },
        datetime: new Date().toISOString(),
      };
    }
    return null;
  }

  private mapTfLRoadDisruptionToIncident(disruption: any): Partial<Incident> | null {
    // Only create incidents for active disruptions with geographic data
    if (disruption.status === 'Active' && disruption.point) {
      const pointData = JSON.parse(disruption.point);

      // Determine severity category
      let severityCategory = 'traffic_disruption';
      if (disruption.hasClosures) {
        severityCategory = 'road_closure';
      } else if (disruption.severity === 'Serious' || disruption.severity === 'Severe') {
        severityCategory = 'traffic_incident';
      }

      // Build detailed description
      let description = disruption.comments || `${disruption.category} on ${disruption.location}`;
      if (disruption.currentUpdate) {
        description += ` Current status: ${disruption.currentUpdate}`;
      }

      // Extract street names if available
      const streetNames = disruption.streets?.map((street: any) => street.name).join(', ') || disruption.location;

      return {
        id: `tfl-disruption-${disruption.id}`, // Stable ID
        type: 'road_incident',
        title: `${disruption.location} - ${disruption.severity || disruption.category}`,
        description: description,
        category: severityCategory,
        source: 'TfL Road Disruption API',
        location: {
          lat: pointData[1], // pointData is [lng, lat] array format
          lng: pointData[0],
          address: streetNames
        },
        datetime: disruption.startDateTime || new Date().toISOString(),
      };
    }
    return null;
  }

  private detectBikePointAnomalies(bikePoints: any[]): Partial<Incident>[] {
    const anomalies: Partial<Incident>[] = [];

    for (const bikePoint of bikePoints) {
      const bikeProperty = bikePoint.additionalProperties.find((prop: any) => prop.key === 'NbBikes');
      const dockProperty = bikePoint.additionalProperties.find((prop: any) => prop.key === 'NbEmptyDocks');

      if (bikeProperty && dockProperty) {
        const bikes = parseInt(bikeProperty.value);
        const docks = parseInt(dockProperty.value);
        const total = bikes + docks;

        // Detect anomalies: completely empty stations or suspicious patterns
        if (total > 10 && (bikes === 0 || docks === 0)) {
          const isEmptyBikes = bikes === 0;

          anomalies.push({
            id: `tfl-bike-${bikePoint.id}`,
            type: 'bike_anomaly',
            title: `Bike Station Anomaly - ${bikePoint.commonName}`,
            description: isEmptyBikes
              ? `Bike station completely empty: 0 bikes, ${docks} empty docks`
              : `Bike station completely full: ${bikes} bikes, 0 empty docks`,
            category: 'transport_anomaly',
            source: 'TfL Bike API',
            location: { lat: bikePoint.lat, lng: bikePoint.lon, address: bikePoint.commonName },
            datetime: new Date().toISOString(),
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Generate professional temporal coverage for intelligence collection
   * Palantir-style comprehensive historical analysis
   */
  private generateTemporalCoverage(monthsBack: number): string[] {
    const periods: string[] = [];
    const now = new Date();

    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      periods.push(`${year}-${month}`);
    }

    return periods.reverse(); // Chronological order
  }

  /**
   * Enterprise data quality assessment
   * Professional intelligence standards validation
   */
  private assessDataCompleteness(data: any[]): any {
    const total = data.length;
    if (total === 0) return { completeness: 0, issues: [] };

    const issues = [];
    const withLocation = data.filter(d => d.location?.latitude && d.location?.longitude).length;
    const withCategory = data.filter(d => d.category).length;
    const withAddress = data.filter(d => d.location?.street?.name).length;

    const locationCompleteness = (withLocation / total * 100).toFixed(1);
    const categoryCompleteness = (withCategory / total * 100).toFixed(1);
    const addressCompleteness = (withAddress / total * 100).toFixed(1);

    if (withLocation < total * 0.95) issues.push('Geographic data gaps detected');
    if (withCategory < total * 0.98) issues.push('Classification data incomplete');
    if (withAddress < total * 0.80) issues.push('Address resolution suboptimal');

    return {
      overall: Math.min(Number(locationCompleteness), Number(categoryCompleteness)).toFixed(1),
      geographic: locationCompleteness,
      classification: categoryCompleteness,
      addressing: addressCompleteness,
      qualityIssues: issues
    };
  }

  private async extractEntitiesFromIncident(incident: Partial<Incident>): Promise<Entity[]> {
    const extractedEntities: Entity[] = [];

    // Extract location entity with enhanced metadata
    if (incident.location?.address) {
      const locationEntity = await this.entitiesService.findOrCreate({
        type: 'location',
        name: incident.location.address,
      });
      extractedEntities.push(locationEntity);
    }

    // Extract category-based entities with professional taxonomy
    if (incident.category) {
      const categoryEntity = await this.entitiesService.findOrCreate({
        type: 'threat_category',
        name: incident.category,
      });
      extractedEntities.push(categoryEntity);
    }

    // Extract temporal entities for time-series analysis
    if (incident.datetime) {
      const date = new Date(incident.datetime);
      const monthEntity = await this.entitiesService.findOrCreate({
        type: 'temporal',
        name: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      });
      extractedEntities.push(monthEntity);
    }

    // Extract case outcome entities for resolution tracking
    if (incident.outcome_status?.category) {
      const outcomeEntity = await this.entitiesService.findOrCreate({
        type: 'object',
        name: `outcome_${incident.outcome_status.category}`,
      });
      extractedEntities.push(outcomeEntity);
    }

    return extractedEntities;
  }

  /**
   * Professional neighbourhood-level intelligence collection
   * Enhanced granular coverage for Metropolitan Police area
   */
  private async getMetropolitanNeighbourhoods(): Promise<any[]> {
    try {
      // Get Metropolitan Police neighbourhoods for enhanced granular intelligence
      const neighbourhoods = await this.ukPoliceService.getNeighbourhoods('metropolitan');

      // Professional intelligence focus on key London neighbourhoods
      const strategicNeighbourhoods = neighbourhoods.filter(n =>
        // Focus on central London and high-activity areas
        n.name.toLowerCase().includes('westminster') ||
        n.name.toLowerCase().includes('city') ||
        n.name.toLowerCase().includes('central') ||
        n.name.toLowerCase().includes('camden') ||
        n.name.toLowerCase().includes('islington') ||
        n.name.toLowerCase().includes('southwark') ||
        n.name.toLowerCase().includes('tower') ||
        n.name.toLowerCase().includes('hackney') ||
        n.name.toLowerCase().includes('kensington') ||
        n.name.toLowerCase().includes('chelsea')
      ).slice(0, 10); // Limit to top 10 strategic neighbourhoods for performance

      this.logger.log(`Strategic neighbourhood selection: ${strategicNeighbourhoods.map(n => n.name).join(', ')}`);
      return strategicNeighbourhoods;
    } catch (error) {
      this.logger.warn(`Metropolitan neighbourhood collection failed: ${error.message}`);
      return [];
    }
  }
}