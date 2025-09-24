import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Incident } from './incident.entity';

@Entity('case_files')
export class CaseFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  notes: string;

  @ManyToMany(() => Incident)
  @JoinTable()
  incidents: Incident[];
}
