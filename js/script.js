// Acesso seguro ao localStorage (evita erro em modo privado ou arquivo local)
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignora */ } };

// Escapa caracteres especiais para evitar XSS em innerHTML
function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==========================================
// 0. EFEITOS SONOROS (WEB AUDIO API - 100% OFFLINE & ZERO ASSETS)
// ==========================================
let somAtivo = lsGet('reciclaSjp_som') !== 'false';
let audioCtx = null;

function obterAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function tocarSom(tipo) {
    if (!somAtivo) return;
    try {
        const ctx = obterAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const agora = ctx.currentTime;

        if (tipo === 'acerto') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, agora); // Dó5
            osc.frequency.exponentialRampToValueAtTime(783.99, agora + 0.15); // Sol5
            gain.gain.setValueAtTime(0.18, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.25);
            osc.start(agora);
            osc.stop(agora + 0.25);
        } else if (tipo === 'erro') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(196, agora); // Sol3
            osc.frequency.linearRampToValueAtTime(130.81, agora + 0.2); // Dó3
            gain.gain.setValueAtTime(0.12, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.22);
            osc.start(agora);
            osc.stop(agora + 0.22);
        } else if (tipo === 'clique') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, agora);
            osc.frequency.exponentialRampToValueAtTime(400, agora + 0.05);
            gain.gain.setValueAtTime(0.08, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.05);
            osc.start(agora);
            osc.stop(agora + 0.05);
        } else if (tipo === 'fanfarra') {
            const notas = [523.25, 659.25, 783.99, 1046.50];
            notas.forEach((freq, idx) => {
                const subOsc = ctx.createOscillator();
                const subGain = ctx.createGain();
                subOsc.connect(subGain);
                subGain.connect(ctx.destination);
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(freq, agora + idx * 0.1);
                subGain.gain.setValueAtTime(0.15, agora + idx * 0.1);
                subGain.gain.exponentialRampToValueAtTime(0.001, agora + idx * 0.1 + 0.35);
                subOsc.start(agora + idx * 0.1);
                subOsc.stop(agora + idx * 0.1 + 0.35);
            });
        }
    } catch (e) {
        console.warn('AudioContext indisponível:', e);
    }
}

function toggleSom() {
    somAtivo = !somAtivo;
    lsSet('reciclaSjp_som', somAtivo ? 'true' : 'false');
    atualizarBotaoSom();
    if (somAtivo) tocarSom('clique');
}

function atualizarBotaoSom() {
    const btn = document.getElementById('btn-som-toggle');
    if (btn) {
        btn.textContent = somAtivo ? '🔊' : '🔇';
        btn.title = somAtivo ? 'Efeitos sonoros ativados (clique para mutar)' : 'Efeitos sonoros desativados (clique para ativar)';
        btn.setAttribute('aria-label', somAtivo ? 'Som ativado' : 'Som desativado');
    }
}

// ==========================================
// 1. MODO ESCURO COM PERSISTÊNCIA (LOCALSTORAGE)
// ==========================================
function aplicarTemaSalvo() {
    const temaSalvo = lsGet('reciclaSjp_tema');
    const prefereEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (temaSalvo === 'dark' || (!temaSalvo && prefereEscuro)) {
        document.body.classList.add('dark-mode');
        atualizarTextoBotaoTema(true);
    } else {
        document.body.classList.remove('dark-mode');
        atualizarTextoBotaoTema(false);
    }
}

function atualizarTextoBotaoTema(isDark) {
    const btn = document.getElementById('btn-tema-toggle');
    if (btn) {
        btn.textContent = isDark ? '🌙' : '☀️';
        btn.title = isDark ? 'Modo escuro ativado (clique para modo dia)' : 'Modo dia ativado (clique para modo escuro)';
        btn.setAttribute('aria-label', isDark ? 'Modo escuro' : 'Modo dia');
    }
}

function toggleTema() {
    tocarSom('clique');
    const isDark = document.body.classList.toggle('dark-mode');
    lsSet('reciclaSjp_tema', isDark ? 'dark' : 'light');
    atualizarTextoBotaoTema(isDark);
}

// ==========================================
// 2. RELÓGIO DO DESPERDÍCIO EM TEMPO REAL (MULTI-PERÍODO)
// ==========================================
let periodoRelogioAtual = 'ano'; // 'ano', 'mes', 'dia'

function obterTimestampInicioPeriodo(periodo) {
    const agora = new Date();
    if (periodo === 'dia') {
        return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
    } else if (periodo === 'mes') {
        return new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
    }
    return new Date(agora.getFullYear(), 0, 1).getTime();
}

function alternarPeriodoRelogio(periodo, btnClicado) {
    periodoRelogioAtual = periodo;
    tocarSom('clique');

    document.querySelectorAll('.btn-periodo').forEach(b => b.classList.remove('ativo'));
    if (btnClicado) btnClicado.classList.add('ativo');

    atualizarRelogio();
}

