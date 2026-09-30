(() => {

    'use strict';


    /* =========================================================
       CONFIGURAÇÃO
    ========================================================= */

    const STORAGE_KEY = 'horariosTrabalho.v3';

    const MINUTOS_DIA = 1440;

    const ALMOCO_PADRAO = 60;

    const PRETENSAO_PADRAO = '9';


    /* =========================================================
       ELEMENTOS
    ========================================================= */

    const $ = (id) => document.getElementById(id);


    const els = {

        entrada: $('entrada'),

        saidaAlmoco: $('saidaAlmoco'),

        entradaAlmoco: $('entradaAlmoco'),

        saida: $('saida'),

        manha: $('manha'),

        tarde: $('tarde'),

        totalTrabalhado: $('totalTrabalhado'),

        tempoAlmoco: $('tempoAlmoco'),

        previsaoEntrada: $('previsaoEntrada'),

        saidaPrevista: $('saidaPrevista'),

        horasPretendidas: $('horasPretendidas'),

        resetBtn: $('resetBtn')

    };


    const inputsHora = [

        els.entrada,
        els.saidaAlmoco,
        els.entradaAlmoco,
        els.saida

    ];


    /* =========================================================
       TEMPO
    ========================================================= */

    function horaParaMinutos(valor) {

        if (typeof valor !== 'string') {
            return null;
        }

        const texto = valor.trim();

        if (!texto) {
            return null;
        }

        const partes = texto.split(':');

        if (partes.length > 2) {
            return null;
        }

        const hora = Number(partes[0]);

        const minuto = partes.length === 2
            ? Number(partes[1])
            : 0;


        if (!Number.isInteger(hora) || !Number.isInteger(minuto)) {
            return null;
        }


        if (hora < 0 || hora > 23) {
            return null;
        }


        if (minuto < 0 || minuto > 59) {
            return null;
        }


        return hora * 60 + minuto;

    }


    function minutosParaHora(minutos) {

        if (minutos == null || !Number.isFinite(minutos)) {
            return '--:--';
        }


        minutos = ((minutos % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;


        const hora = Math.floor(minutos / 60);

        const minuto = minutos % 60;


        return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;

    }


    function formatarDuracao(minutos) {

        if (minutos == null || !Number.isFinite(minutos)) {
            return '--:--';
        }


        const horas = Math.floor(minutos / 60);

        const minutosRestantes = minutos % 60;


        if (horas === 0) {
            return `${minutosRestantes}min`;
        }


        if (minutosRestantes === 0) {
            return `${horas}H`;
        }


        return `${horas}h ${String(minutosRestantes).padStart(2, '0')}min`;

    }


    /* =========================================================
       DIFERENÇA ENTRE HORÁRIOS
    ========================================================= */

    function calcularIntervalo(inicio, fim) {

        const inicioMin = horaParaMinutos(inicio);

        const fimMin = horaParaMinutos(fim);


        if (inicioMin == null || fimMin == null) {
            return null;
        }


        // Para jornada normal, o fim não pode ser
        // menor que o início.

        if (fimMin < inicioMin) {
            return null;
        }


        return fimMin - inicioMin;

    }


    /* =========================================================
       MÁSCARA
    ========================================================= */

    function aplicarMascara(input) {

        input.addEventListener('input', () => {

            let valor = input.value
                .replace(/\D/g, '')
                .slice(0, 4);


            if (valor.length >= 3) {

                valor =
                    `${valor.slice(0, valor.length - 2)}:${valor.slice(-2)}`;

            }


            input.value = valor;

            atualizar();

        });


        input.addEventListener('blur', () => {

            if (!input.value) {
                return;
            }


            const minutos = horaParaMinutos(input.value);


            if (minutos == null) {

                input.classList.add('input-erro');

                return;

            }


            input.classList.remove('input-erro');


            input.value = minutosParaHora(minutos);

            atualizar();

        });

    }


    inputsHora.forEach(aplicarMascara);


    /* =========================================================
       CÁLCULO
    ========================================================= */

    function calcular() {

        const manha = calcularIntervalo(
            els.entrada.value,
            els.saidaAlmoco.value
        );


        const tarde = calcularIntervalo(
            els.entradaAlmoco.value,
            els.saida.value
        );


        const almoco = calcularIntervalo(
            els.saidaAlmoco.value,
            els.entradaAlmoco.value
        );


        const total =
            (manha ?? 0) +
            (tarde ?? 0);


        const possuiTrabalho =
            manha != null ||
            tarde != null;


        /* Manhã */

        els.manha.textContent =
            manha != null
                ? formatarDuracao(manha)
                : '--:--';


        /* Tarde */

        els.tarde.textContent =
            tarde != null
                ? formatarDuracao(tarde)
                : '--:--';


        /* Total */

        els.totalTrabalhado.textContent =
            possuiTrabalho
                ? formatarDuracao(total)
                : '--:--';


        /* Almoço */

        els.tempoAlmoco.textContent =
            almoco != null
                ? formatarDuracao(almoco)
                : '--:--';


        calcularPrevisao(almoco);

    }


    /* =========================================================
       PREVISÃO
    ========================================================= */

    function calcularPrevisao(almocoAtual) {

        const entrada =
            horaParaMinutos(els.entrada.value);


        if (entrada == null) {

            els.previsaoEntrada.textContent = '--:--';

            els.saidaPrevista.textContent = '--:--';

            return;

        }


        const horas =
            Number(els.horasPretendidas.value);


        const minutosTrabalho =
            Math.round(horas * 60);


        /*
         * Se o usuário já informou o almoço,
         * utilizamos esse período.
         *
         * Caso contrário, usamos 1 hora.
         */

        const minutosAlmoco =
            almocoAtual != null
                ? almocoAtual
                : ALMOCO_PADRAO;


        const saida =
            entrada +
            minutosTrabalho +
            minutosAlmoco;


        els.previsaoEntrada.textContent =
            minutosParaHora(entrada);


        els.saidaPrevista.textContent =
            minutosParaHora(saida);

    }


    /* =========================================================
       STORAGE
    ========================================================= */

    function salvar() {

        const dados = {

            entrada: els.entrada.value,

            saidaAlmoco: els.saidaAlmoco.value,

            entradaAlmoco: els.entradaAlmoco.value,

            saida: els.saida.value,

            horasPretendidas:
                els.horasPretendidas.value

        };


        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(dados)
            );

        } catch (erro) {

            console.warn(
                'Não foi possível salvar os dados.',
                erro
            );

        }

    }


    function carregar() {

        try {

            const dadosSalvos =
                localStorage.getItem(STORAGE_KEY);


            if (!dadosSalvos) {
                return;
            }


            const dados =
                JSON.parse(dadosSalvos);


            els.entrada.value =
                dados.entrada ?? '';


            els.saidaAlmoco.value =
                dados.saidaAlmoco ?? '';


            els.entradaAlmoco.value =
                dados.entradaAlmoco ?? '';


            els.saida.value =
                dados.saida ?? '';


            els.horasPretendidas.value =
                dados.horasPretendidas ??
                PRETENSAO_PADRAO;


        } catch (erro) {

            console.warn(
                'Não foi possível carregar os dados.',
                erro
            );

        }

    }


    /* =========================================================
       ATUALIZAÇÃO
    ========================================================= */

    function atualizar() {

        calcular();

        salvar();

    }


    /* =========================================================
       RESET
    ========================================================= */

    function resetar() {

        inputsHora.forEach(input => {

            input.value = '';

            input.classList.remove('input-erro');

        });


        els.horasPretendidas.value =
            PRETENSAO_PADRAO;


        try {

            localStorage.removeItem(STORAGE_KEY);

        } catch (erro) {

            console.warn(
                'Não foi possível limpar os dados.',
                erro
            );

        }


        calcular();

    }


    /* =========================================================
       EVENTOS
    ========================================================= */

    els.horasPretendidas.addEventListener(
        'change',
        atualizar
    );


    els.resetBtn.addEventListener(
        'click',
        resetar
    );


    /* =========================================================
       INICIALIZAÇÃO
    ========================================================= */

    carregar();

    calcular();

})();