import { replicateRxCollection, RxReplicationStateBase } from 'rxdb/plugins/replication';
import { assign, keys, pickBy } from 'lodash';
import { RxCollection } from 'rxdb';
import { DateTime } from 'luxon';
import { v4, validate } from 'uuid';


export class DataSource {

  _options: any;
  _currentPage = 1;
  _fieldNames: string[];
  _replicator: RxReplicationStateBase<any>;
  _collection: RxCollection;
  _syncEndTime: DateTime;

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
        name: { $regex: new RegExp(`.*${options.searchValue}.*`, 'i') }
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
    return results.map(result => this._toPlainObject(result));
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
      this._currentPage = 1;
      this._syncEndTime = null;
      await this._replicator.awaitInitialReplication();
      this._syncEndTime = DateTime.now();
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

  async pull(last: any): Promise<any> {
    const documents = [];
    const baseUrl = this._options.baseUrl;
    const limit = this._options.limit || 100;
    const batchSize = this._options.batchSize || 1000;
    const isSync = this.isSyncing();

    let data;
    let lastUpdateAt = last ? DateTime.fromMillis(last.updatedAt) : null;

    if (this._syncEndTime >= lastUpdateAt) {
      lastUpdateAt = this._syncEndTime;
    }

    do {
      const url = last
        ? `${baseUrl}?updatedAt_gte=${lastUpdateAt.toMillis()}`
        : `${baseUrl}?_page=${this._currentPage}&_limit=${limit}`

      const response = await fetch(url);
      data = await response.json();
      documents.push(...data);

      if (isSync) {
        this._currentPage++;
      }

    } while (documents.length < batchSize && data.length == limit && isSync);

    return {
      documents: documents,
      hasMoreDocuments: data.length === limit
    };
  }

  isSyncing() {
    return !this._syncEndTime;
  }

  async _createReplicator() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return replicateRxCollection({
      collection: this._collection,
      replicationIdentifier: this._createReplicationIdentifier(),
      live: true,
      liveInterval: 10000,
      pull: {
        async handler(lastDoc) {
          return self.pull(lastDoc);
        }
      },
      push: {
        async handler(document) {
          console.log('pushing', document);
          return self.push(document);
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
