import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ekis",
    short_name: "Ekis",
    description: "School events tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf2f8",
    theme_color: "#e0218a",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
