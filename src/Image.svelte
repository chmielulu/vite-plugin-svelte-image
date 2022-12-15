<script lang="ts">
  import { onMount } from "svelte";

  export let image;
  export let alt: string;

  let placeholder: HTMLElement, img: HTMLImageElement, container: HTMLDivElement;

  onMount(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        observer.unobserve(container);
        img.src= img.dataset.src;
        img.srcset = img.dataset.srcset;
      }
    });


    const handleLoad = () => {
      img.style.opacity = "1";
      placeholder.style.opacity = "0";
    }

    img.addEventListener("load", handleLoad);
    observer.observe(container);

    return () => {
      observer.unobserve(container);
      img.removeEventListener("load", handleLoad);
    }
  });
</script>

<div style="max-width: {image.width}px" bind:this={container} class="{$$props.class ? $$props.class + ' ' : ''}svelte-image-wrapper">
  <div style="padding-bottom: {image.height / image.width * 100}%"></div>
  {#if typeof image?.placeholder?.fallback === "string"}
    <img bind:this={placeholder} src={image.placeholder.fallback} class="placeholder" alt="" aria-hidden="true" decoding="async">
  {:else}
    <div bind:this={placeholder} class="placeholder" aria-hidden="true" style="background-color: {image.backgroundColor}"></div>
  {/if}
  <picture>
    {#each image.images.sources as source}
      <source type={source.type} data-srcset={source.srcSet} sizes={source.sizes}>
    {/each}
    <img bind:this={img} decoding="async" loading="lazy" data-src={image.images.fallback.src} data-srcset={image.images.fallback.srcSet} sizes={image.images.fallback.sizes} alt={alt}>
  </picture>

  <noscript>
    <picture>
      {#each image.images.sources as source}
        <source type={source.type} srcset={source.srcSet} sizes={source.sizes}>
      {/each}
      <img bind:this={img} decoding="async" loading="lazy" src={image.images.fallback.src} srcset={image.images.fallback.srcSet} sizes={image.images.fallback.sizes} alt={alt}>
    </picture>
  </noscript>
</div>

<style lang="scss">
  .svelte-image-wrapper {
    position: relative;
    overflow: hidden;
  }

  .empty-div {

  }

  .placeholder {
    transition: opacity 500ms linear 0s;
  }

  .svelte-image-wrapper img, .svelte-image-wrapper .placeholder {
    bottom: 0;
    height: 100%;
    left: 0;
    margin: 0;
    max-width: none;
    padding: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
    object-fit: cover;
  }

  picture img {
    transition: opacity .25s linear;
    will-change: opacity;
    opacity: 0;
  }
</style>