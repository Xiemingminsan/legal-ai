<template>
  <!-- Background container - add this inside your body but before your content -->
<div class="fixed inset-0 -z-1 overflow-hidden">
    <!-- Gradient background - light/dark mode variants -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 bg-pattern dark:from-gray-900 dark:via-blue-950 dark:to-purple-950"></div>

    <!-- Animated circles - light/dark mode variants -->
    <div class="absolute top-20 left-20 w-96 h-96 bg-blue-200 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-30 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
    <div class="absolute bottom-20 right-20 w-96 h-96 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-30 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
    <div class="absolute top-1/2 left-1/3 w-80 h-80 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-30 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>

    <!-- Grid pattern overlay - light/dark mode variants -->
    <div class="absolute inset-0 bg-[url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0 0h100v100H0z' fill='none'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23000' fill-opacity='.05' transform='translate(0 0)'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23000' fill-opacity='.05' transform='translate(0 20)'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23000' fill-opacity='.05' transform='translate(0 40)'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23000' fill-opacity='.05' transform='translate(0 60)'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23000' fill-opacity='.05' transform='translate(0 80)'%3E%3C/path%3E%3Cpath d='M20 0h1v1h-1z' fill='%23000' fill-opacity='.05' transform='translate(0 0)'%3E%3C/path%3E%3Cpath d='M20 0h1v1h-1z' fill='%23000' fill-opacity='.05' transform='translate(0 20)'%3E%3C/path%3E%3Cpath d='M20 0h1v1h-1z' fill='%23000' fill-opacity='.05' transform='translate(0 40)'%3E%3C/path%3E%3Cpath d='M20 0h1v1h-1z' fill='%23000' fill-opacity='.05' transform='translate(0 60)'%3E%3C/path%3E%3Cpath d='M20 0h1v1h-1z' fill='%23000' fill-opacity='.05' transform='translate(0 80)'%3E%3C/path%3E%3C/svg%3E&quot;)] dark:bg-[url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0 0h100v100H0z' fill='none'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23fff' fill-opacity='.07' transform='translate(0 0)'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23fff' fill-opacity='.07' transform='translate(0 20)'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23fff' fill-opacity='.07' transform='translate(0 40)'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23fff' fill-opacity='.07' transform='translate(0 60)'%3E%3C/path%3E%3Cpath d='M0 0h1v1H0z' fill='%23fff' fill-opacity='.07' transform='translate(0 80)'%3E%3C/path%3E%3C/svg%3E&quot;)]"></div>

    <!-- Floating elements - light/dark mode variants -->
    <div class="absolute top-1/4 left-1/4 w-8 h-8 bg-blue-400 dark:bg-blue-500 rounded-full opacity-20 dark:opacity-30"></div>
    <div class="absolute top-3/4 left-2/3 w-6 h-6 bg-purple-400 dark:bg-purple-500 rounded-full opacity-20 dark:opacity-30"></div>
    <div class="absolute top-1/3 right-1/4 w-10 h-10 bg-indigo-400 dark:bg-indigo-500 rounded-full opacity-20 dark:opacity-30"></div>
</div>


</template>

<!-- Add this style to your CSS file or in a style tag -->
<style>
    .bg-pattern {
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }

    .dark .bg-pattern {
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
</style>
