import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Entity as AppEntity } from './entity.entity';

@Entity('incidents')
export class Incident {
  @PrimaryColumn()
  id: string;

  @Column()
  type: 'crime' | 'tfl' | 'news' | 'road_incident' | 'bike_anomaly';

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  category?: string;

  @Column()
  source: string;

  @Column('jsonb')
  location: { lat: number; lng: number; address?: string };

  @Column()
  datetime: string;

  @Column('jsonb', { nullable: true })
  outcome_status?: {
    category: string;
    date: string;
  };

  @Column({ nullable: true })
  persistent_id?: string;

  @Column('vector', { nullable: true, length: 1536 })
  title_vector?: number[];

  @Column('vector', { nullable: true, length: 1536 })
  description_vector?: number[];

  @ManyToMany(() => AppEntity, {
    cascade: true,
  })
  @JoinTable()
  entities: AppEntity[];
}