function atualizarRelogio() {
    const dataInicio = obterTimestampInicioPeriodo(periodoRelogioAtual);
    const toneladasPorSegundo = 330 / 86400; // ~330 ton/dia coletadas em SJP
    const taxaDesperdicio = 0.326; // 32,6% de recicláveis misturados indevidamente
    const valorPorTonelada = 380; // R$ 380/tonelada de valor de reciclagem + economia de aterro

    const segundosPassados = Math.max(0, (Date.now() - dataInicio) / 1000);
    const totalAterrado = segundosPassados * toneladasPorSegundo;
    const totalDesperdicado = totalAterrado * taxaDesperdicio;
    const caminhoesDesperdicados = Math.floor(totalDesperdicado / 12); // ~12 ton por caminhão trucado
    const prejuizoFinanceiro = totalDesperdicado * valorPorTonelada;

    const elTotal = document.getElementById('contador-total');
    const elRecicla = document.getElementById('contador-reciclaveis');
    const elCaminhoes = document.getElementById('contador-caminhoes');
    const elPrejuizo = document.getElementById('contador-prejuizo');
    
    if (elTotal) elTotal.textContent = totalAterrado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elRecicla) elRecicla.textContent = totalDesperdicado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elCaminhoes) elCaminhoes.textContent = caminhoesDesperdicados.toLocaleString('pt-BR');
    if (elPrejuizo) elPrejuizo.textContent = `R$ ${prejuizoFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function iniciarContadores() {
    atualizarRelogio();
    setInterval(atualizarRelogio, 1000);
}

// ==========================================
// 2.1. CARROSSEL DE DECOMPOSIÇÃO
// ==========================================
function moverCarrossel(direcao) {
    const track = document.getElementById('carrossel-decomposicao');
    if (!track) return;
    tocarSom('clique');
    const larguraSlide = track.querySelector('.insta-slide')?.offsetWidth || 280;
    track.scrollBy({ left: direcao * (larguraSlide + 16), behavior: 'smooth' });
}

function irParaSlide(index) {
    const track = document.getElementById('carrossel-decomposicao');
    const slides = document.querySelectorAll('#carrossel-decomposicao .insta-slide');
    if (!track || !slides[index]) return;
    tocarSom('clique');
    slides[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    atualizarDotsCarrossel(index);
}

function atualizarDotsCarrossel(indexAtivo) {
    const dots = document.querySelectorAll('#carrossel-dots .insta-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('ativo', idx === indexAtivo);
    });
}

function configurarCarrosselInstagram() {
    const track = document.getElementById('carrossel-decomposicao');
    if (!track) return;

    let timeoutScroll = null;
    track.addEventListener('scroll', () => {
        if (timeoutScroll) clearTimeout(timeoutScroll);
        timeoutScroll = setTimeout(() => {
            const scrollLeft = track.scrollLeft;
            const slide = track.querySelector('.insta-slide');
            const larguraSlide = slide ? (slide.offsetWidth + 16) : 1;
            const indexAproximado = Math.round(scrollLeft / larguraSlide);
            atualizarDotsCarrossel(Math.min(Math.max(indexAproximado, 0), 7));
        }, 50);
    }, { passive: true });
}

// ==========================================
// 3. CONSULTA RÁPIDA & DICIONÁRIO DE RESÍDUOS
// ==========================================
const baseResiduos = [
    // PLÁSTICOS
    { nome: "Garrafa PET (Refrigerante/Água)", grupo: "plastico", tipo: "reciclavel", categoria: "Plástico (Lixeira Vermelha)", dica: "100% reciclável! Amasse para economizar espaço e descarte com a tampa rosqueada." },
    { nome: "Bandeja de Isopor (EPS)", grupo: "plastico", tipo: "reciclavel", categoria: "Plástico (Lixeira Vermelha)", dica: "100% reciclável quando limpo. Remova restos orgânicos e etiquetas adesivas pesadas." },
    { nome: "Potes de Iogurte / Margarina (PP)", grupo: "plastico", tipo: "reciclavel", categoria: "Plástico (Lixeira Vermelha)", dica: "Passe uma água de reuso para retirar o excesso e envie para a coleta seletiva." },
    { nome: "Sacolas Plásticas e Plástico Bolha", grupo: "plastico", tipo: "reciclavel", categoria: "Plástico (Lixeira Vermelha)", dica: "Recicláveis! Junte várias sacolas dentro de uma só para facilitar a triagem dos catadores." },
    { nome: "Canudos Plásticos e Copos Descartáveis", grupo: "plastico", tipo: "reciclavel", categoria: "Plástico (Lixeira Vermelha)", dica: "Recicláveis quando limpos, porém prefira copos reutilizáveis no dia a dia." },
    { nome: "Embalagens de Xampu e Detergente (PEAD)", grupo: "plastico", tipo: "reciclavel", categoria: "Plástico (Lixeira Vermelha)", dica: "Altíssimo valor para a indústria de reciclagem de tubos e bombonas." },

    // PAPEL & PAPELÃO
    { nome: "Caixa de Leite (Tetra Pak / Longa Vida)", grupo: "papel", tipo: "reciclavel", categoria: "Papel / Embalagem Multicamada", dica: "Pode reciclar! Escorra o resíduo líquido, desmonte as abas e amasse." },
    { nome: "Caixa de Papelão Ondulado", grupo: "papel", tipo: "reciclavel", categoria: "Papel (Lixeira Azul)", dica: "Desmonte as caixas para economizar espaço nos caminhões e galpões." },
    { nome: "Jornais, Revistas e Folhetos", grupo: "papel", tipo: "reciclavel", categoria: "Papel (Lixeira Azul)", dica: "100% recicláveis. Mantenha secos e sem contato com lixo de banheiro ou comida." },
    { nome: "Papel Sulfite e Folhas de Caderno", grupo: "papel", tipo: "reciclavel", categoria: "Papel (Lixeira Azul)", dica: "Recicláveis mesmo escritos ou impressos. Retire grampos de ferro grandes." },
    { nome: "Caixa de Pizza Engordurada", grupo: "papel", tipo: "rejeito", categoria: "Tampa: Reciclável / Fundo: Orgânico", dica: "A parte com gordura e queijo não recicla (compostagem ou comum); a tampa limpa vai para o reciclável." },
    { nome: "Papel Higiênico e Guardanapo Usado", grupo: "organico", tipo: "rejeito", categoria: "Lixo Comum (Banheiro/Aterro)", dica: "Não recicla. Fibras curtas e contaminação biológica inviabilizam o processo." },

    // VIDROS
    { nome: "Garrafa de Cerveja / Vinho / Refrigerante", grupo: "vidro", tipo: "reciclavel", categoria: "Vidro (Lixeira Verde)", dica: "Reciclabilidade infinita (100% vira vidro novo sem perda). Retire tampas de metal." },
    { nome: "Potes de Vidro de Conserva e Café", grupo: "vidro", tipo: "reciclavel", categoria: "Vidro (Lixeira Verde)", dica: "Enxágue e descarte na coleta de vidro. A tampa de metal vai no metal." },
    { nome: "Cacos e Vidros Quebrados", grupo: "vidro", tipo: "reciclavel", categoria: "Vidro (Lixeira Verde)", dica: "Reciclável! EMBALE OBRIGATORIAMENTE em caixa ou garrafa PET cortada para não ferir o coletor." },
    { nome: "Espelho / Vidro Plano de Janela", grupo: "vidro", tipo: "rejeito", categoria: "PEV Especial / Lixo Comum", dica: "Não vai com garrafas! Espelhos contêm camadas químicas de prata que estragam o forno comum." },
    { nome: "Pratos de Cerâmica / Porcelana / Pyrex", grupo: "vidro", tipo: "rejeito", categoria: "Lixo Comum (Rejeito)", dica: "Não fundem na temperatura do vidro comum. Devem ir no rejeito comum bem embalados." },

    // METAIS
    { nome: "Lata de Alumínio (Cerveja/Refrigerante)", grupo: "metal", tipo: "reciclavel", categoria: "Metal (Lixeira Amarela)", dica: "Campeão de reciclagem no Paraná! Retorna às prateleiras em até 60 dias." },
    { nome: "Latas de Aço (Milho, Molho de Tomate, Atum)", grupo: "metal", tipo: "reciclavel", categoria: "Metal (Lixeira Amarela)", dica: "Lave para retirar restos de comida e empurre a tampa para dentro." },
    { nome: "Cápsula de Café (Alumínio)", grupo: "metal", tipo: "reciclavel", categoria: "Metal (Lixeira Amarela)", dica: "Retire a borra orgânica para suas plantas e coloque a cápsula no metal." },
    { nome: "Papel Alumínio", grupo: "metal", tipo: "reciclavel", categoria: "Metal (Lixeira Amarela)", dica: "Se estiver sem restos pesados de comida, faça uma bolinha e envie ao reciclável." },
    { nome: "Panelas Velhas e Ferragens", grupo: "metal", tipo: "reciclavel", categoria: "Metal / Sucata", dica: "Altíssimo valor para metalúrgicas e fundições locais de SJP." },

    // ESPECIAIS & ELETRÔNICOS
    { nome: "Blister de Remédio (Cartela de Comprimido)", grupo: "especial", tipo: "especial", categoria: "Logística Reversa / Farmácia", dica: "Plástico com alumínio fundido. Leve às farmácias de SJP para descarte ambiental correto." },
    { nome: "Pilhas e Baterias", grupo: "especial", tipo: "especial", categoria: "Logística Reversa Obrigatória", dica: "Contêm metais pesados tóxicos. Descarte em urnas de supermercados ou na Sec. Meio Ambiente." },
    { nome: "Óleo de Cozinha Usado", grupo: "especial", tipo: "especial", categoria: "PEV de Óleo / Pq. São José", dica: "Nunca no ralo! Guarde frio em garrafa PET e entregue nos PEVs de SJP para virar sabão ou biodiesel." },
    { nome: "Lâmpadas Fluorescentes e LED", grupo: "especial", tipo: "especial", categoria: "Logística Reversa de Lâmpadas", dica: "Contêm vapor de mercúrio. Entregue em lojas de materiais de construção ou PEVs credenciados." },
    { nome: "Celulares, Carregadores e Cabos Velhos", grupo: "especial", tipo: "especial", categoria: "Lixo Eletrônico (E-lixo)", dica: "Descarte nos mutirões de e-lixo de São José dos Pinhais ou ecopontos da prefeitura." },
    { nome: "Pneus Usados", grupo: "especial", tipo: "especial", categoria: "Ecoponto de Pneus de SJP", dica: "Logística reversa obrigatória do fabricante (Reciclanip). Viram asfalto ecológico e solados." },

    // ORGÂNICO & REJEITOS
    { nome: "Esponja de Cozinha Sintética", grupo: "organico", tipo: "rejeito", categoria: "Lixo Comum (Rejeito)", dica: "Poliuretano difícil de reciclar. Vai para o aterro ou programas especializados TerraCycle." },
    { nome: "Restos de Frutas e Legumes", grupo: "organico", tipo: "organico", categoria: "Orgânico / Compostagem", dica: "Excelente para composteiras domésticas ou hortas comunitárias." },
    { nome: "Fita Adesiva e Etiquetas Plásticas", grupo: "organico", tipo: "rejeito", categoria: "Lixo Comum (Rejeito)", dica: "A cola contamina a polpa de reciclagem do papel. Descarte no comum." }
];

let categoriaResiduoFiltro = 'plastico';

function filtrarCategoriaResiduo(categoria, btnClicado) {
    categoriaResiduoFiltro = categoria;
    tocarSom('clique');

    document.querySelectorAll('.chip-categoria').forEach(b => b.classList.remove('ativo'));
    if (btnClicado) btnClicado.classList.add('ativo');

    const container = document.getElementById('resultado-consulta-residuo');
    const input = document.getElementById('input-consulta-residuo');
    if (!container) return;

    if (input) input.value = '';

    const itensFiltrados = baseResiduos.filter(item => item.grupo === categoria);
    renderizarItensConsulta(itensFiltrados, container);
}

function moverCarrosselResiduos(direcao) {
    const track = document.getElementById('carrossel-residuos-track');
    if (!track) return;
    tocarSom('clique');
    const largura = track.clientWidth || 340;
    track.scrollBy({ left: direcao * largura, behavior: 'smooth' });
}

function irParaSlideResiduo(index) {
    const track = document.getElementById('carrossel-residuos-track');
    const slides = track ? track.querySelectorAll('.insta-slide-residuo') : [];
    if (!track || !slides[index]) return;
    tocarSom('clique');
    slides[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    atualizarDotsResiduos(index);
}

function atualizarDotsResiduos(indexAtivo) {
    const dots = document.querySelectorAll('.insta-dot-residuo');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('ativo', idx === indexAtivo);
    });
}

function configurarScrollResiduos(track, totalItens) {
    if (!track || totalItens <= 1) return;
    let timeout = null;
    track.addEventListener('scroll', () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            const scrollLeft = track.scrollLeft;
            const largura = track.clientWidth || 1;
            const index = Math.round(scrollLeft / largura);
            atualizarDotsResiduos(Math.min(Math.max(index, 0), totalItens - 1));
        }, 50);
    }, { passive: true });
}

function renderizarItensConsulta(itens, container) {
    container.innerHTML = '';
    if (itens.length === 0) {
        container.innerHTML = `
            <div class="item-consulta-card" style="border-color: var(--border-color); background: var(--bg-surface-subtle); text-align: center; max-width: 480px; margin: 16px auto;">
                <div style="text-align: center;">
                    <strong style="font-size: 1.05rem; display: block; margin-bottom: 4px;">🔍 Item não localizado no guia rápido</strong>
                    <p style="font-size: 0.9rem; opacity: 0.85; max-width: 420px; margin: 0 auto;">Dica geral: se for embalagem limpa e seca, destine à Coleta Seletiva. Se tiver química ou restos pesados, ao Lixo Comum.</p>
                </div>
            </div>
        `;
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'insta-residuos-wrapper';

    let slidesHtml = '';
    let dotsHtml = '';

    itens.forEach((item, index) => {
        const icone = item.tipo === 'reciclavel' ? '♻️' : (item.tipo === 'especial' ? '⚠️' : '🗑️');
        const rotuloTipo = item.tipo === 'reciclavel' ? '100% Reciclável' : (item.tipo === 'especial' ? 'Atenção / Logística Reversa' : 'Lixo Comum / Rejeito');
        const classeTipo = item.tipo === 'reciclavel' ? 'tag-reciclavel' : (item.tipo === 'especial' ? 'tag-especial' : 'tag-rejeito');

        slidesHtml += `
            <div class="insta-slide-residuo">
                <div class="item-consulta-card ${item.tipo} grupo-${item.grupo}">
                    <div class="slide-header-residuo">
                        <span class="slide-contador">${index + 1} de ${itens.length}</span>
                        <span class="tag-categoria-lixeira">${escapeHtml(item.categoria)}</span>
                    </div>
                    <div class="slide-corpo-residuo">
                        <span class="icone-residuo">${icone}</span>
                        <strong class="titulo-residuo">${escapeHtml(item.nome)}</strong>
                        <p class="dica-residuo">${escapeHtml(item.dica)}</p>
                    </div>
                    <div class="slide-footer-residuo">
                        <span class="status-recicla-badge ${classeTipo}">${rotuloTipo}</span>
                    </div>
                </div>
            </div>
        `;

        if (itens.length > 1) {
            dotsHtml += `<button type="button" class="insta-dot-residuo ${index === 0 ? 'ativo' : ''}" onclick="irParaSlideResiduo(${index})" aria-label="Ver item ${index + 1}"></button>`;
        }
    });

    const setasHtml = itens.length > 1 ? `
        <button type="button" class="carousel-arrow btn-prev-residuo" onclick="moverCarrosselResiduos(-1)" aria-label="Item anterior">‹</button>
        <button type="button" class="carousel-arrow btn-next-residuo" onclick="moverCarrosselResiduos(1)" aria-label="Próximo item">›</button>
    ` : '';

    wrapper.innerHTML = `
        <div class="insta-residuos-container">
            ${setasHtml}
            <div class="insta-residuos-track" id="carrossel-residuos-track">
                ${slidesHtml}
            </div>
        </div>
        ${itens.length > 1 ? `<div class="insta-dots-container" id="dots-carrossel-residuos">${dotsHtml}</div>` : ''}
    `;

    container.appendChild(wrapper);

    const track = document.getElementById('carrossel-residuos-track');
    if (track) {
        configurarScrollResiduos(track, itens.length);
    }
}

function configurarConsultaResiduos() {
    const input = document.getElementById('input-consulta-residuo');
    const container = document.getElementById('resultado-consulta-residuo');
    if (!input || !container) return;

    input.addEventListener('input', function() {
        const termo = normalizarTexto(this.value.trim());
        container.innerHTML = '';

        if (termo.length < 2) {
            const itensFiltrados = baseResiduos.filter(item => item.grupo === categoriaResiduoFiltro);
            renderizarItensConsulta(itensFiltrados, container);
            return;
        }

        const correspondencias = baseResiduos.filter(item => 
            normalizarTexto(item.nome).includes(termo) || 
            normalizarTexto(item.categoria).includes(termo) ||
            normalizarTexto(item.dica).includes(termo)
        );

        renderizarItensConsulta(correspondencias.slice(0, 6), container);
    });
}

// ==========================================
// 4. AGENDA DE COLETA DOS BAIRROS DE SJP
// ==========================================
const coletasSJP = {
    "Afonso Pena (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Segundas e Quartas", regiao: "Urbana / Aeroporto" },
    "Águas Belas (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Segundas e Quartas", regiao: "Urbana" },
    "Aristocrata (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Quintas", regiao: "Nobre" },
    "Boneca do Iguaçu (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Quintas", regiao: "Residencial" },
    "Borda do Campo (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Sextas-feiras", regiao: "Polo Industrial" },
    "Bom Jesus (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Segundas e Sextas", regiao: "Urbana" },
    "Cachoeira (SJP)": { cidade: "São José dos Pinhais", comum: "Terça e Quinta", reciclavel: "Quartas-feiras", regiao: "Rural / Mista" },
    "Campina do Taquaral (SJP)": { cidade: "São José dos Pinhais", comum: "Terça e Quinta", reciclavel: "Segundas-feiras", regiao: "Rural" },
    "Campo Largo da Roseira (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Quintas-feiras", regiao: "Polo Automotivo Audi/VW" },
    "Centro (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta (Noturno)", reciclavel: "Terças e Quintas (Diurno)", regiao: "Comercial / Central" },
    "Cidade Jardim (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Quartas e Sábados", regiao: "Residencial" },
    "Colônia Murici (SJP)": { cidade: "São José dos Pinhais", comum: "Terça e Sábado", reciclavel: "Quintas-feiras", regiao: "Circuito Gastronômico / Rural" },
    "Colônia Rio Grande (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Segundas e Sextas", regiao: "Mista" },
    "Contenda (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda e Quinta", reciclavel: "Quartas-feiras", regiao: "Rural" },
    "Costeira (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Quintas", regiao: "Urbana" },
    "Cristal (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Quartas-feiras", regiao: "Residencial" },
    "Cruzeiro (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Sábados", regiao: "Urbana" },
    "Del Rey (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Quartas-feiras", regiao: "Residencial" },
    "Dom Moacyr (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças-feiras", regiao: "Residencial" },
    "Guatupê (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Quartas e Sextas", regiao: "Polo Logístico BR-277" },
    "Iná (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Segundas e Quartas", regiao: "Residencial" },
    "Ipê (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Quintas", regiao: "Residencial" },
    "Itália (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Quartas-feiras", regiao: "Residencial" },
    "Jurema (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Segundas-feiras", regiao: "Residencial" },
    "Malhada (SJP)": { cidade: "São José dos Pinhais", comum: "Terça e Quinta", reciclavel: "Sextas-feiras", regiao: "Rural" },
    "Maracanã (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Quintas", regiao: "Residencial" },
    "Miringuava (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda e Quinta", reciclavel: "Quartas-feiras", regiao: "Mananciais e Represa" },
    "Ouro Fino (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Segundas e Quartas", regiao: "Residencial" },
    "Parque da Fonte (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Quintas", regiao: "Residencial" },
    "Pedro Moro (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Quartas e Sábados", regiao: "Residencial / Comercial" },
    "Quississana (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Segundas e Sextas", regiao: "Polo Logístico" },
    "Rio Pequeno (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Quartas e Sábados", regiao: "Industrial / Residencial" },
    "Santo Antônio (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Quintas", regiao: "Residencial" },
    "São Cristóvão (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Segundas e Quintas", regiao: "Residencial" },
    "São Domingos (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Quintas", regiao: "Residencial" },
    "São Marcos (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Segundas e Quartas", regiao: "Polo Fabril Renault" },
    "Silveira da Motta (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças e Quintas", regiao: "Central" },
    "Vila Bond (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Segundas-feiras", regiao: "Vila Urbana" },
    "Vila Cruzeiro (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Terças-feiras", regiao: "Vila Urbana" },
    "Vila Garcia (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Quartas-feiras", regiao: "Vila Urbana" },
    "Vila Iná (SJP)": { cidade: "São José dos Pinhais", comum: "Terça, Quinta e Sábado", reciclavel: "Segundas e Quartas", regiao: "Vila Urbana" },
    "Vila Militar (SJP)": { cidade: "São José dos Pinhais", comum: "Segunda, Quarta e Sexta", reciclavel: "Quartas-feiras", regiao: "Aeroporto Afonso Pena" },
    "Zacarias (SJP)": { cidade: "São José dos Pinhais", comum: "Terça e Quinta", reciclavel: "Sextas-feiras", regiao: "Residencial" }
};

function normalizarTexto(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

function calcularStatusColeta(textoDias) {
    if (!textoDias) return '';
    const hojeNum = new Date().getDay();
    const amanhaNum = (hojeNum + 1) % 7;

    const mapaDias = {
        0: ['domingo'],
        1: ['segunda', 'segundas'],
        2: ['terca', 'tercas'],
        3: ['quarta', 'quartas'],
        4: ['quinta', 'quintas'],
        5: ['sexta', 'sextas'],
        6: ['sabado', 'sabados']
    };

    const textoNorm = normalizarTexto(textoDias);

    if (textoNorm.includes('diario') || textoNorm.includes('segunda a sabado')) {
        return '<span class="badge-status-hoje">🚨 HOJE! Coleta Ativa</span>';
    }

    if (mapaDias[hojeNum].some(dia => textoNorm.includes(dia))) {
        return '<span class="badge-status-hoje">🚨 HOJE! Coloque para fora</span>';
    }

    if (mapaDias[amanhaNum].some(dia => textoNorm.includes(dia))) {
        return '<span class="badge-status-amanha">⏰ AMANHÃ! Prepare o descarte</span>';
    }

    return '<span class="badge-status-normal">📅 Programada</span>';
}

function renderizarCartoesColeta(bairro, containerId) {
    const dados = coletasSJP[bairro];
    const container = document.getElementById(containerId);
    if (!container || !dados) return;
    
    const statusComum = calcularStatusColeta(dados.comum);
    const statusRecicla = calcularStatusColeta(dados.reciclavel);

    container.innerHTML = `
        <div class="card-resultado-coleta-moderno">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;">
                <span style="font-size: 1.25rem; color: var(--accent); font-weight: 800;">📍 ${escapeHtml(bairro)}</span>
                <span style="background: var(--accent-light); color: var(--accent); padding: 5px 14px; border-radius: var(--radius-pill); font-size: 0.82rem; font-weight: 700;">${escapeHtml(dados.cidade)} ${dados.regiao ? '• ' + escapeHtml(dados.regiao) : ''}</span>
            </div>
            <div class="coleta-cards-container">
                <div class="card-comum">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 1.5rem;">🗑️</span>
                        ${statusComum}
                    </div>
                    <strong>Lixo Comum (Rejeito / Domiciliar)</strong>
                    <p style="margin-top: 6px; font-size: 0.95rem; line-height: 1.4;">${escapeHtml(dados.comum)}</p>
                </div>
                <div class="card-reciclavel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 1.5rem;">♻️</span>
                        ${statusRecicla}
                    </div>
                    <strong>Coleta Seletiva (Caminhão Amarelo/Verde)</strong>
                    <p style="margin-top: 6px; font-size: 0.95rem; line-height: 1.4;">${escapeHtml(dados.reciclavel)}</p>
                </div>
            </div>
        </div>
    `;
}

function popularSeletorBairros() {
    const select = document.getElementById('seletor-bairro-sjp');
    const containerChips = document.getElementById('chips-bairros-destaque');
    if (!select) return;

    const bairrosSJP = Object.keys(coletasSJP)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    select.innerHTML = '<option value="">👇 Escolha seu bairro em São José dos Pinhais...</option>' + 
        bairrosSJP.map(b => `<option value="${escapeHtml(b)}">📍 ${escapeHtml(b.replace(' (SJP)', ''))}</option>`).join('');

    if (containerChips) {
        const bairrosDestaque = [
            'Centro (SJP)', 'Afonso Pena (SJP)', 'Borda do Campo (SJP)', 
            'Guatupê (SJP)', 'Boneca do Iguaçu (SJP)', 'São Marcos (SJP)', 
            'Costeira (SJP)', 'Cidade Jardim (SJP)', 'Cruzeiro (SJP)', 'Águas Belas (SJP)'
        ];
        
        containerChips.innerHTML = bairrosDestaque.map(b => {
            const nomeExibicao = b.replace(' (SJP)', '');
            return `<button type="button" class="chip-bairro-rapido" data-bairro="${escapeHtml(b)}" onclick="selecionarBairroRapido('${escapeHtml(b)}')">📍 ${escapeHtml(nomeExibicao)}</button>`;
        }).join('');
    }

    // Pré-seleciona Centro (SJP) sem disparar som na abertura
    const bairroInicial = 'Centro (SJP)';
    select.value = bairroInicial;
    renderizarCartoesColeta(bairroInicial, 'resultado-busca-manual');
    atualizarChipsBairroAtivo(bairroInicial);
}

function selecionarBairroSelect(bairroChave) {
    if (!bairroChave) return;
    tocarSom('clique');
    renderizarCartoesColeta(bairroChave, 'resultado-busca-manual');
    atualizarChipsBairroAtivo(bairroChave);
}

function selecionarBairroRapido(bairroChave) {
    tocarSom('clique');
    const select = document.getElementById('seletor-bairro-sjp');
    if (select) select.value = bairroChave;
    renderizarCartoesColeta(bairroChave, 'resultado-busca-manual');
    atualizarChipsBairroAtivo(bairroChave);
}

function atualizarChipsBairroAtivo(bairroChave) {
    document.querySelectorAll('.chip-bairro-rapido').forEach(btn => {
        const nomeBtn = btn.getAttribute('data-bairro');
        btn.classList.toggle('ativo', nomeBtn === bairroChave);
    });
}

// ==========================================
// 5. MAPA LEAFLET COM LAZY LOADING & FILTROS
// ==========================================
let mapaLeaflet = null;
let marcadoresAtuais = [];
let marcadorUsuario = null;

const locaisColetaSJP = [
    // --- SÃO JOSÉ DOS PINHAIS ---
    { nome: "Sec. Meio Ambiente (SJP)", cidade: "São José dos Pinhais", categoria: "oleo_pilha", icone: "🔋", tipo: "Pilhas, Eletrônicos, Lâmpadas e Óleo", lat: -25.5345, lon: -49.2060 },
    { nome: "Parque São José (PEV Central)", cidade: "São José dos Pinhais", categoria: "pev", icone: "♻️", tipo: "PEV Público Geral (Papel, Plástico, Vidro, Metal)", lat: -25.5210, lon: -49.1860 },
    { nome: "Condor Afonso Pena", cidade: "São José dos Pinhais", categoria: "oleo_pilha", icone: "🛢️", tipo: "Ponto de Entrega Voluntária de Óleo e Baterias", lat: -25.5320, lon: -49.2000 },
    { nome: "Associação dos Catadores de SJP", cidade: "São José dos Pinhais", categoria: "cooperativa", icone: "🏭", tipo: "Triagem Geral de Recicláveis e Inclusão Social", lat: -25.5450, lon: -49.1900 },
    { nome: "Shopping São José", cidade: "São José dos Pinhais", categoria: "pev", icone: "♻️", tipo: "PEV de Logística Reversa de Embalagens", lat: -25.5312, lon: -49.2045 },
    { nome: "Ecoponto Borda do Campo", cidade: "São José dos Pinhais", categoria: "pev", icone: "♻️", tipo: "PEV Industrial e Residencial de Recicláveis", lat: -25.5580, lon: -49.1350 },
    { nome: "Ecoponto Guatupê / BR-277", cidade: "São José dos Pinhais", categoria: "pev", icone: "♻️", tipo: "Ponto de Entrega Voluntária para Empresas e Moradores", lat: -25.5080, lon: -49.1620 },

    // --- CURITIBA (VIZINHOS E POLOS DA CAPITAL) ---
    { nome: "Ecoponto Boqueirão / Marechal", cidade: "Curitiba", categoria: "pev", icone: "♻️", tipo: "PEV Fronteira SJP (Entulhos Limpos e Recicláveis)", lat: -25.5050, lon: -49.2380 },
    { nome: "Ecoponto Uberaba / Salgado Filho", cidade: "Curitiba", categoria: "pev", icone: "♻️", tipo: "Recicláveis, Podas e Pequenos Caliços", lat: -25.4780, lon: -49.2230 },
    { nome: "Cooperativa Catamare (Rebouças)", cidade: "Curitiba", categoria: "cooperativa", icone: "🏭", tipo: "Central de Triagem e Apoio a Catadores de Curitiba", lat: -25.4520, lon: -49.2620 },
    { nome: "Ecoponto Jardim Botânico / Linha Verde", cidade: "Curitiba", categoria: "pev", icone: "♻️", tipo: "PEV Central de Resíduos e Logística Reversa", lat: -25.4420, lon: -49.2410 },
    { nome: "Ecoponto Cajuru / BR-277", cidade: "Curitiba", categoria: "pev", icone: "♻️", tipo: "PEV Leste de Curitiba (Recicláveis e Madeiras)", lat: -25.4490, lon: -49.2150 },
    { nome: "Ecoponto CIC - Cidade Industrial", cidade: "Curitiba", categoria: "cooperativa", icone: "🏭", tipo: "Polo de Logística Reversa e Triagem Industrial", lat: -25.4950, lon: -49.3400 },
    { nome: "Central de Triagem Campo de Santana", cidade: "Curitiba", categoria: "cooperativa", icone: "🏭", tipo: "Cooperativa Ecológica do Sul de Curitiba", lat: -25.5780, lon: -49.2950 },
    { nome: "Ecoponto Santa Felicidade", cidade: "Curitiba", categoria: "pev", icone: "♻️", tipo: "PEV Norte de Curitiba (Recicláveis e Óleo)", lat: -25.4050, lon: -49.3300 },
    { nome: "Ecoponto Bairro Alto", cidade: "Curitiba", categoria: "oleo_pilha", icone: "🔋", tipo: "PEV de Lâmpadas, Eletrônicos e Baterias", lat: -25.4120, lon: -49.2080 },

    // --- REGIÃO METROPOLITANA DE CURITIBA (RMC) ---
    { nome: "Ecoponto Central de Pinhais", cidade: "Pinhais", categoria: "pev", icone: "♻️", tipo: "PEV Municipal e Eletrônicos", lat: -25.4380, lon: -49.1920 },
    { nome: "Cooperativa Recicla Pinhais (Weissópolis)", cidade: "Pinhais", categoria: "cooperativa", icone: "🏭", tipo: "Central de Triagem RMC Leste", lat: -25.4520, lon: -49.1850 },
    { nome: "Ecoponto Costeira de Araucária", cidade: "Araucária", categoria: "pev", icone: "♻️", tipo: "Ponto Limpo de Recicláveis Industriais", lat: -25.5900, lon: -49.3750 },
    { nome: "Cooperativa de Catadores de Araucária", cidade: "Araucária", categoria: "cooperativa", icone: "🏭", tipo: "Triagem de Plásticos, Papéis e Metais", lat: -25.5750, lon: -49.3900 },
    { nome: "Ecoponto Fazenda Rio Grande (Gralha Azul)", cidade: "Fazenda Rio Grande", categoria: "pev", icone: "♻️", tipo: "PEV Central de Resíduos Sólidos", lat: -25.6450, lon: -49.3100 },
    { nome: "Cooperativa Fazenda Rio Grande", cidade: "Fazenda Rio Grande", categoria: "cooperativa", icone: "🏭", tipo: "Central Municipal de Valorização de Resíduos", lat: -25.6600, lon: -49.3150 },
    { nome: "Ecoponto Colombo (Alto Maracanã)", cidade: "Colombo", categoria: "pev", icone: "♻️", tipo: "PEV RMC Norte e Descarte de Eletroeletrônicos", lat: -25.3650, lon: -49.1880 },
    { nome: "Central de Coleta Piraquara (Guarituba)", cidade: "Piraquara", categoria: "oleo_pilha", icone: "🛢️", tipo: "Coleta Especial e Proteção de Mananciais", lat: -25.4450, lon: -49.1350 }
];

function inicializarMapa() {
    const divMapa = document.getElementById('mapa-sjp');
    if (!divMapa || mapaLeaflet) return;

    if (typeof L === 'undefined') {
        setTimeout(inicializarMapa, 300);
        return;
    }

    const centroMetropolitano = [-25.4850, -49.2300];

    try {
        mapaLeaflet = L.map('mapa-sjp').setView(centroMetropolitano, 11);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { 
            attribution: 'Tiles &copy; Esri &mdash; Open Data São José dos Pinhais & RMC',
            maxZoom: 18
        }).addTo(mapaLeaflet);

        renderizarMarcadoresEcopontos('todos');

        setTimeout(() => {
            if (mapaLeaflet) mapaLeaflet.invalidateSize();
        }, 300);
    } catch (err) {
        console.error("Erro ao inicializar mapa Leaflet:", err);
    }
}

function renderizarMarcadoresEcopontos(filtro) {
    if (!mapaLeaflet) return;

    marcadoresAtuais.forEach(m => mapaLeaflet.removeLayer(m));
    marcadoresAtuais = [];

    const filtrados = filtro === 'todos' 
        ? locaisColetaSJP 
        : locaisColetaSJP.filter(p => p.categoria === filtro);

    filtrados.forEach(ponto => {
        let classeExtra = "";
        if (ponto.categoria === "oleo_pilha") classeExtra = "pin-oleo";
        else if (ponto.categoria === "cooperativa") classeExtra = "pin-cooperativa";

        const customIcon = L.divIcon({
            className: `custom-map-pin ${classeExtra}`,
            html: `<span>${ponto.icone}</span>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -22]
        });

        const marker = L.marker([ponto.lat, ponto.lon], { icon: customIcon }).addTo(mapaLeaflet)
            .bindPopup(`
                <div style="text-align: center; min-width: 200px; padding: 6px;">
                    <span style="font-size: 0.75rem; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; display: block;">📍 ${escapeHtml(ponto.cidade)}</span>
                    <strong style="color: #0d2214; font-size: 1.05rem; display: block; margin: 4px 0;">${escapeHtml(ponto.nome)}</strong>
                    <span style="font-size: 0.88rem; color: #4B5563; display: block; margin: 6px 0;">${escapeHtml(ponto.tipo)}</span>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${ponto.lat},${ponto.lon}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 6px; padding: 6px 14px; background: #047857; color: white; border-radius: 12px; text-decoration: none; font-size: 0.82rem; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">Como Chegar ↗</a>
                </div>
            `);
            
        marcadoresAtuais.push(marker);
    });
}

