import { replicateRxCollection, RxReplicationState } from 'rxdb/plugins/replication';
import { assign, keys, pickBy } from 'lodash';
import { lastOfArray, RxCollection,  } from 'rxdb';
import { v4, validate } from 'uuid';


export class DataSource {

  _options: any;
  _fieldNames: string[];
  _replicator: RxReplicationState<any, any>;
  _collection: RxCollection;


  constructor(collection: RxCollection, options: any) {
    this._options = options || {};
    this._collection = collection;
    this._fieldNames = keys(collection.schema.jsonSchema.properties);
  }

  async findOne(key: string): Promise<any> {
    const document = await this._collection.findOne(key).exec();
    return this._toPlainObject(document);
  }

  async findAll(options: any = {}): Promise<any[]> {
    const condition = options.searchValue ? {
      selector: {
        name: {
          $regex: `.*${options.searchValue}.*`,
          $options: 'i'
        }
      }
    } : {};

    const query = this._collection.find({
      ...condition,
      skip: options.skip,
      limit: options.limit,
      sort: [
        { id: 'asc' }
      ],
    });

    const results = await query.exec();
    return results.map((result: any) => this._toPlainObject(result));
  }

  async save(key: string, data: any) {
    if (key) {
      const document = await this._collection.findOne(key).exec();
      await document.atomicUpdate((doc: any) => assign(doc, data));
    } else {
      const primaryKey = this._collection.schema.primaryPath as string;
      await this._collection.insert({
        ...{[primaryKey]: v4()},
        ...data
      });
    }
  }

  async destroy(key: string) {
    const document = await this._collection.findOne(key).exec();
    await document.remove();
  }

  async start(awaitInit = true): Promise<void> {
    const created = !!this._replicator;

    if (!created) {
      this._replicator = await this._createReplicator();
    }

    if ((!created || this._replicator.isStopped()) && awaitInit) {
      await this._replicator.awaitInitialReplication();
    }
  }

  async stop(): Promise<any> {
    return this._replicator.cancel();
  }

  async push(documents: any[]): Promise<void> {
    const baseUrl = this._options.baseUrl;

    for (const doc of documents) {
      const isNew = validate(doc.id);
      const url = isNew ? baseUrl : `${baseUrl}/${doc.id}`;
      const method = doc._deleted ? 'DELETE' : isNew ? 'POST' : 'PUT';

      await fetch(url, {
        method: method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this._toPlainObject(doc))
      });
    }
  }

  async pull(lastCheckpoint: any, batchSize: number): Promise<any> {
    const baseUrl = this._options.baseUrl;
    const minTimestamp = lastCheckpoint ? lastCheckpoint.updatedAt : 0;

    const response = await fetch(
        `${baseUrl}/?minUpdatedAt=${minTimestamp}&limit=${batchSize}`
    );
    const documentsFromRemote = await response.json() as any[];
    return {
        documents: documentsFromRemote,
        checkpoint: documentsFromRemote.length === 0 ? lastCheckpoint : {
            id: lastOfArray(documentsFromRemote).id,
            updatedAt: lastOfArray(documentsFromRemote).updatedAt
        }
    };
  }

  async _createReplicator() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return replicateRxCollection({
      collection: this._collection,
      replicationIdentifier: this._createReplicationIdentifier(),
      live: true,
      pull: {
        async handler(lastCheckpoint: any, batchSize: number) {
          return self.pull(lastCheckpoint, batchSize);
        }
      },
      push: {
        async handler(document) {
          console.log('pushing', document);
          await self.push(document);
          return [];
        }
      },
    });
  }

  _createReplicationIdentifier() {
    return `${this._collection.name}:${this._options.baseUrl}`;
  }

  _toPlainObject(data: any): any {
    return pickBy(data,
      (value, key) => this._fieldNames.includes(key) && !key.startsWith('_')
    );
  }

}
