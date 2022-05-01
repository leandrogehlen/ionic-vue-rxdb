import { replicateRxCollection, RxReplicationStateBase } from 'rxdb/plugins/replication';
import { assign, keys, pick } from 'lodash';
import { RxCollection } from 'rxdb';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';


export class DataSource {

  _options: any;
  _replicator: RxReplicationStateBase<any>;
  _currentPage = 1;
  _collection: RxCollection;
  _syncEndTime: DateTime;
  _fieldNames: string[];

  constructor(collection: RxCollection, options: any) {
    this._options = options || {};
    this._collection = collection;
    this._fieldNames = keys(collection.schema.jsonSchema.properties);
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
    return this._mapData(results);
  }

  async save(key: string, data: any) {
    if (key === null) {
      const primaryKey = this._collection.schema.primaryPath as string;
      await this._collection.insert({
        ...{[primaryKey]: v4()},
        ...data
      });
    } else {
      const document = await this._collection.findOne(key).exec();
      await document.atomicUpdate((doc: any) => assign(doc, data));
    }
  }

  async destroy(key: string) {
    const document = await this._collection.findOne(key).exec();
    await document.remove();
  }

  async start(awaitInit = true) {
    try {
      if (!this._replicator) {
        this._replicator = await this._createReplicator();
      }

      if (awaitInit) {
        this._replicator.awaitInitialReplication();
        await this._replicator.awaitInSync();
      }
    } finally {
      this._syncEndTime = DateTime.now();
    }
  }

  async push(documents: any[]) {
    const baseUrl = this._options.baseUrl;

    for (const doc of documents) {
      await fetch(`${baseUrl}/${doc.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(doc)
      });
    }
  }

  async pull(lastDoc: any) {
    const baseUrl = this._options.baseUrl;
    const limit = this._options.limit || 100;
    let lastUpdateAt: any = lastDoc ? DateTime.fromMillis(lastDoc.updatedAt) : null;

    if (!this.isSyncing()) {
      if (lastUpdateAt && lastUpdateAt <= this._syncEndTime) {
        lastUpdateAt = this._syncEndTime;
      }
      lastUpdateAt = lastUpdateAt.toUTC().toMillis();
    }


    const url = this.isSyncing()
      ? `${baseUrl}?_page=${this._currentPage}&_limit=${limit}`
      : `${baseUrl}?updatedAt_gte=${lastUpdateAt}`;

    const response = await fetch(url);
    const data = await response.json();
    this._currentPage++;

    return {
      documents: data,
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

  _mapData(data: any): any {
    return Array.isArray(data)
      ? data.map(item => pick(item, this._fieldNames))
      : pick(data, this._fieldNames);
  }

}
