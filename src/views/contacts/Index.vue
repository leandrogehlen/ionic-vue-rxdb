<template>
  <PageIndex
    title="Contacts"
    :collection="database.collections.contacts"
    @creating="onCreating"
    @selected="onSelected"
  >
    <template #row="{ data }">
      {{ data.name }} <br/>
      <small>{{ data.company_name }}</small>
    </template>
  </PageIndex>
</template>
<script setup lang="ts">
import { useIonRouter } from '@ionic/vue';
import { useDatabase } from '../../database';
import PageIndex from '../../components/PageIndex.vue';

const router = useIonRouter();
const database = useDatabase()

const onSelected = (data: any) => {
  router.push({name: 'editContact', params: {id: data.id}})
}

const onCreating = () => {
  router.push({name: 'newContact'});
}
</script>