function filtrarPontos(categoria, btnElemento) {
    tocarSom('clique');
    if (!mapaLeaflet) inicializarMapa();
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('ativo'));
    if (btnElemento) {
        btnElemento.classList.add('ativo');
    }
    renderizarMarcadoresEcopontos(categoria);
}

function obterLocalizacaoGPS() {
    const btn = document.getElementById('btn-localizar');
    const divResultadoGPS = document.getElementById('resultado-gps-bairro');
    
    if (!btn) return;
    tocarSom('clique');
    btn.textContent = "⏳ Obtendo sua localização...";
    btn.disabled = true;

    if (!mapaLeaflet) inicializarMapa();

    if (!navigator.geolocation) {
        divResultadoGPS.innerHTML = `
            <div style="background: var(--danger-light); border-left: 4px solid var(--danger); padding: 15px; border-radius: 8px; text-align: left;">
                <p>⚠️ <strong>Geolocalização não suportada:</strong> Seu navegador não permite GPS automático. Você pode navegar pelo mapa abaixo ou selecionar seu bairro acima!</p>
            </div>
        `;
        btn.disabled = false;
        btn.textContent = "📍 Encontrar Minha Posição";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (posicao) => {
            const latUsuario = posicao.coords.latitude;
            const lonUsuario = posicao.coords.longitude;
            
            btn.disabled = false;
            btn.textContent = "📍 Posição Encontrada!";

            if (mapaLeaflet) {
                mapaLeaflet.flyTo([latUsuario, lonUsuario], 15, { duration: 1.5 });

                if (marcadorUsuario) {
                    mapaLeaflet.removeLayer(marcadorUsuario);
                }

                const userIcon = L.divIcon({
                    className: 'custom-map-pin pin-usuario',
                    html: `<span>📍</span>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                    popupAnchor: [0, -20]
                });

                marcadorUsuario = L.marker([latUsuario, lonUsuario], { icon: userIcon })
                    .addTo(mapaLeaflet)
                    .bindPopup("<b>📍 Você está aqui!</b>")
                    .openPopup();
            }

            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latUsuario}&lon=${lonUsuario}`)
                .then(res => res.json())
                .then(data => {
                    const endereco = data.address || {};
                    const rua = escapeHtml(endereco.road || "Sua rua");
                    const bairroGPS = endereco.suburb || endereco.neighbourhood || endereco.city_district || "Centro";
                    
                    let bairroEncontrado = "Centro (SJP)"; 
                    for (const bairro of Object.keys(coletasSJP)) {
                        const nomePuro = bairro.split(" (")[0];
                        if (bairroGPS && (normalizarTexto(bairroGPS).includes(normalizarTexto(nomePuro)) || normalizarTexto(nomePuro).includes(normalizarTexto(bairroGPS)))) {
                            bairroEncontrado = bairro;
                            break;
                        }
                    }
                    
                    divResultadoGPS.innerHTML = `
                        <div style="background: var(--bg-surface); padding: 20px; border-radius: 12px; margin-top: 15px; border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
                            <p style="font-size: 1.1rem; color: var(--text-primary);">📍 Localizado em: <strong>${rua}, ${escapeHtml(bairroGPS)}</strong></p>
                            <p style="margin-bottom: 12px; font-size: 0.95rem; color: var(--text-secondary);">Agenda de coleta sincronizada para seu setor (${escapeHtml(bairroEncontrado)}):</p>
                            <div class="coleta-cards-container">
                                <div class="card-comum">
                                    <div style="font-size: 1.5rem; margin-bottom: 5px;">🗑️</div>
                                    <strong>Lixo Comum</strong><br><span>${escapeHtml(coletasSJP[bairroEncontrado].comum)}</span>
                                </div>
                                <div class="card-reciclavel">
                                    <div style="font-size: 1.5rem; margin-bottom: 5px;">♻️</div>
                                    <strong>Coleta Seletiva</strong><br><span>${escapeHtml(coletasSJP[bairroEncontrado].reciclavel)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                })
                .catch(() => {
                    divResultadoGPS.innerHTML = `
                        <div style="background: var(--bg-surface); padding: 15px; border-radius: 10px; margin-top: 10px; border: 1px solid var(--border-color);">
                            <p style="color: var(--accent);">📍 <strong>Localização GPS marcada no mapa!</strong> Veja os Ecopontos mais próximos ao seu redor.</p>
                        </div>
                    `;
                });
        },
        () => {
            btn.disabled = false;
            btn.textContent = "📍 Encontrar Minha Posição";
            divResultadoGPS.innerHTML = `
                <div style="background: var(--bg-surface-subtle); border-left: 4px solid var(--accent); padding: 16px; border-radius: 10px; text-align: left; margin-top: 10px; box-shadow: var(--shadow-sm);">
                    <p style="font-weight: bold; color: var(--accent); margin-bottom: 4px;">ℹ️ Localização manual disponível:</p>
                    <p style="font-size: 0.92rem; color: var(--text-secondary);">O navegador não liberou o GPS automático. <strong>O mapa de São José dos Pinhais já está interativo abaixo</strong>, e você pode navegar nele ou escolher seu bairro no seletor acima!</p>
                </div>
            `;
        },
        { timeout: 7000, enableHighAccuracy: false }
    );
}

// ==========================================
// 6. JOGO DA RECICLAGEM GAMIFICADO E DIDÁTICO
// ==========================================
const perguntasQuiz = [
    {
        item: "🍕 Caixa de Pizza com gordura impregnada",
        categoria: "Embalagem Alimentícia",
        opcoes: [
            { id: 'papel', nome: 'Papel', subtexto: 'Lixeira Azul', classeCor: 'cor-lixeira-papel', icone: '📄' },
            { id: 'comum', nome: 'Lixo Comum', subtexto: 'Rejeito / Cinza', classeCor: 'cor-lixeira-comum', icone: '🗑️' },
            { id: 'organico', nome: 'Orgânico', subtexto: 'Compostagem / Marrom', classeCor: 'cor-lixeira-organico', icone: '🍎' }
        ],
        correta: 'comum',
        explicacao: "O óleo vegetal e a gordura animal fundem-se às fibras de celulose do papelão. Na reciclagem industrial, esse óleo não se mistura com a água da batedeira, criando manchas e estragando toneladas de papel reciclado.",
        dica: "Se a tampa superior estiver limpa e sem gordura, destaque-a e envie para a Coleta Seletiva (Papel)! Apenas a parte com gordura vai para o lixo comum."
    },
    {
        item: "🥡 Bandeja de Isopor (EPS) limpa de marmita",
        categoria: "Embalagem Plástica",
        opcoes: [
            { id: 'plastico', nome: 'Plástico', subtexto: 'Lixeira Vermelha', classeCor: 'cor-lixeira-plastico', icone: '🧴' },
            { id: 'papel', nome: 'Papel', subtexto: 'Lixeira Azul', classeCor: 'cor-lixeira-papel', icone: '📄' },
            { id: 'comum', nome: 'Lixo Comum', subtexto: 'Rejeito / Cinza', classeCor: 'cor-lixeira-comum', icone: '🗑️' }
        ],
        correta: 'plastico',
        explicacao: "O isopor é 100% plástico (Poliestireno Expandido - EPS). Quando limpo e seco, ele é reciclado mecanicamente e transformado em réguas escolares, rodapés ecológicos e peças para a indústria automotiva.",
        dica: "Passe uma água de reuso ou guardanapo para tirar restos de comida antes de colocar no saco da Coleta Seletiva de São José dos Pinhais."
    },
    {
        item: "🥫 Latinha de Refrigerante ou Suco (Alumínio)",
        categoria: "Metais Nobres",
        opcoes: [
            { id: 'plastico', nome: 'Plástico', subtexto: 'Lixeira Vermelha', classeCor: 'cor-lixeira-plastico', icone: '🧴' },
            { id: 'metal', nome: 'Metal', subtexto: 'Lixeira Amarela', classeCor: 'cor-lixeira-metal', icone: '🥫' },
            { id: 'vidro', nome: 'Vidro', subtexto: 'Lixeira Verde', classeCor: 'cor-lixeira-vidro', icone: '🍾' }
        ],
        correta: 'metal',
        explicacao: "O alumínio é infinitamente reciclável sem nenhuma perda de qualidade! O Brasil é líder mundial na reciclagem de latas, economizando 95% de energia elétrica em comparação à extração de bauxita virgem.",
        dica: "Amasse a latinha com o pé ou as mãos para economizar espaço no armazenamento e facilitar o transporte pelas cooperativas de SJP."
    },
    {
        item: "🍶 Garrafa ou Pote de Vidro Quebrado",
        categoria: "Vidros e Embalagens",
        opcoes: [
            { id: 'comum', nome: 'Lixo Comum', subtexto: 'Rejeito / Cinza', classeCor: 'cor-lixeira-comum', icone: '🗑️' },
            { id: 'vidro', nome: 'Vidro', subtexto: 'Lixeira Verde', classeCor: 'cor-lixeira-vidro', icone: '🍾' },
            { id: 'plastico', nome: 'Plástico', subtexto: 'Lixeira Vermelha', classeCor: 'cor-lixeira-plastico', icone: '🧴' }
        ],
        correta: 'vidro',
        explicacao: "O vidro quebrado é 100% reciclável e retorna aos fornos das vidrarias como matéria-prima pura, reduzindo as emissões de carbono e o consumo de areia e minerais.",
        dica: "SEGURANÇA ESSENCIAL: Embrulhe os cacos em folhas de jornal, coloque dentro de uma caixa de papelão ou de uma garrafa PET cortada para proteger os coletores de ferimentos!"
    },
    {
        item: "🪞 Espelho, Prato de Porcelana ou Cerâmica Quebrada",
        categoria: "Vidros Especiais & Minerais",
        opcoes: [
            { id: 'vidro', nome: 'Vidro', subtexto: 'Lixeira Verde', classeCor: 'cor-lixeira-vidro', icone: '🍾' },
            { id: 'comum', nome: 'Lixo Comum', subtexto: 'Rejeito / Cinza', classeCor: 'cor-lixeira-comum', icone: '🗑️' },
            { id: 'especial', nome: 'Ecoponto', subtexto: 'Logística Reversa', classeCor: 'cor-lixeira-especial', icone: '⚠️' }
        ],
        correta: 'comum',
        explicacao: "Espelhos têm película química de prata e cerâmicas têm temperatura de fusão muito superior ao vidro comum. Se forem misturados ao vidro das garrafas, não derretem e estragam o lote inteiro na indústria.",
        dica: "Embale com segurança em papel ou caixa para evitar cortes e descarte no Lixo Comum (Rejeito)."
    },
    {
        item: "💊 Cartela Vazia de Remédio (Blister)",
        categoria: "Saúde & Medicamentos",
        opcoes: [
            { id: 'plastico', nome: 'Plástico', subtexto: 'Lixeira Vermelha', classeCor: 'cor-lixeira-plastico', icone: '🧴' },
            { id: 'metal', nome: 'Metal', subtexto: 'Lixeira Amarela', classeCor: 'cor-lixeira-metal', icone: '🥫' },
            { id: 'especial', nome: 'Logística Reversa', subtexto: 'Farmácias / Ecoponto', classeCor: 'cor-lixeira-especial', icone: '⚠️' }
        ],
        correta: 'especial',
        explicacao: "Os blisters fundem plástico e folha de alumínio de forma inseparável na triagem convencional, além de conterem traços de fármacos químicos que poluem lençóis freáticos e aterros sanitários.",
        dica: "Guarde as cartelas vazias e remédios vencidos e entregue nas estações de descarte de farmácias e unidades de saúde de São José dos Pinhais."
    }
];

let perguntaAtual = 0;
let acertosTotais = 0;
let timeoutTransicao = null;
let intervaloContador = null;

function carregarPergunta() {
    if (timeoutTransicao) clearTimeout(timeoutTransicao);
    if (intervaloContador) clearInterval(intervaloContador);

    const conteudo = document.getElementById('quiz-content');
    const barraProgresso = document.getElementById('quiz-barra-progresso');
    const contadorEtapa = document.getElementById('quiz-contador-etapa');
    const pontosValor = document.getElementById('quiz-pontos-valor');
    if (!conteudo) return;
    
    conteudo.style.opacity = '0';
    conteudo.style.transform = 'translateY(6px)';

    const pct = ((perguntaAtual + 1) / perguntasQuiz.length) * 100;
    if (barraProgresso) barraProgresso.style.width = `${pct}%`;
    if (contadorEtapa) contadorEtapa.textContent = `${perguntaAtual + 1} de ${perguntasQuiz.length}`;
    if (pontosValor) pontosValor.textContent = `⭐ ${acertosTotais}`;

    setTimeout(() => {
        const containerBotoes = document.getElementById('botoes-quiz');
        const p = perguntasQuiz[perguntaAtual];
        
        document.getElementById('pergunta-quiz').innerHTML = `
            <span class="pergunta-badge-topo">${escapeHtml(p.categoria)}</span>
            <span class="pergunta-enunciado">Para onde deve ir este resíduo em São José dos Pinhais?</span>
            <h3 class="pergunta-item-destaque">${escapeHtml(p.item)}</h3>
        `;
             
        document.getElementById('feedback-quiz').style.display = 'none';
        document.getElementById('btn-proxima').style.display = 'none';
        const btnPular = document.getElementById('btn-pular-timer');
        if (btnPular) btnPular.style.display = 'none';
        
        containerBotoes.innerHTML = '';

        p.opcoes.forEach((opcao) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'lixeira-card-btn';
            btn.innerHTML = `
                <div class="lixeira-icone-container ${opcao.classeCor}" aria-hidden="true">${opcao.icone}</div>
                <div class="lixeira-texto-container">
                    <span class="lixeira-nome">${escapeHtml(opcao.nome)}</span>
                    <span class="lixeira-subtexto">${escapeHtml(opcao.subtexto)}</span>
                </div>
            `;
            btn.onclick = () => verificarResposta(opcao.id);
            containerBotoes.appendChild(btn);
        });

        conteudo.style.opacity = '1';
        conteudo.style.transform = 'translateY(0)';
    }, 220);
}

function verificarResposta(idEscolhido) {
    const p = perguntasQuiz[perguntaAtual];
    const botoes = document.getElementById('botoes-quiz').querySelectorAll('.lixeira-card-btn');
    const feedback = document.getElementById('feedback-quiz');
    const btnPular = document.getElementById('btn-pular-timer');
    const pontosValor = document.getElementById('quiz-pontos-valor');
    
    botoes.forEach(b => b.disabled = true); 
    
    const acertou = idEscolhido === p.correta;
    if (acertou) {
        acertosTotais++;
        if (pontosValor) pontosValor.textContent = `⭐ ${acertosTotais}`;
        feedback.className = 'feedback-caixa-didatica feedback-certo-moderno';
        tocarSom('acerto');
    } else {
        feedback.className = 'feedback-caixa-didatica feedback-erro-moderno';
        tocarSom('erro');
    }

    const tituloFeedback = acertou 
        ? '🎉 <strong>Excelente! Você acertou na mosca.</strong>' 
        : '💡 <strong>Ops! Essa é uma dúvida muito comum.</strong>';

    feedback.innerHTML = `
        <div class="feedback-titulo">${tituloFeedback}</div>
        <p class="feedback-explicacao"><strong>Entenda o motivo:</strong> ${escapeHtml(p.explicacao)}</p>
        <div class="feedback-dica-box">🌱 <strong>Dica Prática:</strong> ${escapeHtml(p.dica)}</div>
        <div style="margin-top: 10px; font-size: 0.85rem; font-weight: 700; opacity: 0.85;">⏳ Próximo desafio em <span id="quiz-timer-contador">3</span> segundos...</div>
    `;

    botoes.forEach((b, index) => {
        const opcaoId = p.opcoes[index].id;
        if (opcaoId === p.correta) {
            b.classList.add('certa');
        } else if (opcaoId === idEscolhido) {
            b.classList.add('errada');
        }
    });

    feedback.style.display = 'block';
    if (btnPular) {
        btnPular.textContent = perguntaAtual + 1 === perguntasQuiz.length ? 'Ver Resultado Final ➔' : 'Próximo Desafio ➔';
        btnPular.style.display = 'inline-block';
    }
    
    if (timeoutTransicao) clearTimeout(timeoutTransicao);
    if (intervaloContador) clearInterval(intervaloContador);

    let segundosRestantes = 3;
    intervaloContador = setInterval(() => {
        segundosRestantes--;
        const elementoContador = document.getElementById('quiz-timer-contador');
        if (elementoContador) {
            elementoContador.textContent = Math.max(0, segundosRestantes);
        }
        if (segundosRestantes <= 0) {
            clearInterval(intervaloContador);
        }
    }, 1000);

    timeoutTransicao = setTimeout(() => {
        if (intervaloContador) clearInterval(intervaloContador);
        proximaPergunta();
    }, 3000); 
}

function avancarImediatamente() {
    tocarSom('clique');
    if (timeoutTransicao) clearTimeout(timeoutTransicao);
    if (intervaloContador) clearInterval(intervaloContador);
    proximaPergunta();
}

function dispararBaloes() {
    if (typeof confetti !== 'function') return;
    const duration = 2500;
    const end = Date.now() + duration;

    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c'] });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

function proximaPergunta() {
    if (timeoutTransicao) clearTimeout(timeoutTransicao);
    if (intervaloContador) clearInterval(intervaloContador);
    perguntaAtual++;
    
    if (perguntaAtual < perguntasQuiz.length) { 
        carregarPergunta(); 
    } else {
        const conteudo = document.getElementById('quiz-content');
        const barraProgresso = document.getElementById('quiz-barra-progresso');
        const contadorEtapa = document.getElementById('quiz-contador-etapa');
        
        if (barraProgresso) barraProgresso.style.width = '100%';
        if (contadorEtapa) contadorEtapa.textContent = 'Concluído!';
        conteudo.style.opacity = '0';
        
        setTimeout(() => {
            let tituloFinal = "";
            let medalha = "";
            let textoFinal = "";
            let corDestaque = "var(--accent)";
            
            const total = perguntasQuiz.length;
            if (acertosTotais === total) {
                medalha = "🏆";
                tituloFinal = "Mestre da Reciclagem de SJP!";
                textoFinal = `<strong>Pontuação Perfeita: ${acertosTotais} de ${total} acertos!</strong><br><br>Você domina completamente as diretrizes de triagem técnica de resíduos sólidos. Com hábitos assim, São José dos Pinhais economiza recursos públicos e valoriza os trabalhadores das cooperativas.`;
                tocarSom('fanfarra');
                dispararBaloes();
            } else if (acertosTotais >= 4) {
                medalha = "⭐";
                tituloFinal = "Guardião da Sustentabilidade!";
                textoFinal = `<strong>Ótimo Desempenho: ${acertosTotais} de ${total} acertos!</strong><br><br>Você tem excelente consciência ambiental sobre separação correta. Atenção apenas aos materiais mistos ou contaminados para garantir que seu descarte seja 100% aproveitado.`;
                corDestaque = "#10b981";
                tocarSom('acerto');
            } else {
                medalha = "🌱";
                tituloFinal = "Aprendiz Ecológico em Evolução!";
                textoFinal = `<strong>Resultado: ${acertosTotais} de ${total} acertos.</strong><br><br>Uma grande oportunidade de aprendizado prático! Use o Guia de Descarte e a busca por bairros desta página para tirar dúvidas no dia a dia.`;
                corDestaque = "#f59e0b";
                tocarSom('clique');
            }

            document.getElementById('pergunta-quiz').innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 6px;">${medalha}</div>
                <h3 style="font-size: 1.65rem; color: ${corDestaque}; font-weight: 800; margin-bottom: 4px;">${tituloFinal}</h3>
                <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">Desafio Concluído em São José dos Pinhais</span>
            `;
            
            const blocoCertificado = acertosTotais === total
                ? `<button type="button" class="btn-certificado-clean" onclick="abrirModalCertificado()">
                        🏅 Emitir Meu Certificado de Mérito Ambiental (PDF / Impressão)
                   </button>`
                : `<p style="margin-top: 14px; font-size: 0.88rem; color: var(--text-muted); font-weight: 600;">
                        🔒 Acerte todas as ${total} perguntas para liberar a emissão do seu Certificado de Mérito Ambiental!
                   </p>`;

            document.getElementById('botoes-quiz').innerHTML = `
                <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; font-size: 1.02rem; line-height: 1.6; color: var(--text-primary); text-align: center; width: 100%;">
                    ${textoFinal}
                    ${blocoCertificado}
                </div>
            `;
            
            document.getElementById('feedback-quiz').style.display = "none";
            const btnPular = document.getElementById('btn-pular-timer');
            if (btnPular) btnPular.style.display = "none";
            
            const btn = document.getElementById('btn-proxima');
            btn.textContent = "↻ Jogar Novamente";
            btn.style.display = 'inline-block';
            
            btn.onclick = () => { 
                tocarSom('clique');
                perguntaAtual = 0; 
                acertosTotais = 0; 
                carregarPergunta(); 
            };
            
            conteudo.style.opacity = '1';
        }, 220);
    }
}

// ==========================================
// 7. BAIRROS SUSTENTÁVEIS: PROJETOS E MODAL DE DETALHES
// ==========================================
const dadosProjetosSJP = {
    'borda-viva': {
        nome: "Associação Borda Viva & Renault do Brasil",
        bairro: "Borda do Campo, São José dos Pinhais",
        parceiro: "Complexo Ayrton Senna (Renault do Brasil)",
        residuos: "Sobras de tecidos automotivos, forros e cintos de segurança descontinuados",
        produtos: "Bolsas de luxo sustentável, mochilas executivas, ecobags e estojos",
        endereco: "Rua Manoel Pires Cordeiro, 452 - Borda do Campo, SJP - PR",
        siteOficial: "https://www.associacaobordaviva.com",
        cursos: [
            "Costura Industrial & Modelagem Básica / Avançada",
            "Panificação Comunitária & Confeitaria Solidária",
            "Gestão de Pequenos Negócios e Empreendedorismo Feminino"
        ],
        requisitos: "Aberto à comunidade de São José dos Pinhais (prioridade para moradores da Borda do Campo). Idade mínima: 16 anos. Apresentar RG, CPF e Comprovante de Residência.",
        midias: "Noticiado em matérias especiais no G1 Paraná, RPC, Prêmio Benchmarking Brasil e canais oficiais do Grupo Renault.",
        redes: "@associacaobordaviva"
    },
    'geracao-futuro': {
        nome: "Geração Futuro Jovens Talentos (Instituto Renault)",
        bairro: "Borda do Campo, São José dos Pinhais",
        parceiro: "Instituto Renault",
        residuos: "Capacitação profissional e formação em logística reversa e cadeia verde",
        produtos: "Jovens qualificados para o mercado corporativo, administrativo e industrial",
        endereco: "Comunidade Borda do Campo, São José dos Pinhais - PR",
        siteOficial: "https://institutorenault.com.br/inclusao/geracao-futuro",
        cursos: [
            "Português, Comunicação e Expressão",
            "Critérios de Compliance, Ética, Cidadania e Empregabilidade",
            "Informática (Pacote Office): Word, Excel e PowerPoint",
            "Gestão Administrativa, Financeira, Compras, Estoque e Faturamento",
            "Logística, Cadeia Verde, Logística Reversa e Integrada"
        ],
        requisitos: "Jovens de 14 a 24 anos cursando ou com Ensino Médio concluído (prioridade escola pública). 100% gratuito.",
        midias: "Programa emblemático do Instituto Renault de inclusão e capacitação de jovens em SJP.",
        redes: "@institutorenault"
    },
    'cores-fora-de-tela': {
        nome: "Projeto Cores Fora de Tela (Amigos do HC)",
        bairro: "Vila Nova, São José dos Pinhais",
        parceiro: "Alpha Química, Schattdecor & Alvorada Autopeças",
        residuos: "Oficinas culturais e kits de arte para redução do uso excessivo de telas",
        produtos: "Ilustrações, formação artística infantil e inclusão com Libras",
        endereco: "Escola Municipal Profª Terezinha Toczek - Vila Nova, SJP",
        siteOficial: "https://amigosdohc.org.br",
        cursos: [
            "Oficinas de Ilustração & Expressão Artística",
            "Uso Consciente da Tecnologia e Redução do Tempo de Tela",
            "Acessibilidade e Inclusão com Intérprete de Libras"
        ],
        requisitos: "Crianças de 7 a 10 anos matriculadas na rede municipal (contraturno escolar). 100% gratuito com kit completo.",
        midias: "Projeto aprovado pela Lei de Incentivo à Cultura realizado na Escola Municipal Profª Terezinha Toczek em SJP.",
        redes: "@amigosdohc"
    },
    'gemu-brasil': {
        nome: "GEMÜ do Brasil: Apoio Comunitário aos CMEIs",
        bairro: "Afonso Pena / Parque da Fonte, São José dos Pinhais",
        parceiro: "GEMÜ do Brasil Sistemas de Medição e Controle",
        residuos: "Desenvolvimento comunitário infantil e melhorias estruturais escolares",
        produtos: "Ambientes escolares renovados, segurança alimentar e kits pedagógicos",
        endereco: "Rua Marechal Hermes, 71 - Afonso Pena, São José dos Pinhais - PR",
        siteOficial: "https://www.gemu-group.com/pt-br/",
        cursos: [
            "Melhorias Estruturais e Manutenção Contínua de CMEIs",
            "Campanhas de Arrecadação e Doação de Alimentos e Higiene",
            "Distribuição de Roupas, Agasalhos e Equipamentos Didáticos"
        ],
        requisitos: "Ações comunitárias integradas com os Centros Municipais de Educação Infantil de São José dos Pinhais.",
        midias: "Destacado em matérias de responsabilidade social sobre o impacto da indústria na comunidade escolar de SJP.",
        redes: "@gemugroup"
    },
    'horse-powertrain': {
        nome: "Horse Powertrain: Novos Empreendedores",
        bairro: "Roseira de São Sebastião, São José dos Pinhais",
        parceiro: "Horse Powertrain (Divisão de Motores & Propulsão)",
        residuos: "Mentoria corporativa, educação ambiental e empreendedorismo local",
        produtos: "Novos negócios comunitários e projetos de impacto sustentável",
        endereco: "Complexo Industrial Automotivo - Roseira de São Sebastião, SJP",
        siteOficial: "https://economiapr.com.br/2025/11/12/projeto-forma-15-novos-empreendedores-em-sao-jose-dos-pinhais/",
        cursos: [
            "Formação e Aceleração de Novos Empreendedores Locais",
            "Oficinas de Educação Ambiental, ESG e Economia Circular",
            "Mentoria Profissional com Engenheiros e Colaboradores da Fábrica"
        ],
        requisitos: "Moradores e empreendedores locais da Roseira de São Sebastião e região. Programa 100% gratuito.",
        midias: "Investimento social de R$ 150 mil anuais em capacitação e desenvolvimento comunitário em São José dos Pinhais.",
        redes: "@horsepowertrain"
    }
};

function moverCarrosselProjetos(direcao) {
    const track = document.getElementById('carrossel-projetos-track');
    if (!track) return;
    tocarSom('clique');
    const larguraCard = track.querySelector('.projeto-slide')?.clientWidth || 300;
    track.scrollBy({ left: direcao * (larguraCard + 16), behavior: 'smooth' });
}

function irParaSlideProjeto(index) {
    const track = document.getElementById('carrossel-projetos-track');
    const slides = track ? track.querySelectorAll('.projeto-slide') : [];
    if (!track || !slides[index]) return;
    tocarSom('clique');
    slides[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    atualizarDotsProjetos(index);
}

function atualizarDotsProjetos(indexAtivo) {
    const dots = document.querySelectorAll('#dots-carrossel-projetos .insta-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('ativo', idx === indexAtivo);
    });
}

function configurarScrollProjetos() {
    const track = document.getElementById('carrossel-projetos-track');
    if (!track) return;
    let timeout = null;
    track.addEventListener('scroll', () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            const scrollLeft = track.scrollLeft;
            const larguraCard = track.querySelector('.projeto-slide')?.clientWidth || 300;
            const index = Math.round(scrollLeft / (larguraCard + 16));
            const slides = track.querySelectorAll('.projeto-slide');
            atualizarDotsProjetos(Math.min(Math.max(index, 0), slides.length - 1));
        }, 50);
    }, { passive: true });
}

