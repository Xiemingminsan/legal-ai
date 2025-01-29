<template>
  <section id="trusted-partners" class="py-20 bg-gray-100 dark:bg-gray-900">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
        Trusted Partner Law Firms Near Me
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Map -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div ref="mapContainer" class="h-[400px] lg:h-[600px]"></div>
        </div>

        <!-- Law Firms List -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div class="p-6 h-[400px] lg:h-[600px] overflow-y-auto">
            <ul class="space-y-4">
              <li v-for="firm in lawFirms" :key="firm.id"
                class="flex items-start space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition duration-150 ease-in-out">
                <div class="flex-shrink-0">
                  <i class="ri-scales-3-line text-2xl text-blue-600 dark:text-blue-400"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ firm.name }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">{{ firm.address }}</p>
                  <div class="mt-2 flex items-center space-x-2">
                    <a :href="'tel:' + firm.phone" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      <i class="ri-phone-line mr-1"></i>{{ firm.phone }}
                    </a>
                    <a :href="firm.website" target="_blank" rel="noopener noreferrer"
                      class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      <i class="ri-global-line mr-1"></i>Website
                    </a>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useScriptTag } from '@vueuse/core';
import 'leaflet/dist/leaflet.css';

const mapContainer = ref(null);
const { load } = useScriptTag('https://unpkg.com/leaflet@1.7.1/dist/leaflet.js');

const lawFirms = [
  {
    id: 1,
    name: "Mesfin Tafesse & Associates",
    address: "Bole Road, Addis Ababa",
    phone: "+251 116 616 065",
    website: "http://www.mtalaw.com",
    lat: 9.0127,
    lng: 38.7652
  },
  {
    id: 2,
    name: "Tameru Wondm Agegnehu Law Office",
    address: "Kazanchis, Addis Ababa",
    phone: "+251 115 540 767",
    website: "http://www.tamerulaw.com",
    lat: 9.0215,
    lng: 38.7578
  },
  {
    id: 3,
    name: "Aman & Partners Law Office",
    address: "Bole, Addis Ababa",
    phone: "+251 116 627 840",
    website: "http://www.amanpartners.com",
    lat: 9.0156,
    lng: 38.7691
  },
  {
    id: 4,
    name: "Bekele & Associates Law Office",
    address: "Kirkos, Addis Ababa",
    phone: "+251 115 506 824",
    website: "http://www.bekelelaw.com",
    lat: 9.0098,
    lng: 38.7614
  },
  {
    id: 5,
    name: "Mehrteab Leul & Associates Law Office",
    address: "Bole, Addis Ababa",
    phone: "+251 116 186 200",
    website: "http://www.mehrteableul.com",
    lat: 9.0184,
    lng: 38.7723
  }
];

onMounted(async () => {
  await load();
  const L = window.L;

  const map = L.map(mapContainer.value).setView([9.0256, 38.7378], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const customIcon = L.divIcon({
    html: '<i class="ri-scales-3-line text-2xl text-blue-600"></i>',
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  lawFirms.forEach(firm => {
    L.marker([firm.lat, firm.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b>${firm.name}</b><br>${firm.address}`);
  });
});
</script>

<style>
.custom-div-icon {
  background: none;
  border: none;
}
</style>
