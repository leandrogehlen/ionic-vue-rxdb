<template>
  <PageForm
    title="Categories"
    :collection="database.collections.categories"
    @saved="router.push({name: 'categories'})"
  >
    <template #items="{ data }">
      <ion-item>
        <ion-input
          label="Name"
          labelPlacement="stacked"
          v-model="data.description">
        </ion-input>
      </ion-item>
    </template>
  </PageForm>
</template>
<script setup lang="ts">
import { IonInput, IonItem } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useDatabase } from '../../database';
import PageForm from '../../components/PageForm.vue';

const database = useDatabase()
const router = useRouter();
</script>