let ultimoElementoFocado = null;

function abrirModalInscricao(idProjeto, links) {
    const dados = dadosProjetosSJP[idProjeto];
    const modal = document.getElementById('modal-projeto');
    const container = document.getElementById('modal-conteudo-dinamico');
    if (!dados || !modal || !container) return;

    ultimoElementoFocado = document.activeElement;
    tocarSom('clique');

    container.innerHTML = `
        <div style="text-align: center;">
            <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 0.82rem; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px;">📍 ${escapeHtml(dados.bairro)}</span>
                <span style="font-size: 0.78rem; font-weight: 700; background: var(--accent-light); color: var(--accent); padding: 3px 10px; border-radius: var(--radius-pill);">Inscrições Gratuitas</span>
            </div>
            
            <h2 id="modal-titulo" style="font-size: 1.45rem; margin: 4px 0 14px; color: var(--text-primary); font-weight: 800; text-align: center;">${escapeHtml(dados.nome)}</h2>
            
            <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-color); padding: 14px; border-radius: 10px; margin-bottom: 16px; font-size: 0.9rem; line-height: 1.55; text-align: center;">
                <p style="margin-bottom: 4px;"><strong>🏭 Parceria Industrial:</strong> ${escapeHtml(dados.parceiro)}</p>
                <p style="margin-bottom: 4px;"><strong>♻️ Matéria-prima / Foco:</strong> ${escapeHtml(dados.residuos)}</p>
                <p><strong>✨ Resultados Criados:</strong> ${escapeHtml(dados.produtos)}</p>
            </div>

            <div style="margin-bottom: 16px; text-align: center;">
                <h4 style="font-size: 1rem; color: var(--accent); margin-bottom: 8px; font-weight: 800; text-align: center;">🎓 Cursos &amp; Ações Gratuitas:</h4>
                <ul style="list-style: none; padding-left: 0; font-size: 0.88rem; line-height: 1.6; text-align: center;">
                    ${dados.cursos.map(c => `<li style="margin-bottom: 4px;"><strong>• ${escapeHtml(c)}</strong></li>`).join('')}
                </ul>
            </div>

            <div style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 14px 16px; border-radius: 12px; margin-bottom: 18px; font-size: 0.88rem; line-height: 1.55; text-align: center;">
                <p style="margin-bottom: 6px;"><strong>📌 Localização:</strong> ${escapeHtml(dados.endereco)}</p>
                <p style="margin-bottom: 6px;"><strong>📝 Requisitos:</strong> ${escapeHtml(dados.requisitos)}</p>
                <p style="margin-bottom: 6px;"><strong>📰 Divulgação na Mídia:</strong> ${escapeHtml(dados.midias)}</p>
                <p><strong>📱 Perfil nas Redes:</strong> <code>${escapeHtml(dados.redes)}</code></p>
            </div>

            <div class="modal-links-projeto">
                ${(links && links.length ? links : [{ href: dados.siteOficial, texto: '🌐 Conhecer no Site Oficial ↗' }]).map((l) => `
                    <p><a class="link-simples" href="${escapeHtml(l.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.texto)}</a></p>`).join('')}
            </div>
        </div>
    `;

    modal.classList.add('ativo');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-btn-fechar')?.focus();
}

function fecharModalProjeto(event) {
    if (event.target.id === 'modal-projeto') {
        fecharModalProjetoForcado();
    }
}

function fecharModalProjetoForcado() {
    const modal = document.getElementById('modal-projeto');
    if (modal) {
        modal.classList.remove('ativo');
        document.body.style.overflow = '';
        if (ultimoElementoFocado) ultimoElementoFocado.focus();
    }
}

// ==========================================
// 8. MODAL DE CERTIFICADO DE SUSTENTABILIDADE & MÉRITO
// ==========================================
function abrirModalCertificado() {
    ultimoElementoFocado = document.activeElement;
    tocarSom('fanfarra');
    const modal = document.getElementById('modal-certificado');
    if (modal) {
        modal.classList.add('ativo');
        document.body.style.overflow = 'hidden';
        
        const dataEl = document.getElementById('certificado-data-emissao');
        if (dataEl) {
            const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            dataEl.textContent = `São José dos Pinhais - PR, ${dataHoje}`;
        }
        document.getElementById('input-nome-certificado')?.focus();
    }
}

function fecharModalCertificado(event) {
    if (event.target.id === 'modal-certificado') {
        fecharModalCertificadoForcado();
    }
}

function fecharModalCertificadoForcado() {
    const modal = document.getElementById('modal-certificado');
    if (modal) {
        modal.classList.remove('ativo');
        document.body.style.overflow = '';
        if (ultimoElementoFocado) ultimoElementoFocado.focus();
    }
}

function atualizarNomeCertificado() {
    const input = document.getElementById('input-nome-certificado');
    const display = document.getElementById('certificado-nome-display');
    if (input && display) {
        display.textContent = input.value.trim() || 'Cidadão Consciente de SJP';
    }
}

function imprimirCertificado() {
    tocarSom('clique');
    window.print();
}

function voltarAoTopo() {
    tocarSom('clique');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 9. CARDS DE PROJETOS NO ESTILO "INSTAGRAM"
// ==========================================
const IDS_PROJETO = [
    [/borda viva/i, 'borda-viva'],
    [/gera(ç|c)(ã|a)o futuro/i, 'geracao-futuro'],
    [/cores fora/i, 'cores-fora-de-tela'],
    [/gem(ü|u)/i, 'gemu-brasil'],
    [/horse/i, 'horse-powertrain']
];

function aprimorarCardsProjetos() {
    document.querySelectorAll('.projeto-card').forEach((card) => {
        if (card.dataset.ig) return;
        card.dataset.ig = '1';
        const txt = (sel) => (card.querySelector(sel)?.textContent || '').trim();
        const empresa = txt('.projeto-empresa-header span').replace(/^Parceria:\s*/i, '') || 'Recicla SJP';
        const bairro = txt('.badge-bairro').replace('📍', '').trim();
        const tag = txt('.tag-tipo');

        const topo = document.createElement('div');
        topo.className = 'ig-topo';
        const avatar = document.createElement('span');
        avatar.className = 'ig-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = empresa.charAt(0).toUpperCase();
        const meta = document.createElement('div');
        meta.className = 'ig-meta';
        const nome = document.createElement('strong');
        nome.textContent = empresa;
        const local = document.createElement('small');
        local.textContent = bairro ? `📍 ${bairro}` : 'São José dos Pinhais';
        meta.append(nome, local);
        topo.append(avatar, meta);
        card.prepend(topo);

        const acoes = document.createElement('div');
        acoes.className = 'ig-acoes';
        const like = document.createElement('button');
        like.type = 'button';
        like.className = 'ig-btn ig-like';
        like.setAttribute('aria-pressed', 'false');
        like.setAttribute('aria-label', 'Curtir projeto');
        like.textContent = '♡';
        like.addEventListener('click', () => {
            const on = like.getAttribute('aria-pressed') !== 'true';
            like.setAttribute('aria-pressed', String(on));
            like.textContent = on ? '♥' : '♡';
            tocarSom('clique');
        });
        const hash = document.createElement('span');
        hash.className = 'ig-tag';
        hash.textContent = tag ? `#${tag.replace(/\s+/g, '')}` : '';
        const mais = document.createElement('button');
        mais.type = 'button';
        mais.className = 'ig-btn ig-mais';
        mais.setAttribute('aria-haspopup', 'dialog');
        mais.textContent = 'Ver detalhes';
        const titulo = txt('h3');
        const abrir = () => {
            const par = IDS_PROJETO.find(([re]) => re.test(titulo));
            const links = [...card.querySelectorAll('.projeto-link-container a')].map((a) => ({
                href: a.getAttribute('href'),
                texto: a.textContent.trim()
            }));
            if (par) abrirModalInscricao(par[1], links);
        };
        mais.addEventListener('click', abrir);
        const foto = card.querySelector('.projeto-imagem-container');
        if (foto) {
            foto.style.cursor = 'pointer';
            foto.addEventListener('click', abrir);
        }
        acoes.append(like, hash, mais);
        card.querySelector('.projeto-imagem-container')?.after(acoes);
    });
}

