<template>
  <div class="flex flex-col">
    <LazyLayoutHero content-classes="text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Centered hero</h1>
        <p class="py-6">
          Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
          excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a
          id nisi.
        </p>
        <ActionsButton color="primary"> Get Started </ActionsButton>
      </div>
    </LazyLayoutHero>

    <LazyLayoutHero class="bg-base-200" content-classes="flex-col lg:flex-row">
      <img
        src="https://images.unsplash.com/photo-1570299437522-f66ff98d52e7?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        class="max-w-sm rounded-lg shadow-2xl"
      />
      <div>
        <h1 class="text-5xl font-bold">Hero with figure</h1>
        <p class="py-6">
          Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
          excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a
          id nisi.
        </p>
        <ActionsButton>Get Started</ActionsButton>
      </div>
    </LazyLayoutHero>

    <LazyLayoutHero
      class="bg-base-200"
      content-classes="flex-col lg:flex-row-reverse"
    >
      <img
        src="https://images.unsplash.com/photo-1586714604829-ca1521f0ec9c?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        class="max-w-sm rounded-lg shadow-2xl"
      />
      <div>
        <h1 class="text-5xl font-bold">Hero with figure but reverse order</h1>
        <p class="py-6">
          Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
          excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a
          id nisi.
        </p>
        <ActionsButton>Get Started</ActionsButton>
      </div>
    </LazyLayoutHero>

    <LazyLayoutHero
      content-classes="text-neutral-content text-center"
      overlay-image="https://images.unsplash.com/photo-1500759285222-a95626b934cb?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    >
      <div class="max-w-md">
        <h1 class="mb-5 text-5xl font-bold">Overlay image</h1>
        <p class="mb-5">
          Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
          excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a
          id nisi.
        </p>
        <ActionsButton>Get Started</ActionsButton>
      </div>
    </LazyLayoutHero>

    <LazyLayoutHero
      content-classes="text-neutral-content text-center"
      overlay-image="https://images.unsplash.com/photo-1584098178554-62be72fa42c5?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      parallax
    >
      <div class="max-w-md">
        <h1 class="mb-5 text-5xl font-bold">Overlay image (parallax effect)</h1>
        <p class="mb-5">
          Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
          excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a
          id nisi.
        </p>
        <ActionsButton>Get Started</ActionsButton>
      </div>
    </LazyLayoutHero>
  </div>
</template>
