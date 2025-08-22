import { inject, Plugin } from 'vue';
import { createRxDatabase, addRxPlugin } from 'rxdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { isPlatform } from '@ionic/vue';
import contactSchema from './schemas/contact';
import categorySchema from './schemas/category';
import { Manager } from './data/Manager';

addRxPlugin(RxDBLeaderElectionPlugin);

const PLUGIN_DATABASE = Symbol('database');
const PLUGIN_MANAGER = Symbol('manager');

function awaitDeviceIsReady(): Promise<void> {
  return new Promise(resolve => {
    document.addEventListener('deviceready', () => {
      resolve();
    });
  });
}

export function useDatabase(): any {
  return inject(PLUGIN_DATABASE);
}

export function useManager(): any {
  return inject(PLUGIN_MANAGER);
}


export async function createDatabase(): Promise<Plugin> {

  if (isPlatform('mobile')) {
    await awaitDeviceIsReady();
  }

  const database = await createRxDatabase({
    name: 'testdb',
    storage: getRxStorageDexie()
  });

  await database.addCollections({
    contacts: {
      schema: contactSchema
    },
    categories: {
      schema: categorySchema
    }
  });

  const manager = new Manager(database)
    .add(database.contacts, {
      baseUrl: 'http://localhost:3000/contacts'
    });

  return {
    install(app: any) {
      app.provide(PLUGIN_DATABASE, database);
      app.provide(PLUGIN_MANAGER, manager);
    }
  };
}

