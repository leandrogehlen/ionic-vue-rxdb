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
      <ion-searchbar
        v-model="searchValue"
        show-clear-button="focus"
        @ionInput="onSearchInput">
      </ion-searchbar>
      <ion-list>
        <ion-item-sliding v-for="item in data" :key="item.id">
          <ion-item @click="emit('selected', item)">
            <ion-label>
              <slot name="row" :data="item"></slot>
            </ion-label>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option color="danger" expandable @click="onDeleteClick(item.id)">
              Delete
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <ion-infinite-scroll
        @ionInfinite="onInfinite($event)"
        threshold="100px"
        :disabled="isDisabled"
      >
        <ion-infinite-scroll-content
          loading-spinner="bubbles"
          loading-text="Loading more data...">
        </ion-infinite-scroll-content>
      </ion-infinite-scroll>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="emit('creating')">
          <ion-icon :md="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUpdate, ref } from 'vue';
import { remove } from 'lodash';
import { add } from 'ionicons/icons';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList,
  IonItem,
  IonLabel,
  InfiniteScrollCustomEvent,
  IonSearchbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/vue';
import { RxCollection } from 'rxdb';

const limit = 50;
const count = ref(0);
const data = ref([]);
const searchValue = ref();
const isDisabled = computed(() => count.value % limit !== 0);

const props = defineProps<{
  collection: RxCollection;
  title: string;
}>();

const emit = defineEmits([
  'selected',
  'creating',
  'deleting'
]);

const loadData = async () => {

  const condition = searchValue.value ? {
    selector: {
      name: {
        $regex: new RegExp(`.*${searchValue.value}.*`, 'i')
      }
    }
  } : {};

  const query = props.collection.find({
    ...condition,
    skip: data.value.length,
    limit: data.value.length,
    sort: [
      { id: 'asc' }
    ],
  });

  const results = await query.exec();
  const items = results.map(result => result.toMutableJSON());

  count.value = items.length;
  data.value.push(...items);
}

const onSearchInput = () => {
  data.value = [];
  loadData();
}

const onInfinite = async(e: InfiniteScrollCustomEvent) => {
  await loadData();
  e.target.complete();
}

const onDeleteClick = async(id: string) => {
  const document = await props.collection.findOne(id).exec();
  await document.remove();

  remove(data.value, {id: id});
}

onBeforeUpdate(() => {
  onSearchInput();
});

</script>

<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
