<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Contacts</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-searchbar
        v-model="searchValue"
        :show-clear-button="true"
        @ionChange="onSearchChange">
      </ion-searchbar>
      <ion-list>
        <ion-item
          v-for="contact in contacts"
          :key="contact.id"
          @click="onItemClick(contact.id)"
        >
          <ion-label>
            {{ contact.name }} <br/> <small>{{ contact.companyName }}</small>
          </ion-label>
        </ion-item>
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
        <ion-fab-button @click="onCreateClick">
          <ion-icon :md="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUpdate, ref } from 'vue';
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
  useIonRouter,
} from '@ionic/vue';
import { useManager } from '../../database';
import { add } from 'ionicons/icons';

export default defineComponent({
  name: 'ContactIndex',
  components: {
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
    IonSearchbar,
    IonFab,
    IonFabButton,
    IonIcon,
  },
  setup() {
    const limit = 50;
    const contacts = ref([]);
    const searchValue = ref();
    const isDisabled = computed(() => contacts.value.length % limit !== 0);

    const router = useIonRouter();
    const manager = useManager();

    const dataSource = manager.get(database => database.collections.contacts);
    dataSource.start();

    const loadContacts = async () => {
      const items = await dataSource.findAll({
        searchValue: searchValue.value,
        skip: contacts.value.length,
        limit: limit
      });
      contacts.value.push(...items);
    }

    const onSearchChange = () => {
      contacts.value = [];
      loadContacts();
    }

    const onInfinite = async(e: InfiniteScrollCustomEvent) => {
      await loadContacts();
      e.target.complete();
    }

    const onItemClick = (id: any) => {
      router.push({name: 'editContact', params: {id: id}})
    }

    const onCreateClick = () => {
      router.push({name: 'newContact'})
    }

    onBeforeUpdate(() => onSearchChange())


    return {
      add,
      contacts,
      isDisabled,
      searchValue,
      onInfinite,
      onSearchChange,
      onItemClick,
      onCreateClick
    }
  }
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
