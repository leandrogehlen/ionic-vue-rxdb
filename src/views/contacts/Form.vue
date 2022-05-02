<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Contact details</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-list>
        <ion-item>
          <ion-label position="floating">Name</ion-label>
          <ion-input v-model="data.name"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Company Name</ion-label>
          <ion-input v-model="data.companyName"></ion-input>
        </ion-item>
      </ion-list>
      <ion-button expand="block" color="primary" @click="onSaveClick">Save</ion-button>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, onBeforeUpdate, ref } from 'vue';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonList,
  IonItem,
  IonLabel,
  IonButton
} from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { useManager } from '../../database';

export default defineComponent({
  name: 'ContactForm',
  components: {
    IonButtons,
    IonContent,
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar,
    IonInput,
    IonList,
    IonItem,
    IonLabel,
    IonButton
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const data = ref<any>({});
    const dataSource = useManager().get(database => database.collections.contacts);

    const onSaveClick = async() => {
      await dataSource.save(data.value.id, data.value);
      router.push({name: 'contacts'});
    }

    onBeforeUpdate(async() => {
      data.value =  route.params.id
        ? await dataSource.findOne(route.params.id as string)
        : {};
    });

    return {
      data,
      onSaveClick
    };
  }
});
</script>
