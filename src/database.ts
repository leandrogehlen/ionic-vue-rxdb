import { inject, Plugin } from 'vue';
import { addRxPlugin, createRxDatabase } from 'rxdb';
import { getRxStorageIndexedDB } from 'rxdb-premium/plugins/storage-indexeddb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { isPlatform } from '@ionic/vue';
import contactSchema from './schemas/contact';
import categorySchema from './schemas/category';

addRxPlugin(RxDBLeaderElectionPlugin);

const KEY_DATABASE = Symbol('database');

function awaitDeviceIsReady(): Promise<void> {
  return new Promise(resolve => {
    document.addEventListener('deviceready', () => {
      resolve();
    });
  });
}

export function useDatabase(): any {
  return inject(KEY_DATABASE);
}

export async function createDatabase(): Promise<Plugin> {

  if (isPlatform('mobile')) {
    await awaitDeviceIsReady();
  }

  const database = await createRxDatabase({
    name: 'testdb',
    storage: getRxStorageIndexedDB()
  });

  await database.addCollections({
    contacts: {
      schema: contactSchema
    },
    categories: {
      schema: categorySchema
    }
  });


  return {
    install(app: any) {
      app.provide(KEY_DATABASE, database);
    }
  };
}

