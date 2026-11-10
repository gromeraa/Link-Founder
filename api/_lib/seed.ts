/**
 * Dados iniciais do Link Founder.
 * São gravados no banco apenas UMA vez, no primeiro acesso, quando ele ainda está vazio.
 * Depois disso, tudo é editado pelo próprio site.
 */
import type { Library } from './types.js';

export const SEED: Library = {
  "collections": [
    {
      "id": "repositorios",
      "name": "Repositórios úteis",
      "description": "Repositórios e listas do GitHub para estudar e consultar.",
      "icon": "github",
      "color": "gray",
      "order": 0
    },
    {
      "id": "empresas",
      "name": "Empresas",
      "description": "Sites das empresas e clientes com quem trabalho.",
      "icon": "building",
      "color": "teal",
      "order": 1
    },
    {
      "id": "ia",
      "name": "IA & Ferramentas",
      "description": "Assistentes, geradores e ferramentas de inteligência artificial.",
      "icon": "sparkles",
      "color": "purple",
      "order": 2
    },
    {
      "id": "mockups",
      "name": "Mockups",
      "description": "Mockups de dispositivos, telas e apresentações.",
      "icon": "smartphone",
      "color": "orange",
      "order": 3
    },
    {
      "id": "design",
      "name": "Ideias de design",
      "description": "Galerias, referências e inspiração para interfaces.",
      "icon": "palette",
      "color": "pink",
      "order": 4
    }
  ],
  "links": [
    {
      "id": "awesome",
      "url": "https://github.com/sindresorhus/awesome",
      "title": "Awesome",
      "description": "A lista das listas: coleções curadas sobre praticamente qualquer assunto de tecnologia.",
      "collection": "repositorios",
      "tags": [
        "listas",
        "referência"
      ],
      "addedAt": "2026-11-01",
      "favorite": true
    },
    {
      "id": "public-apis",
      "url": "https://github.com/public-apis/public-apis",
      "title": "Public APIs",
      "description": "Centenas de APIs gratuitas organizadas por categoria para usar em projetos.",
      "collection": "repositorios",
      "tags": [
        "api",
        "projetos"
      ],
      "addedAt": "2026-10-28"
    },
    {
      "id": "developer-roadmap",
      "url": "https://github.com/kamranahmedse/developer-roadmap",
      "title": "Developer Roadmap",
      "description": "Trilhas visuais de estudo para frontend, backend, DevOps e outras áreas.",
      "collection": "repositorios",
      "tags": [
        "estudos",
        "carreira"
      ],
      "addedAt": "2026-10-20"
    },
    {
      "id": "free-programming-books",
      "url": "https://github.com/EbookFoundation/free-programming-books",
      "title": "Free Programming Books",
      "description": "Livros, cursos e materiais de programação gratuitos, inclusive em português.",
      "collection": "repositorios",
      "tags": [
        "estudos",
        "livros"
      ],
      "addedAt": "2026-10-12"
    },
    {
      "id": "claude",
      "url": "https://claude.ai",
      "title": "Claude",
      "description": "Assistente de IA da Anthropic para escrita, código, análise e pesquisa.",
      "collection": "ia",
      "tags": [
        "assistente",
        "código"
      ],
      "addedAt": "2026-11-09",
      "favorite": true
    },
    {
      "id": "stitch",
      "url": "https://stitch.withgoogle.com",
      "title": "Stitch",
      "description": "Gera telas de interface a partir de texto e exporta HTML e Figma.",
      "collection": "ia",
      "tags": [
        "ui",
        "prototipagem"
      ],
      "addedAt": "2026-11-08"
    },
    {
      "id": "notebooklm",
      "url": "https://notebooklm.google.com",
      "title": "NotebookLM",
      "description": "Converse com seus PDFs e anotações e gere resumos em áudio.",
      "collection": "ia",
      "tags": [
        "estudos",
        "pesquisa"
      ],
      "addedAt": "2026-11-02"
    },
    {
      "id": "perplexity",
      "url": "https://www.perplexity.ai",
      "title": "Perplexity",
      "description": "Buscador com IA que responde citando as fontes.",
      "collection": "ia",
      "tags": [
        "pesquisa"
      ],
      "addedAt": "2026-10-30"
    },
    {
      "id": "huggingface",
      "url": "https://huggingface.co",
      "title": "Hugging Face",
      "description": "Modelos, datasets e demos abertos de machine learning.",
      "collection": "ia",
      "tags": [
        "modelos",
        "open source"
      ],
      "addedAt": "2026-10-18"
    },
    {
      "id": "shots",
      "url": "https://shots.so",
      "title": "Shots",
      "description": "Cria mockups bonitos de screenshots em segundos, direto no navegador.",
      "collection": "mockups",
      "tags": [
        "screenshot",
        "grátis"
      ],
      "addedAt": "2026-11-05",
      "favorite": true
    },
    {
      "id": "mockuuups",
      "url": "https://mockuuups.studio",
      "title": "Mockuuups Studio",
      "description": "Milhares de cenas de dispositivos para apresentar apps e sites.",
      "collection": "mockups",
      "tags": [
        "dispositivos"
      ],
      "addedAt": "2026-10-25"
    },
    {
      "id": "ls-graphics",
      "url": "https://www.ls.graphics",
      "title": "LS Graphics",
      "description": "Mockups em alta qualidade para Figma, Photoshop e Sketch.",
      "collection": "mockups",
      "tags": [
        "figma",
        "psd"
      ],
      "addedAt": "2026-10-15"
    },
    {
      "id": "mockupworld",
      "url": "https://www.mockupworld.co",
      "title": "Mockup World",
      "description": "Mockups gratuitos e fotorrealistas para branding e embalagens.",
      "collection": "mockups",
      "tags": [
        "grátis",
        "branding"
      ],
      "addedAt": "2026-10-02"
    },
    {
      "id": "hig",
      "url": "https://developer.apple.com/design/human-interface-guidelines",
      "title": "Human Interface Guidelines",
      "description": "As diretrizes oficiais da Apple para projetar apps em todas as plataformas.",
      "collection": "design",
      "tags": [
        "apple",
        "guia"
      ],
      "addedAt": "2026-11-10",
      "favorite": true
    },
    {
      "id": "mobbin",
      "url": "https://mobbin.com",
      "title": "Mobbin",
      "description": "Biblioteca de telas e fluxos reais de apps iOS, Android e web.",
      "collection": "design",
      "tags": [
        "mobile",
        "ui"
      ],
      "addedAt": "2026-11-04"
    },
    {
      "id": "godly",
      "url": "https://godly.website",
      "title": "Godly",
      "description": "Galeria de sites com animações e direção de arte marcantes.",
      "collection": "design",
      "tags": [
        "web",
        "animação"
      ],
      "addedAt": "2026-10-27"
    },
    {
      "id": "dribbble",
      "url": "https://dribbble.com",
      "title": "Dribbble",
      "description": "Comunidade de designers mostrando shots de UI, ilustração e marca.",
      "collection": "design",
      "tags": [
        "comunidade",
        "ui"
      ],
      "addedAt": "2026-10-10"
    },
    {
      "id": "land-book",
      "url": "https://land-book.com",
      "title": "Land-book",
      "description": "Inspiração de landing pages organizada por estilo e segmento.",
      "collection": "design",
      "tags": [
        "landing page",
        "web"
      ],
      "addedAt": "2026-09-30"
    }
  ]
};
