<template>
  <PageForm
    title="Contacts"
    :collection="database.collections.contacts"
    @loaded="onLoaded"
    @saving="onSaving"
    @saved="router.push({name: 'contacts'})"
  >
    <template #items="{ data }">
      <ion-item>
        <ion-input
          label="Name"
          labelPlacement="stacked"
          v-model="data.name">
        </ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          label="Company Name"
          labelPlacement="stacked"
          v-model="data.company_name"
        ></ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          label="E-mails"
          labelPlacement="stacked"
          v-model="data.emails"
        ></ion-input>
      </ion-item>
    </template>
  </PageForm>
</template>
<script setup lang="ts">
import { IonInput, IonItem } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useDatabase } from '../../database';
import PageForm from '../../components/PageForm.vue';

const database = useDatabase();
const router = useRouter();

const onLoaded = (data: any) => {
  data.emails = data.emails?.join(',');
}

const onSaving = (data: any) => {
  data.emails = data.emails.split(',').map((email: string) => email.trim());
}
</script>

