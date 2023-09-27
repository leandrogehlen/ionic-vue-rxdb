<template>
  <PageIndex
    title="Categories"
    :collection="database.collections.categories"
    @creating="onCreating"
    @selected="onSelected"
  >
    <template #row="{ data }">
      {{ data.description }}
    </template>
  </PageIndex>
</template>

<script setup lang="ts">
import { useDatabase } from '../../database';
import { useIonRouter } from '@ionic/vue';
import PageIndex from '../../components/PageIndex.vue';

const router = useIonRouter();
const database = useDatabase()

const onSelected = (data: any) => {
  router.push({name: 'editCategory', params: {id: data.id}})
}

const onCreating = () => {
  router.push({name: 'newCategory'});
}
</script>
