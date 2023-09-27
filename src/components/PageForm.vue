<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ props.title }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-list>
        <slot name="items" :data="data">

        </slot>
      </ion-list>
      <ion-button expand="block" color="primary" @click="onSaveClick">Save</ion-button>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonButton,
  loadingController
} from '@ionic/vue';
import { RxCollection } from 'rxdb';
import { v4 } from 'uuid';

const props = defineProps<{
  collection: RxCollection<any>;
  title: string;
}>();

const emit = defineEmits(['saved', 'saving', 'loaded']);
const route = useRoute();
const data = ref<any>({});

const onSaveClick = async() => {
  const loading = await loadingController.create({ message: 'Saving...'});
  try {
    await loading.present();
    const key = data.value.id;
    const collection = props.collection;
    emit('saving', data.value);

    if (key) {
      const document = await collection.findOne(key).exec();
      await document.incrementalPatch(data.value);
    } else {
      const primaryKey = collection.schema.primaryPath as string;
      await collection.insert({
        ...{[primaryKey]: v4()},
        ...data.value
      });
    }
    emit('saved', data.value);
  } finally {
    loading.dismiss();
  }
}

const init = async () => {
  const loading = await loadingController.create({ message: 'Loading...'});
  try {
    await loading.present();
    if (!route.params.id) {
      data.value = {};
    } else {
      const document = await props.collection.findOne(route.params.id as string).exec();
      data.value = document?.toMutableJSON();
    }
    emit('loaded', data.value)
  } finally {
    loading.dismiss();
  }
}

init();
</script>
