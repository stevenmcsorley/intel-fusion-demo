import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from 'typeorm';

@TypeOrmEntity('entities')
export class Entity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: 'person' | 'location' | 'organisation' | 'object' | 'temporal' | 'threat_category';

  @Column()
  name: string;
}
