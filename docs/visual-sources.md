# Visual sources and design decisions

Reviewed 5 October 2026. The user requested the official Acrilchapas identity and imagery for this redesign and authorized reuse of those assets. Source provenance below records where the files were obtained; it is not a claim that third-party licensing, factory certifications or technical product specifications have been independently verified.

## Official Acrilchapas assets

All assets in this table come from `https://acrilchapas.com.br/`, its linked WordPress uploads or its public media index. No competitor imagery, generated replacement photographs or testimonial portraits were imported. Files are hosted by this website package rather than hotlinked at runtime. Measurements below are the local source dimensions, before responsive CSS cropping.

| Local file | Dimensions | Original URL | Description and appropriate use |
| --- | --- | --- | --- |
| `public/brand/logo.png` | 339 × 77 | [Official header logo](https://acrilchapas.com.br/wp-content/uploads/2025/03/logo-home-acrilchapas-header.png) | Official color identity for a light header. Preserve the full mark and its aspect ratio; do not replace its typography with a newly drawn wordmark. |
| `public/brand/logo-white.png` | 287 × 61 | [Official white logo](https://acrilchapas.com.br/wp-content/uploads/2025/03/logo-acril-chapas-white.png) | Official light identity for dark sections. Keep enough contrast and do not stretch it. |
| `public/brand/favicon.png` | 66 × 66 | [Official favicon](https://acrilchapas.com.br/wp-content/uploads/2025/02/cropped-logo-acril-fav-66x66.png) | Overlapping colored sheet symbol. Its small source resolution suits a browser icon, not a large hero graphic. |
| `public/images/official-hero.png` | 1920 × 851 | [Official material banner](https://acrilchapas.com.br/wp-content/uploads/2025/03/Acril-chapas-1.png) | Promotional composition of colored transparent sheets on a dark surface. Describe the visible material composition; the source alone does not establish whether this is a photograph or a render, nor any exact stock color or thickness. |
| `public/images/official-detail.png` | 546 × 576 | [Official production image](https://acrilchapas.com.br/wp-content/uploads/2025/03/beneficios-image-acril.jpg.png) | Industrial interior with a blue floor, roller tables, sheet handling and equipment. Useful for the manufacturing section. It does not independently substantiate production capacity, machinery specifications or a certification. |
| `public/images/acrylic-detail.webp` | 859 × 643 | [Official factory photograph](https://acrilchapas.com.br/wp-content/uploads/2025/03/Acrilchapas-7.webp) | Roller table in the foreground and industrial equipment in the background. Published by Acrilchapas; do not caption it as a different named facility or process stage without confirmation. |
| `public/images/opaque.png` | 374 × 467 | [Official opaque family image](https://acrilchapas.com.br/wp-content/uploads/2019/08/placa-acril.png) | Fan of white, yellow, orange, red, green and blue sheets. Assigned to “Acrílico colorido opaco” on the official homepage. |
| `public/images/crystal.png` | 374 × 467 | [Official crystal family image](https://acrilchapas.com.br/wp-content/uploads/2019/08/acril-portfolio2.jpg-1.png) | Several clear acrylic pieces on a dark background. Assigned to “Acrílico cristal” on the official homepage. |
| `public/images/translucent.png` | 374 × 467 | [Official translucent family image](https://acrilchapas.com.br/wp-content/uploads/2019/08/acril-portfolio3.jpg.png) | Composition of pale stacked sheets and colored translucent pieces. Assigned to “Acrílico translúcido” on the official homepage. |
| `public/images/colored.png` | 374 × 467 | [Official colored family image](https://acrilchapas.com.br/wp-content/uploads/2019/08/acril-portfolio1.jpg.png) | Circular fan of colored sheet samples. Assigned to “Acrílico colorido” on the official homepage. |
| `public/images/mirror.png` | 374 × 467 | [Official mirrored family image](https://acrilchapas.com.br/wp-content/uploads/2025/01/acril-portfolio2.jpg.png) | Fan of sample pieces with glossy and reflective surfaces. Assigned to “Acrílico espelhado” on the official homepage; the image is illustrative, not a calibrated mirror-finish or color sample. |

The header/white logos, favicon and five family mappings were present in the official homepage HTML inspected on 4 October 2026. The larger banner and production files are published in the same official uploads library. The public media index is [Acrilchapas WordPress media](https://acrilchapas.com.br/wp-json/wp/v2/media?per_page=100&media_type=image). Old theme-demo assets and mismatched testimonial portraits were intentionally not selected.

Use `alt="Acrilchapas"` for a standalone logo link. Product photographs need concise localized alternatives that describe the visible material. Decorative repeated images can use empty alternative text when nearby copy already conveys the same information. Images must not be the only way to identify a material, color family or action. Keep the product-family name visible as text.

The original banner is approximately 2.35 MB and the portrait production PNG approximately 718 KB. The original files remain in the package as source records. The redesign serves the following WebP derivatives, verified locally on 5 October 2026. They use `cwebp -q 85 -m 6`; the compact hero additionally uses `-resize 960 0` to preserve its aspect ratio. These are compression and resizing operations, with no generated content or replacement photography.

| Delivery file | Parent source | Dimensions | File size | Use |
| --- | --- | --- | --- | --- |
| `public/images/hero-wide.webp` | `public/images/official-hero.png` | 1920 × 851 | 102,636 bytes | Full-width hero source; approximately 95.6% smaller than its source PNG. |
| `public/images/hero-compact.webp` | `public/images/official-hero.png` | 960 × 426 | 35,736 bytes | Responsive `srcset` alternative for smaller displays. |
| `public/images/factory-detail.webp` | `public/images/official-detail.png` | 546 × 576 | 89,910 bytes | Production portrait at its native dimensions; approximately 87.5% smaller than its source PNG. |

Future derivatives should also be recorded with their parent source, dimensions and processing step. Do not enlarge the 374 px product sources and claim added photographic detail; their native resolution suits modest catalog cards. CSS may crop the hero and factory images, but the derivative files preserve their complete source compositions.

### Local source checksums

These SHA-256 fingerprints identify the files inspected for this ledger. They are useful for distinguishing the downloaded source assets from future optimized derivatives.

```text
public/brand/logo.png                    696ef51a24f4ef688d9c55a0fc5b20dc6bbc7a1c02005fc7af731989e25d48db
public/brand/logo-white.png              e5fa46f087636d474ffe0a1d975e0f1ca6ce99e06c8647b8310774e3baba06b1
public/brand/favicon.png                 dacb3a8191de0fb3da4bd053a0252abc517e6498ba152a1763913c4bfe97f000
public/images/official-hero.png          2a79628673b92a5cabb23d06dcff1dbcec75536b564c84d50e30d138cb09d0f7
public/images/official-detail.png        a3a426a9e2b7e53bbd1548a5da6346e764e867def61988059465d791c78d24bc
public/images/acrylic-detail.webp        bb710f22d986f8df8d92add8c620338cd960d747e4ad307ab87468fb0f39a432
public/images/opaque.png                 203cb7e1798534863d2c1fa3e33159642c0906f012f061c7b588f5df5902449d
public/images/crystal.png                5334fe7bdf4d8476597448ddb28d522b3585ea3eaf07767663f18123d7383aa9
public/images/translucent.png            b43f4211bd6b92f7c3bd07dad1273cceea69f02bf13dc9f2692fcf46e7362abe
public/images/colored.png                15df3fa6656fc2878232a697e614ff297bb3cdff7350f33a4e45edafe2b7e800
public/images/mirror.png                 e379ae82aa8dd631011f7ff25e33cc20a5a9bdd862c6ea0a7e28fa2c6ad6bca7
public/images/hero-wide.webp             24d295c9586a4734d1dd1453581626744cac93bbbaa6e02b0ce155a0294c6c56
public/images/hero-compact.webp          4d5874333bd94be8dd1156bea9b805b08b8f78a435358016b86e687f220f0529
public/images/factory-detail.webp        e32110387aca1a703828e86be6c3ac97080403fd4f4dbcb013615fe2be0f9745
```

## Five competitor UX ideas

These are design ideas derived from the official-page research completed on 1 October 2026. They are not a ranking by revenue, market share, accessibility or conversion. No competitor checkout was exercised and no competitor imagery or brand assets were copied. The complete evidence and limitations remain in the System repository's [research brief](https://github.com/Mxrider420z/Acrilchapas-System/blob/main/docs/research/brazil-acrylic-market.md) and [source ledger](https://github.com/Mxrider420z/Acrilchapas-System/blob/main/docs/research/sources.md).

| Benchmark and primary source | Observed pattern | Acrilchapas design application | Boundary |
| --- | --- | --- | --- |
| [Bold acrylic category](https://www.bold.net/BoldB2b/categoria/chapas-de-acrilico) and [store](https://loja.bold.net/) | Technical material discovery connected to product selection and purchasing. | Prominent catalog entry, clear material families, visible specification units and a quotation action next to material selection. | Do not copy prices, stock, freight promises, manufacturing capacity or export history. |
| [Cristal e Cores quotation page](https://cristalecores.com.br/pagina-de-orcamento/) | A structured industrial inquiry collects information useful to sales. | Make dimensions, thickness, quantity, destination and project notes part of one preserved multi-item inquiry. Keep custom projects easy to describe. | Do not inherit its CNPJ-only rule, minimum orders or response-time promise without Acrilchapas approval; foreign buyers must remain supported. |
| [Uniplex catalog](https://www.uniplex.com.br/produto/) | Material selection accompanies explanations of CAST manufacturing and quality. | Place official factory imagery and a concise process explanation near the material range, with technical assistance available. | Do not imply certified performance, a specific recipe, recycled content or environmental benefits from imagery alone. |
| [Sinteglas / CHEPS shop](https://www.cheps.com.br/) | Discovery by color, transparency, effect and specialty family. | Use a restrained set of clearly named families with visually distinct images and filters; help customers compare crystal, translucent, opaque, colored and mirrored options. | Do not imply the factory sells competitor additives, kits, specialty finishes or ready stock that has not been approved. |
| [Acriloja](https://www.acriloja.com/) | Familiar retail controls and visible account/order follow-up. | Preserve the quotation basket, keep quantity and dimensions readable, and provide a clear route from saved inquiry to offer and order tracking. | Demonstration payments and shipments stay visibly separate from real commercial transactions. |

The redesign should improve hierarchy and material discovery while preserving the existing PT/EN/ES basket, inquiry, customer portal and staff flows. The official logo, material pictures and factory photos supply identity and context; stronger claims still require business approval. Keep keyboard focus visible, avoid text over busy photo regions, verify contrast against every image crop, and test mobile catalog/quotation interactions on the deployed demonstration environment.
