# ♻️ Recicla SJP — Coleta Seletiva, Educação Ambiental e Economia Circular

![Status do Projeto](https://img.shields.io/badge/Status-Concluído%20%26%20Ativo-047857?style=for-the-badge)
![Acessibilidade](https://img.shields.io/badge/Acessibilidade-WCAG%202.1%20AA-0284c7?style=for-the-badge)
![ODS ONU](https://img.shields.io/badge/ONU-ODS%2011%20%26%2012-d97706?style=for-the-badge)
![Tecnologias](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JS%20Vanilla-0f172a?style=for-the-badge)

> **Conectando cidadãs e cidadãos, valorizando catadoras e catadores, otimizando a coleta seletiva e reduzindo o impacto ambiental em São José dos Pinhais (PR) por meio da tecnologia aberta, acessível e da economia circular.**

---

## 📋 Sumário

1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Impacto Social, Ambiental e Alinhamento com a ONU](#-impacto-social-ambiental-e-alinhamento-com-a-onu)
3. [Compromisso com a Inclusão e Acessibilidade (a11y)](#-compromisso-com-a-inclusão-e-acessibilidade-a11y)
4. [Funcionalidades Detalhadas](#-funcionalidades-detalhadas)
5. [Iniciativas Locais e Bairros Sustentáveis](#-iniciativas-locais-e-bairros-sustentáveis)
6. [Arquitetura, Desempenho e Tecnologias](#-arquitetura-desempenho-e-tecnologias)
7. [Estrutura de Arquivos](#-estrutura-de-arquivos)
8. [Como Executar Localmente](#-como-executar-localmente)
9. [Como Publicar no GitHub Pages](#-como-publicar-no-github-pages)
10. [Como Contribuir](#-como-contribuir)
11. [Créditos e Contexto Acadêmico](#-créditos-e-contexto-acadêmico)

---

## 🌍 Sobre o Projeto

O **Recicla SJP** é uma plataforma web interativa, gratuita e de código aberto desenvolvida para facilitar o acesso da população de **São José dos Pinhais e Região Metropolitana de Curitiba (RMC)** às informações sobre gestão de resíduos sólidos, dias de coleta domiciliar, pontos de entrega voluntária (Ecopontos/PEVs) e projetos sociais de economia circular.

Mais do que um portal informativo, o projeto nasceu com a missão de **democratizar a educação ambiental**: transformar dados técnicos sobre reciclagem e logística reversa em uma experiência visual, gamificada, acolhedora e compreensível para pessoas de todas as idades, níveis de escolaridade e condições de acesso tecnológico.

---

## 🎯 Impacto Social, Ambiental e Alinhamento com a ONU

O projeto apoia diretamente diretrizes globais e nacionais de sustentabilidade e inclusão produtiva:

* **🏙️ ODS 11 (Cidades e Comunidades Sustentáveis):** Redução do impacto ambiental negativo per capita das cidades, melhorando a gestão de resíduos municipais e o acesso a espaços verdes e seguros.
* **🔄 ODS 12 (Consumo e Produção Responsáveis):** Redução substancial da geração de resíduos por meio da prevenção, redução, reciclagem e reúso (*Upcycling*).
* **⚖️ Política Nacional de Resíduos Sólidos (Lei nº 12.305/2010):** Incentivo à segregação na fonte, à logística reversa obrigatória (pilhas, baterias, lâmpadas, medicamentos, óleo e eletroeletrônicos) e à **inclusão socioprodutiva de cooperativas e associações de catadoras e catadores**.

---

## 🤝 Compromisso com a Inclusão e Acessibilidade (a11y)

O **Recicla SJP** foi projetado sob o princípio do **Desenho Universal**, garantindo que todas as pessoas possam navegar, aprender e utilizar as ferramentas da plataforma sem barreiras:

### 1. Acessibilidade Visual e Cognitiva
* **Alto Contraste e Modo Escuro Adaptativo:** Suporte nativo ao tema claro e escuro (`prefers-color-scheme`), com persistência de escolha e paleta de cores calibrada para legibilidade.
* **Dupla Codificação Visual (Cores CONAMA + Ícones + Rótulos):** Nenhuma informação depende exclusivamente da cor. Todas as lixeiras e categorias combinam a cor oficial do CONAMA com emojis descritivos e o nome da cor por extenso (ex.: `🔴 Plásticos (Vermelho)`), garantindo total compreensão para **pessoas com daltonismo** ou baixa visão.
* **Linguagem Clara e Didática:** Explicações diretas sobre o *porquê* cada material pode ou não ser reciclado, com dicas práticas de segurança (como embalar vidros quebrados para proteger os coletores).

### 2. Acessibilidade Motora e Navegação por Teclado
* **Áreas de Toque Ampliadas:** Todos os botões, seletores e controles interativos possuem altura mínima de `44px × 44px` (padrão WCAG), facilitando o uso por pessoas idosas ou com limitações motoras finas em celulares e computadores.
* **Navegação 100% via Teclado:** Presença do atalho **"Pular para o conteúdo"** (`.pular-conteudo`) logo no início da página, indicadores visuais nítidos de foco (`:focus-visible`), suporte à tecla `Esc` para fechar janelas modais e restauração automática de foco.

### 3. Leitores de Tela e Sensibilidade Vestibular
* **Semântica HTML5 e WAI-ARIA:** Uso de regiões semânticas (`<nav>`, `<main>`, `<section>`, `<article>`, `role="dialog"`, `aria-modal="true"`), textos alternativos em imagens e regiões dinâmicas com `aria-live="polite"` para anunciar atualizações de resultados de coleta e feedback do quiz.
* **Respeito ao Movimento Reduzido (`prefers-reduced-motion`):** Para pessoas neurodivergentes, com epilepsia fotossensível ou distúrbios vestibulares/labirintite, o sistema desativa automaticamente animações contínuas e transições bruscas quando essa preferência está ativa no dispositivo.

### 4. Inclusão Digital (Baixo Consumo de Dados)
* **Arquitetura Leve e Zero Dependências Pesadas:** Funciona até em conexões móveis lentas (3G/4G) e dispositivos de entrada. Os efeitos sonoros são sintetizados em tempo real via **Web Audio API**, sem baixar nenhum arquivo `.mp3` ou `.wav`.

---

## ✨ Funcionalidades Detalhadas

### 1. ⏰ Relógio do Desperdício em Tempo Real (2026)
Painel interativo que calcula, segundo a segundo, as estimativas de resíduos de São José dos Pinhais:
* **Filtros temporais:** *Ano 2026*, *Este Mês* e *Hoje*.
* **Indicadores monitorados:**
  * **Lixo Total Aterrado** (~330 toneladas/dia no município).
  * **Recicláveis Perdidos** (~32,6% de materiais recicláveis misturados indevidamente ao lixo comum).
  * **Caminhões Equivalentes** (cargas compactadas de 12 toneladas).
  * **Potencial Econômico Desperdiçado** (valor de mercado que deixa de gerar renda para cooperativas e economia aos cofres públicos).

### 2. ⚡ Kinetic Storytelling: *"Para onde vai o seu lixo?"*
Infográfico visual animado em CSS puro que compara, lado a lado, os dois destinos possíveis para o descarte doméstico:
* **Caminho do Prejuízo (Misturado / Aterro):** Poluição do solo e da água, desperdício de recursos e alto custo em impostos públicos.
* **Caminho da Oportunidade (Separado / Indústria & Cooperativas):** Geração de matéria-prima, trabalho e renda para famílias locais, além de incentivos de economia circular.

### 3. 🚚 Agenda de Coleta Domiciliar por Bairro
Consulta instantânea dos dias de **Lixo Comum (Rejeito)** e **Coleta Seletiva** em mais de **40 bairros e localidades rurais/urbanas de São José dos Pinhais**:
* Seletor completo em ordem alfabética + **atalhos rápidos de 1 clique** para os bairros mais populosos (*Centro, Afonso Pena, Borda do Campo, Guatupê, Boneca do Iguaçu, São Marcos, Costeira, Cidade Jardim, Cruzeiro e Águas Belas*).
* **Alerta Inteligente de Dia:** Identifica automaticamente o dia da semana atual no dispositivo e exibe selos dinâmicos:
  * `🚨 HOJE! Coloque para fora`
  * `⏰ AMANHÃ! Prepare o descarte`
  * `📅 Programada`

### 4. 🗺️ Mapa Interativo de Ecopontos, PEVs e Cooperativas
Mapa integrado com **Leaflet.js** e camadas abertas da Esri/OpenStreetMap:
* **Filtros por Categoria:**
  * `🌟 Todos os Pontos`
  * `📦 Ecopontos (PEVs)`
  * `🔋 Óleo de Cozinha & Baterias`
  * `🤝 Cooperativas e Associações de Catadores`
* **Geolocalização por GPS (`📍 Encontrar Minha Posição`):** Localiza a pessoa no mapa, identifica a rua e o bairro via geocodificação reversa (Nominatim/OSM) e sincroniza automaticamente o calendário de coleta daquele setor, além de oferecer rota direta pelo Google Maps (`Como Chegar ↗`).

### 5. 🔍 Guia de Descarte CONAMA & Linha do Tempo da Decomposição
* **Dicionário Interativo de Resíduos:** Filtra dezenas de itens do cotidiano pelas 6 categorias de cores CONAMA (*Plásticos, Papel & Papelão, Vidros, Metais, Especiais/Logística Reversa e Orgânico/Rejeito*) ou por busca livre em tempo real (ex.: *caixa de leite, isopor, blister de remédio, espelho, cápsula de café*).
* **Carrossel de Tempo de Decomposição:** Compara o tempo de degradação na natureza (de meses a mais de 4.000 anos) com a solução imediata proporcionada pela reciclagem ou compostagem.

### 6. 🎮 Desafio da Reciclagem (Quiz Gamificado + Certificado)
Jogo educativo de 6 etapas com feedback sonoro e explicação técnica detalhada a cada resposta:
* Explica o motivo químico/industrial de casos que geram dúvida (como caixa de pizza engordurada, isopor limpo, espelho quebrado e cartelas de comprimido).
* **🏅 Certificado de Mérito Ambiental Personalizável:** Ao concluir o desafio acertando todas as questões (**6 de 6 acertos**), o sistema libera a emissão gratuita de um **Certificado de Mérito Ambiental** pronto para personalizar com o nome da pessoa ou instituição e salvar em **PDF / Imprimir** (formatado automaticamente via `@media print`).

---

## 🌱 Iniciativas Locais e Bairros Sustentáveis

A seção **Bairros Sustentáveis** destaca projetos reais de **Economia Circular, Upcycling e Inclusão Social** que atuam nos bairros de São José dos Pinhais, conectando grandes indústrias à comunidade local com cursos gratuitos e geração de renda:

| Iniciativa / Projeto | Bairro em SJP | Parceria / Realização | Foco Social e Ambiental |
| :--- | :--- | :--- | :--- |
| **Associação Borda Viva** | Borda do Campo | Renault do Brasil | Upcycling de tecidos automotivos e cintos de segurança em bolsas e mochilas; cursos gratuitos de costura, panificação e empreendedorismo feminino. |
| **Geração Futuro Jovens Talentos** | Borda do Campo | Instituto Renault | Formação profissional gratuita para jovens (14 a 24 anos) em logística reversa, cadeia verde, gestão administrativa e tecnologia. |
| **Projeto Cores Fora de Tela** | Vila Nova | Amigos do HC, Alpha Química, Schattdecor & Alvorada | Oficinas gratuitas de ilustração e arte no contraturno escolar (Escola Mun. Profª Terezinha Toczek) com foco no uso consciente de telas e inclusão em Libras. |
| **Apoio Comunitário à Infância** | Afonso Pena / Parque da Fonte | GEMÜ do Brasil | Melhorias estruturais e manutenção de CMEIs municipais, doação de alimentos, itens de higiene e materiais didáticos. |
| **Programa Novos Empreendedores** | Roseira de São Sebastião | Horse Powertrain | Capacitação de empreendedores locais, oficinas de educação ambiental e mentoria voluntária com engenheiros da fábrica. |

---

## ⚡ Arquitetura, Desempenho e Tecnologias

O projeto foi construído utilizando tecnologias web padrões (**Vanilla Web Stack**), garantindo máxima longevidade, facilidade de manutenção e alto desempenho:

* **HTML5 Semântico:** Meta tags de SEO, Open Graph (`og:title`, `og:description`, `og:locale`) e estruturado para acessibilidade.
* **CSS3 Moderno (Design Tokens):** Variáveis nativas (`--bg-page`, `--accent`, etc.), `clamp()` para tipografia fluida responsiva, `scroll-snap-type` para carrosséis nativos suaves no toque e suporte completo a impressão (`@media print`).
* **JavaScript (ES6+):**
  * **Lazy Loading do Mapa (`IntersectionObserver`):** O mapa Leaflet só inicializa e baixa os blocos de imagem quando o usuário rola a página até a seção correspondente.
  * **Pausa Inteligente de Animações Fora da Tela:** As animações do cabeçalho são pausadas automaticamente quando saem do campo de visão, economizando bateria e processamento (CPU/GPU) em smartphones.
  * **Listener de Scroll com `requestAnimationFrame`:** Atualização fluida a 60fps da barra de progresso de leitura e da barra de navegação.
  * **Segurança (Anti-XSS):** Sanitização de strings dinâmicas (`escapeHtml`) antes da renderização no DOM.
* **Bibliotecas Externas (via CDN com `defer`):**
  * [Leaflet.js 1.9.4](https://leafletjs.com/) — Renderização de mapas interativos.
  * [Canvas Confetti 1.6.0](https://www.kirilv.com/canvas-confetti/) — Celebração visual ao atingir pontuação máxima no Quiz.

---

## 📂 Estrutura de Arquivos

```text
recicla-sjp/
├── index.html               # Página principal (modular, recomendada para desenvolvimento e GitHub Pages)
├── recicla-sjp-unico.html   # Versão standalone (HTML + CSS + JS em um único arquivo portátil)
├── README.md                # Documentação detalhada do projeto
├── css/
│   └── style.css            # Design System, temas claro/escuro, animações e responsividade
└── js/
    └── script.js            # Lógica do relógio, agenda, mapa Leaflet, dicionário, quiz e áudio
```

---

## 💻 Como Executar Localmente

O projeto não exige instalação de dependências (`npm`, `node_modules` ou banco de dados).

1. **Clone ou baixe este repositório:**
   ```bash
   git clone https://github.com/SEU-USUARIO/recicla-sjp.git
   ```
2. **Abra o arquivo `index.html`:**
   * Basta dar dois cliques no arquivo `index.html` para abri-lo em qualquer navegador moderno (Chrome, Safari, Firefox, Edge).
   * *(Opcional)* Para testar recursos como geolocalização GPS em ambiente de servidor local, você pode usar a extensão **Live Server** no VS Code ou executar:
     ```bash
     python3 -m http.server 8000
     ```
     E acessar `http://localhost:8000` no navegador.

---

## 🚀 Como Publicar no GitHub Pages

1. Suba os arquivos deste projeto para um repositório **Público** no seu GitHub (pelo **GitHub Desktop** ou navegador).
2. No repositório do GitHub, acesse a aba **Settings** (Configurações ⚙️).
3. No menu lateral esquerdo, clique em **Pages**.
4. Em **Build and deployment** $\rightarrow$ **Branch**, selecione a branch **`main`** e a pasta **`/ (root)`**, e clique em **Save**.
5. Aguarde cerca de 1 a 2 minutos e acesse a URL gerada:
   ```text
   https://SEU-USUARIO.github.io/recicla-sjp/
   ```

---

## 🤗 Como Contribuir

Contribuições da comunidade, de escolas, cooperativas e moradores de São José dos Pinhais são muito bem-vindas! Você pode ajudar:
* **Atualizando dias de coleta ou novos Ecopontos (PEVs):** Edite os objetos `coletasSJP` ou `locaisColetaSJP` no arquivo `js/script.js`.
* **Sugerindo novos itens para o Guia de Descarte:** Adicione novos materiais no array `baseResiduos` em `js/script.js`.
* **Divulgando novos projetos sociais nos bairros:** Abra uma *Issue* ou *Pull Request* com informações sobre iniciativas comunitárias de sustentabilidade em SJP.

---

## 🎓 Créditos e Contexto Acadêmico

* **Projeto de Extensão:** PIEX III — Gestão de Produção Industrial
* **Instituição:** Centro Universitário UniDomBosco (2026)
* **Autor / Pesquisador Responsável:** Diego Francisco dos Santos (RA: 25204862)
* **Localidade Foco:** São José dos Pinhais — Paraná, Brasil

---

<p align="center">
  Feito com 💚 e compromisso socioambiental para a comunidade de <strong>São José dos Pinhais (PR)</strong>.
</p>
