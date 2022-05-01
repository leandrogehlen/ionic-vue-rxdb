import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/dexie';
import { inject, Plugin } from 'vue';
import { isPlatform } from '@ionic/vue';
import contactSchema from './schemas/contact';

const INSTANCE = Symbol('database');

function isDeviceReady(): Promise<void> {
  return new Promise(resolve => {
    document.addEventListener('deviceready', () => {
      resolve();
    });
  });
}

export function useDatabase(): any {
  return inject(INSTANCE);
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

  return {
    install(app: any) {
      app.provide(INSTANCE, database);
    }
  };
}

