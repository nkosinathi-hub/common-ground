<script lang="ts">
  const logo = `${import.meta.env.BASE_URL}tmdb-logo.svg`
</script>

<footer class="mt-5 space-y-1 border-t pt-4 text-xs leading-5 text-muted-foreground">
  <a
    href="https://www.themoviedb.org/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="The Movie Database (TMDB)"
    class="mb-2 inline-flex"
  >
    <img src={logo} alt="TMDB" width="78" height="10" />
  </a>
  <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
  <p>
    Streaming data by
    <a
      class="underline underline-offset-2"
      href="https://www.justwatch.com/"
      target="_blank"
      rel="noopener noreferrer">JustWatch</a
    >
  </p>
</footer>
