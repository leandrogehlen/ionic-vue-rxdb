import { RxCollection, RxDatabase } from 'rxdb';
import { DataSource } from './DataSource';

export class Manager {

  private _database: RxDatabase;
  private _instances = new Map<RxCollection, DataSource>();

  constructor(database: RxDatabase) {
    this._database = database;
    database.collections
  }

  public add(collection: RxCollection, options: any): this {
    this._instances.set(collection, new DataSource(collection, options));
    return this;
  }

  public get(finder: (database: RxDatabase) => RxCollection): DataSource {
    const collection = finder(this._database);
    return this._instances.get(collection);
  }

  public async start(awaitInit = true): Promise<void> {
    const values = Array.from(this._instances.values());
    await Promise.all(values.map(instance => instance.start(awaitInit)));
  }

  public async stop(): Promise<void> {
    const values = Array.from(this._instances.values());
    await Promise.all(values.map(instance => instance.stop()));
  }
}