// ==========================================
// 10. INICIALIZADOR ÚNICO DO APLICATIVO
// ==========================================
function initApp() {
    aplicarTemaSalvo();
    atualizarBotaoSom();
    iniciarContadores();
    configurarCarrosselInstagram();
    configurarConsultaResiduos();
    configurarScrollProjetos();
    aprimorarCardsProjetos();
    popularSeletorBairros();
    carregarPergunta();

    // Inicializa resíduos com a primeira categoria (Plásticos) ativa
    const btnPlastico = document.querySelector('.chip-categoria.chip-plastico') || document.querySelector('.chip-categoria');
    if (btnPlastico) {
        const containerResiduos = document.getElementById('resultado-consulta-residuo');
        if (containerResiduos) {
            renderizarItensConsulta(baseResiduos.filter(item => item.grupo === 'plastico'), containerResiduos);
        }
    }

    // Listener de scroll único otimizado com requestAnimationFrame
    let scrollTicking = false;
    const progressBar = document.getElementById('scroll-progress');
    const btnTopo = document.getElementById('btn-topo');
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                const docElem = document.documentElement;
                const scrollTop = docElem.scrollTop || window.scrollY;
                const totalHeight = docElem.scrollHeight - docElem.clientHeight;
                const scrollPercent = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;

                if (progressBar) progressBar.style.width = `${scrollPercent}%`;
                if (btnTopo) btnTopo.classList.toggle('visivel', scrollTop > 380);
                if (navbar) navbar.classList.toggle('compacta', scrollTop > 24);

                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    // IntersectionObserver para animações de entrada, pausa do Hero fora da tela e Lazy Load do Mapa
    if ('IntersectionObserver' in window) {
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

        // Pausa animações infinitas do Hero quando sai da tela para economizar bateria/GPU
        const heroHeader = document.querySelector('header.hero-header');
        if (heroHeader) {
            const heroObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    heroHeader.classList.toggle('pausado', !entry.isIntersecting);
                });
            }, { threshold: 0 });
            heroObserver.observe(heroHeader);
        }

        // Lazy load do mapa quando a seção de agenda/mapa se aproxima (rootMargin 300px)
        const secaoMapa = document.getElementById('agenda-mapa-section');
        if (secaoMapa) {
            const mapaObserver = new IntersectionObserver((entries, obs) => {
                if (entries.some(e => e.isIntersecting)) {
                    inicializarMapa();
                    obs.disconnect();
                }
            }, { rootMargin: '300px 0px' });
            mapaObserver.observe(secaoMapa);
        } else {
            inicializarMapa();
        }
    } else {
        document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
        inicializarMapa();
    }
}

document.addEventListener("DOMContentLoaded", initApp);

// Fechar modais com a tecla Esc
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('modal-projeto')?.classList.contains('ativo')) {
            fecharModalProjetoForcado();
        }
        if (document.getElementById('modal-certificado')?.classList.contains('ativo')) {
            fecharModalCertificadoForcado();
        }
    }
});
