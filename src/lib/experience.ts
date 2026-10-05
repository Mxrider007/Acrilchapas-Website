import type { Family, Locale } from './domain';

type Experience = {
  catalog: string; heroAlt: string; heroIntro: string; heroTitle: string; heroAccent: string;
  heroText: string; photoCaption: string; photoDetail: string; collection: string;
  collectionTitle: string; collectionText: string; finderTitle: string; finderText: string;
  needs: Record<Family, string>; uses: Record<Family, string>; reference: string;
  applications: string; applicationsTitle: string; applicationsText: string; exploreApplication: string;
  projects: { title: string; description: string; tags: string[]; family: Family; image: Family }[];
  factory: string; factoryTitle: string; factoryText: string; factoryAlt: string; factoryDetailAlt: string;
  services: { title: string; text: string }[]; factoryCta: string;
  process: string; processTitle: string; steps: { title: string; text: string }[];
  faq: string; faqTitle: string; questions: { question: string; answer: string }[];
  contactLabel: string; contactTitle: string; contactText: string; contactCta: string;
};

export const experience: Record<Locale, Experience> = {
  pt: {
    catalog: 'Catálogo', heroIntro: 'ACRÍLICO CAST · DIRETO DA FÁBRICA',
    heroTitle: 'Dê forma.', heroAccent: 'Crie possibilidades.',
    heroText: 'Transparência, cor e infinitas ideias. Chapas de acrílico para transformar o que você imagina no que o seu projeto precisa.',
    heroAlt: 'Chapas de acrílico em azul, vermelho, verde e âmbar, com bordas polidas e transparentes',
    photoCaption: 'O começo de uma nova ideia.', photoDetail: 'COR · LUZ · MATÉRIA',
    collection: 'ENCONTRE SEU PONTO DE PARTIDA', collectionTitle: 'Um material. Muitas expressões.',
    collectionText: 'Conheça as famílias de acrílico e explore o efeito que combina com o seu projeto.',
    finderTitle: 'Qual efeito você procura?', finderText: 'Escolha um ponto de partida. As características finais dependem da cor, da espessura e da aplicação.',
    needs: { crystal: 'Transparência', translucent: 'Passagem de luz', opaque: 'Cor sólida', colored: 'Mais cor', mirror: 'Reflexos' },
    uses: { crystal: 'Para explorar em displays, expositores e peças transparentes.', translucent: 'Para explorar luz, cor e efeitos visuais.', opaque: 'Para explorar em letras, sinalização e peças de cor sólida.', colored: 'Para explorar em decoração, comunicação visual e design.', mirror: 'Para explorar reflexos em decoração e detalhes visuais.' },
    reference: 'Imagens do acervo oficial. Cores e acabamentos devem ser confirmados por amostra.',
    applications: 'DA CHAPA À SUA PRÓXIMA CRIAÇÃO', applicationsTitle: 'O seu projeto indica o caminho.',
    applicationsText: 'Cada ideia pede uma combinação de material, acabamento e medida. Comece pela sua aplicação.',
    exploreApplication: 'Explorar este material',
    projects: [
      { title: 'Arquitetura & interiores', description: 'Detalhes que mudam a leitura de um espaço. Explore o acrílico em mobiliário, elementos decorativos e composições de cor.', tags: ['Decoração', 'Mobiliário', 'Design'], family: 'colored', image: 'colored' },
      { title: 'Comunicação visual', description: 'Dê presença à sua marca. Transparência e cor para displays, letras, expositores e sinalização.', tags: ['Displays', 'Letreiros', 'Sinalização'], family: 'opaque', image: 'opaque' },
      { title: 'Indústria & transformação', description: 'A matéria-prima é só o começo. Converse sobre chapas, cortes e detalhes de fabricação para peças e componentes do seu projeto.', tags: ['Peças', 'Componentes', 'Corte sob medida'], family: 'crystal', image: 'crystal' },
    ],
    factory: 'DE ATIBAIA PARA O SEU PROJETO', factoryTitle: 'Ideias ganham forma. Aqui na fábrica.',
    factoryText: 'Somos fabricantes de chapas de acrílico CAST. Da escolha do material à personalização, a Acrilchapas aproxima quem cria de quem produz.',
    factoryAlt: 'Área de produção da Acrilchapas, com mesas de roletes e equipamentos industriais',
    factoryDetailAlt: 'Equipe e equipamentos na fábrica Acrilchapas em Atibaia',
    services: [
      { title: 'Fabricação CAST', text: 'Chapas de acrílico em diferentes famílias de cor e acabamento.' },
      { title: 'Corte e personalização', text: 'Corte sob medida e gravação a laser, mediante avaliação do projeto.' },
      { title: 'Entregas no Brasil', text: 'Consulte transporte e prazo para o seu destino e pedido.' },
    ], factoryCta: 'Vamos conversar sobre seu projeto',
    process: 'DO MATERIAL AO ORÇAMENTO', processTitle: 'Sua ideia, com as medidas certas.',
    steps: [
      { title: 'Escolha o material', text: 'Explore transparência, cores e acabamentos no catálogo.' },
      { title: 'Informe as medidas', text: 'Adicione dimensões, espessura desejada e quantidade. Veja a área calculada.' },
      { title: 'Prepare sua consulta', text: 'Reúna os itens e o destino. Preços, viabilidade e frete dependem de confirmação.' },
    ],
    faq: 'ANTES DE COMEÇAR', faqTitle: 'Vamos tirar suas dúvidas.',
    questions: [
      { question: 'Qual acrílico combina com o meu projeto?', answer: 'Comece pelo efeito desejado: transparência, passagem de luz, cor sólida ou reflexo. A aplicação e as condições de uso também importam. Envie essas informações junto com as medidas para avaliar o material e a espessura adequados.' },
      { question: 'Posso pedir cortes e personalização?', answer: 'Sim. A Acrilchapas oferece corte sob medida, gravação a laser e personalização. Informe as dimensões e explique o acabamento ou desenho desejado. A fábrica precisa confirmar a viabilidade antes da produção.' },
      { question: 'Como cuidar das chapas de acrílico?', answer: 'Use um pano macio e evite materiais abrasivos. O acrílico pode riscar: confirme os produtos e o método de limpeza adequados para o acabamento escolhido.' },
      { question: 'Vocês entregam em outras regiões?', answer: 'A Acrilchapas informa atendimento com entregas em todo o Brasil. O prazo e o frete variam conforme o destino, o volume e a personalização. Para projetos fora do Brasil, consulte as condições de fornecimento e documentação.' },
      { question: 'O orçamento no site já confirma uma compra?', answer: 'Não. Este é o site de demonstração. Você pode montar uma consulta com materiais e medidas, baixar o arquivo ou salvá-la no ambiente de teste. Não há cobrança nem reserva de material real. Especificações, valores e condições comerciais exigem confirmação.' },
    ],
    contactLabel: 'TEM UMA IDEIA EM MENTE?', contactTitle: 'Vamos criar o próximo projeto.',
    contactText: 'Escolha seus materiais ou converse com a Acrilchapas sobre o que você precisa.', contactCta: 'Explorar e pedir orçamento',
  },
  en: {
    catalog: 'Catalog', heroIntro: 'CAST ACRYLIC · FACTORY DIRECT', heroTitle: 'Shape your ideas.', heroAccent: 'Create possibilities.',
    heroText: 'Transparency, color, and imagination. Acrylic sheets that turn what you envision into what your project needs.',
    heroAlt: 'Blue, red, green, and amber acrylic sheets with polished transparent edges',
    photoCaption: 'The beginning of a new idea.', photoDetail: 'COLOR · LIGHT · MATERIAL',
    collection: 'FIND YOUR STARTING POINT', collectionTitle: 'One material. Many expressions.',
    collectionText: 'Explore acrylic families and discover the effect that suits your project.',
    finderTitle: 'What effect are you looking for?', finderText: 'Choose a starting point. Final properties depend on color, thickness, and application.',
    needs: { crystal: 'Transparency', translucent: 'Light transmission', opaque: 'Solid color', colored: 'More color', mirror: 'Reflections' },
    uses: { crystal: 'Explore for displays, showcases, and transparent parts.', translucent: 'Explore light, color, and visual effects.', opaque: 'Explore for lettering, signage, and solid-color pieces.', colored: 'Explore for interiors, visual communication, and design.', mirror: 'Explore reflections in interiors and decorative details.' },
    reference: 'Images from the official collection. Confirm colors and finishes with a physical sample.',
    applications: 'FROM SHEET TO YOUR NEXT CREATION', applicationsTitle: 'Let your project lead the way.',
    applicationsText: 'Every idea calls for a combination of material, finish, and dimensions. Start with your application.', exploreApplication: 'Explore this material',
    projects: [
      { title: 'Architecture & interiors', description: 'Details that change the way a space feels. Explore acrylic for furniture, decorative elements, and colorful compositions.', tags: ['Interiors', 'Furniture', 'Design'], family: 'colored', image: 'colored' },
      { title: 'Visual communication', description: 'Give your brand a presence. Transparency and color for displays, lettering, showcases, and signage.', tags: ['Displays', 'Lettering', 'Signage'], family: 'opaque', image: 'opaque' },
      { title: 'Industry & fabrication', description: 'Raw material is just the beginning. Discuss sheets, cutting, and fabrication details for your project’s parts and components.', tags: ['Parts', 'Components', 'Custom cutting'], family: 'crystal', image: 'crystal' },
    ],
    factory: 'FROM ATIBAIA TO YOUR PROJECT', factoryTitle: 'Ideas take shape. Here at our factory.',
    factoryText: 'We manufacture CAST acrylic sheets. From material selection to customization, Acrilchapas connects the people who create with the people who make.',
    factoryAlt: 'Acrilchapas production floor with roller tables and industrial equipment', factoryDetailAlt: 'Team and equipment at the Acrilchapas factory in Atibaia',
    services: [
      { title: 'CAST manufacturing', text: 'Acrylic sheets across different color and finish families.' },
      { title: 'Cutting & customization', text: 'Custom cutting and laser engraving, subject to project review.' },
      { title: 'Delivery across Brazil', text: 'Ask about shipping and timing for your destination and inquiry.' },
    ], factoryCta: 'Let’s talk about your project',
    process: 'FROM MATERIAL TO QUOTATION', processTitle: 'Your idea, in the right dimensions.',
    steps: [
      { title: 'Choose a material', text: 'Explore transparency, colors, and finishes in the catalog.' },
      { title: 'Enter your dimensions', text: 'Add dimensions, requested thickness, and quantity. See the calculated area.' },
      { title: 'Prepare your inquiry', text: 'Gather your items and destination. Prices, feasibility, and shipping need confirmation.' },
    ],
    faq: 'BEFORE YOU BEGIN', faqTitle: 'Let’s clear things up.',
    questions: [
      { question: 'Which acrylic suits my project?', answer: 'Start with the effect you want: transparency, light transmission, solid color, or reflection. Application and conditions of use also matter. Share these details with your dimensions to assess a suitable material and thickness.' },
      { question: 'Can I request cutting and customization?', answer: 'Yes. Acrilchapas offers custom cutting, laser engraving, and customization. Share your dimensions and describe the finish or design you need. The factory must confirm feasibility before production.' },
      { question: 'How should I care for acrylic sheets?', answer: 'Use a soft cloth and avoid abrasive materials. Acrylic can scratch: confirm the appropriate cleaning products and method for your chosen finish.' },
      { question: 'Do you deliver to other regions?', answer: 'Acrilchapas offers delivery throughout Brazil. Timing and freight depend on destination, volume, and customization. For projects outside Brazil, discuss supply terms and documentation with the team.' },
      { question: 'Does a website quote confirm a purchase?', answer: 'No. This is the demonstration website. You can prepare a material and dimension inquiry, download it, or save it in the test environment. No real payment or material reservation takes place. Specifications, prices, and terms require confirmation.' },
    ],
    contactLabel: 'HAVE AN IDEA IN MIND?', contactTitle: 'Let’s create your next project.',
    contactText: 'Choose your materials or talk with Acrilchapas about what you need.', contactCta: 'Explore and request a quote',
  },
  es: {
    catalog: 'Catálogo', heroIntro: 'ACRÍLICO CAST · DIRECTO DE FÁBRICA', heroTitle: 'Dale forma.', heroAccent: 'Crea posibilidades.',
    heroText: 'Transparencia, color e imaginación. Planchas de acrílico para transformar lo que imaginas en lo que tu proyecto necesita.',
    heroAlt: 'Planchas de acrílico azul, rojo, verde y ámbar con bordes pulidos y transparentes',
    photoCaption: 'El comienzo de una nueva idea.', photoDetail: 'COLOR · LUZ · MATERIA',
    collection: 'ENCUENTRA TU PUNTO DE PARTIDA', collectionTitle: 'Un material. Muchas expresiones.',
    collectionText: 'Conoce las familias de acrílico y descubre el efecto que combina con tu proyecto.',
    finderTitle: '¿Qué efecto estás buscando?', finderText: 'Elige un punto de partida. Las características finales dependen del color, el espesor y la aplicación.',
    needs: { crystal: 'Transparencia', translucent: 'Paso de luz', opaque: 'Color sólido', colored: 'Más color', mirror: 'Reflejos' },
    uses: { crystal: 'Para explorar en displays, expositores y piezas transparentes.', translucent: 'Para explorar luz, color y efectos visuales.', opaque: 'Para explorar en letras, señalización y piezas de color sólido.', colored: 'Para explorar en decoración, comunicación visual y diseño.', mirror: 'Para explorar reflejos en interiores y detalles decorativos.' },
    reference: 'Imágenes del archivo oficial. Confirma los colores y acabados con una muestra física.',
    applications: 'DE LA PLANCHA A TU PRÓXIMA CREACIÓN', applicationsTitle: 'Tu proyecto marca el camino.',
    applicationsText: 'Cada idea requiere una combinación de material, acabado y medidas. Empieza por tu aplicación.', exploreApplication: 'Explorar este material',
    projects: [
      { title: 'Arquitectura e interiores', description: 'Detalles que cambian la percepción de un espacio. Explora el acrílico en muebles, elementos decorativos y composiciones de color.', tags: ['Decoración', 'Muebles', 'Diseño'], family: 'colored', image: 'colored' },
      { title: 'Comunicación visual', description: 'Dale presencia a tu marca. Transparencia y color para displays, letras, expositores y señalización.', tags: ['Displays', 'Letras', 'Señalización'], family: 'opaque', image: 'opaque' },
      { title: 'Industria y transformación', description: 'La materia prima es solo el comienzo. Consulta sobre planchas, cortes y detalles de fabricación para las piezas y componentes de tu proyecto.', tags: ['Piezas', 'Componentes', 'Corte a medida'], family: 'crystal', image: 'crystal' },
    ],
    factory: 'DE ATIBAIA A TU PROYECTO', factoryTitle: 'Las ideas toman forma. Aquí en la fábrica.',
    factoryText: 'Fabricamos planchas de acrílico CAST. Desde la elección del material hasta la personalización, Acrilchapas conecta a quienes crean con quienes producen.',
    factoryAlt: 'Área de producción de Acrilchapas con mesas de rodillos y equipos industriales', factoryDetailAlt: 'Equipo y maquinaria en la fábrica Acrilchapas de Atibaia',
    services: [
      { title: 'Fabricación CAST', text: 'Planchas de acrílico en distintas familias de color y acabado.' },
      { title: 'Corte y personalización', text: 'Corte a medida y grabado láser, sujetos a evaluación del proyecto.' },
      { title: 'Envíos en Brasil', text: 'Consulta el transporte y los plazos para tu destino y solicitud.' },
    ], factoryCta: 'Hablemos de tu proyecto',
    process: 'DEL MATERIAL A LA COTIZACIÓN', processTitle: 'Tu idea, con las medidas correctas.',
    steps: [
      { title: 'Elige el material', text: 'Explora transparencias, colores y acabados en el catálogo.' },
      { title: 'Indica las medidas', text: 'Añade dimensiones, espesor deseado y cantidad. Consulta el área calculada.' },
      { title: 'Prepara tu solicitud', text: 'Reúne los artículos y el destino. Precios, viabilidad y flete requieren confirmación.' },
    ],
    faq: 'ANTES DE EMPEZAR', faqTitle: 'Resolvamos tus dudas.',
    questions: [
      { question: '¿Qué acrílico combina con mi proyecto?', answer: 'Empieza por el efecto deseado: transparencia, paso de luz, color sólido o reflejo. La aplicación y las condiciones de uso también importan. Comparte esos detalles con tus medidas para evaluar el material y espesor adecuados.' },
      { question: '¿Puedo solicitar cortes y personalización?', answer: 'Sí. Acrilchapas ofrece corte a medida, grabado láser y personalización. Indica las dimensiones y describe el acabado o diseño deseado. La fábrica debe confirmar la viabilidad antes de producir.' },
      { question: '¿Cómo cuidar las planchas de acrílico?', answer: 'Usa un paño suave y evita materiales abrasivos. El acrílico puede rayarse: confirma los productos y el método de limpieza adecuados para el acabado elegido.' },
      { question: '¿Hacen entregas en otras regiones?', answer: 'Acrilchapas informa entregas en todo Brasil. El plazo y el flete dependen del destino, volumen y personalización. Para proyectos fuera de Brasil, consulta las condiciones de suministro y documentación.' },
      { question: '¿La cotización en el sitio confirma una compra?', answer: 'No. Este es el sitio de demostración. Puedes preparar una consulta con materiales y medidas, descargarla o guardarla en el entorno de prueba. No se realizan cobros ni reservas de material real. Las especificaciones, precios y condiciones requieren confirmación.' },
    ],
    contactLabel: '¿TIENES UNA IDEA EN MENTE?', contactTitle: 'Creemos tu próximo proyecto.',
    contactText: 'Elige tus materiales o habla con Acrilchapas sobre lo que necesitas.', contactCta: 'Explorar y solicitar cotización',
  },
};
