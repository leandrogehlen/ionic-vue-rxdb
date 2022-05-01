import { inject, Plugin } from 'vue';
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/dexie';
import { isPlatform } from '@ionic/vue';
import { Manager } from './data/Manager';
import contactSchema from './schemas/contact';

const KEY_DATABASE = Symbol('database');
const KEY_MANAGER = Symbol('manager');

function isDeviceReady(): Promise<void> {
  return new Promise(resolve => {
    document.addEventListener('deviceready', () => {
      resolve();
    });
  });
}

export function useDatabase(): any {
  return inject(KEY_DATABASE);
}

export function useManager(): Manager {
  return inject(KEY_MANAGER);
}

export async function createDatabase(): Promise<Plugin> {

  if (isPlatform('mobile')) {
    await isDeviceReady();
  }

  const database = await createRxDatabase({
    name: 'testdb',
    storage: getRxStorageDexie()
  });

  await database.addCollections({
    contacts: {
      schema: contactSchema
    }
  });



  const manager = new Manager(database);
  manager.add(database.collections.contacts, {
    baseUrl: 'http://192.168.0.109:3000/contacts'
  });

  return {
    install(app: any) {
      app.provide(KEY_DATABASE, database);
      app.provide(KEY_MANAGER, manager);
    }
  };
}

