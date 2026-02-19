// ==========================================
// ANALISI SCOMMESSE - ALGORITMO AVANZATO
// ==========================================

let giocataManuale = "";
let datiAttuali = null;
let partitePrecedentiCache = [];
let sortDirection = { 2: 'desc', 3: 'desc' };

// ========== FUNZIONI MATEMATICHE AVANZATE ==========

/**
 * Calcola la distribuzione di Poisson per predizione gol
 * @param {number} lambda - Media gol attesi
 * @param {number} k - Numero specifico di gol
 * @returns {number} Probabilità
 */
function poisson(lambda, k) {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    let result = Math.exp(-lambda);
    for (let i = 1; i <= k; i++) {
        result *= lambda / i;
    }
    return result;
}

/**
 * Applica pesi temporali alle partite (più recenti = più importanti)
 * @param {Array} valori - Array di valori
 * @returns {number} Media pesata
 */
function mediaPesata(valori) {
    // Pesi decrescenti: ultima partita peso 1.0, prima peso 0.5
    const pesi = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5];
    let sommaPesata = 0;
    let sommaPesi = 0;
    
    for (let i = 0; i < valori.length && i < pesi.length; i++) {
        sommaPesata += valori[i] * pesi[i];
        sommaPesi += pesi[i];
    }
    
    return sommaPesi > 0 ? sommaPesata / sommaPesi : 0;
}

/**
 * Calcola l'indice di momentum (trend crescente/decrescente)
 * @param {Array} golFatti - Gol fatti nelle ultime partite (0=più recente, 5=più vecchia)
 * @param {Array} golSubiti - Gol subiti nelle ultime partite
 * @returns {number} Momentum index (-100 a +100)
 */
function calcolaMomentum(golFatti, golSubiti) {
    if (golFatti.length < 6) return 0;
    
    // Confronta partite RECENTI (0-2) vs partite VECCHIE (3-5)
    const partiteRecenti = golFatti.slice(0, 3);
    const partiteVecchie = golFatti.slice(3, 6);
    
    const puntiRecenti = partiteRecenti.reduce((sum, gf, i) => {
        const gs = golSubiti[i];
        return sum + (gf > gs ? 3 : gf === gs ? 1 : 0);
    }, 0);
    
    const puntiVecchi = partiteVecchie.reduce((sum, gf, i) => {
        const gs = golSubiti[i + 3];
        return sum + (gf > gs ? 3 : gf === gs ? 1 : 0);
    }, 0);
    
    // Momentum: % di miglioramento (positivo = in crescita, negativo = in calo)
    if (puntiVecchi === 0) return puntiRecenti > 0 ? 100 : 0;
    return ((puntiRecenti - puntiVecchi) / puntiVecchi) * 100;
}

/**
 * Calcola Strength of Schedule (forza avversari affrontati)
 * @param {Array} posizioniAvversari - Posizioni in classifica degli avversari
 * @param {number} totSquadre - Totale squadre in campionato
 * @returns {Object} {sos: number, completezza: number}
 */
function calcolaStrengthOfSchedule(posizioniAvversari, totSquadre) {
    const posizioniValide = posizioniAvversari.filter(p => p > 0 && p <= totSquadre);
    
    if (posizioniValide.length === 0) {
        return { sos: 0.5, completezza: 0 }; // Valore neutro se nessun dato
    }
    
    // SoS normalizzato: 0 = solo squadre forti, 1 = solo squadre deboli
    const mediaPosizioni = posizioniValide.reduce((a, b) => a + b, 0) / posizioniValide.length;
    const sos = mediaPosizioni / totSquadre;
    const completezza = posizioniValide.length / 6; // % di dati disponibili
    
    return { sos, completezza };
}

/**
 * Calcola Expected Goals (xG) con adjustment per difficoltà avversari
 * @param {number} mediaGolFatti - Media gol fatti
 * @param {number} mediaGolSubitiAvversario - Media gol subiti dall'avversario
 * @param {number} sosAdjustment - Adjustment per forza avversari (0.5-1.5)
 * @returns {number} Expected Goals
 */
function calcolaExpectedGoals(mediaGolFatti, mediaGolSubitiAvversario, sosAdjustment = 1.0) {
    // Formula: (attacco squadra * difesa avversario) / 2, pesato per 60-40
    const xg = (mediaGolFatti * 0.6 + mediaGolSubitiAvversario * 0.4) * sosAdjustment;
    return Math.max(0, xg);
}

/**
 * Calcola Confidence Score della predizione
 * @param {Object} datiSquadra - Dati completi squadra
 * @returns {Object} {score: number 0-100, level: string}
 */
function calcolaConfidenceScore(datiSquadra) {
    let score = 50; // Base confidence
    
    // 1. Consistenza risultati (bassa varianza = alta confidence)
    const varianzaGol = calcolaVarianza(datiSquadra.golFatti);
    if (varianzaGol < 1) score += 15;
    else if (varianzaGol > 3) score -= 15;
    
    // 2. Completezza dati posizione avversari
    const completezzaSoS = datiSquadra.sosCompletezza || 0;
    score += completezzaSoS * 20; // Fino a +20 se tutti i dati
    
    // 3. Trend chiaro (momentum forte)
    const momentum = Math.abs(datiSquadra.momentum || 0);
    if (momentum > 50) score += 15;
    else if (momentum < 20) score -= 10;
    
    // 4. Numero partite casa/trasferta
    const partiteCasa = datiSquadra.casaTrasferta.filter(ct => ct === 'C').length;
    const partiteTrasferta = 6 - partiteCasa;
    const bilanciamento = Math.min(partiteCasa, partiteTrasferta);
    score += bilanciamento * 2; // Dati più bilanciati = più affidabili
    
    // Limita tra 0 e 100
    score = Math.max(0, Math.min(100, score));
    
    // Determina livello
    let level = 'low';
    if (score >= 70) level = 'high';
    else if (score >= 45) level = 'medium';
    
    return { score: Math.round(score), level };
}

/**
 * Calcola varianza di un array
 */
function calcolaVarianza(array) {
    if (array.length === 0) return 0;
    const media = array.reduce((a, b) => a + b, 0) / array.length;
    const varianza = array.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / array.length;
    return varianza;
}

/**
 * Calcola probabilità 1X2 usando Poisson
 * @param {number} xgCasa - Expected goals casa
 * @param {number} xgTrasferta - Expected goals trasferta
 * @returns {Object} {prob1, probX, prob2}
 */
function calcolaProbabilita1X2Poisson(xgCasa, xgTrasferta) {
    let prob1 = 0, probX = 0, prob2 = 0;
    
    // Calcola probabilità per risultati fino a 5-5
    for (let i = 0; i <= 5; i++) {
        for (let j = 0; j <= 5; j++) {
            const probRisultato = poisson(xgCasa, i) * poisson(xgTrasferta, j);
            
            if (i > j) prob1 += probRisultato;
            else if (i === j) probX += probRisultato;
            else prob2 += probRisultato;
        }
    }
    
    // Normalizza per avere somma = 1
    const totale = prob1 + probX + prob2;
    if (totale > 0) {
        prob1 /= totale;
        probX /= totale;
        prob2 /= totale;
    }
    
    return {
        prob1: prob1 * 100,
        probX: probX * 100,
        prob2: prob2 * 100
    };
}

/**
 * Calcola probabilità Over/Under e Gol usando Poisson
 */
function calcolaProbabilitaOverUnder(xgCasa, xgTrasferta) {
    const totaleGol = xgCasa + xgTrasferta;
    
    // Over 0.5
    const probUnder05 = poisson(totaleGol, 0);
    const probOver05 = (1 - probUnder05) * 100;
    
    // Over 1.5
    const probUnder15 = poisson(totaleGol, 0) + poisson(totaleGol, 1);
    const probOver15 = (1 - probUnder15) * 100;
    
    // Over 2.5
    const probUnder25 = poisson(totaleGol, 0) + poisson(totaleGol, 1) + poisson(totaleGol, 2);
    const probOver25 = (1 - probUnder25) * 100;
    
    // Over 3.5
    const probUnder35 = probUnder25 + poisson(totaleGol, 3);
    const probOver35 = (1 - probUnder35) * 100;
    
    // Gol (entrambe segnano)
    const probNessunGolCasa = poisson(xgCasa, 0);
    const probNessunGolTrasferta = poisson(xgTrasferta, 0);
    const probGol = (1 - probNessunGolCasa) * (1 - probNessunGolTrasferta) * 100;
    
    return {
        probOver05,
        probOver15,
        probOver25,
        probOver35,
        probGol,
        probNoGol: 100 - probGol
    };
}

// ========== FUNZIONE PRINCIPALE CALCOLO RISULTATI ==========

function calcolaRisultati() {
    const form = document.getElementById('formAnalisi');
    const formData = new FormData(form);
    const nomeSquadraA = document.getElementById('nomeSquadraA').value || "Squadra A";
    const nomeSquadraB = document.getElementById('nomeSquadraB').value || "Squadra B";

    // Aggiorna intestazioni
    document.getElementById('titoloSquadraA').textContent = `${nomeSquadraA} (Casa)`;
    document.getElementById('titoloSquadraB').textContent = `${nomeSquadraB} (Trasferta)`;
    document.getElementById('nomeRisultatiA').textContent = nomeSquadraA;
    document.getElementById('nomeRisultatiB').textContent = nomeSquadraB;
    document.getElementById('casaSquadraA').textContent = `${nomeSquadraA} (Casa)`;
    document.getElementById('trasfertaSquadraB').textContent = `${nomeSquadraB} (Trasferta)`;
    document.getElementById('nomeStatA').textContent = nomeSquadraA;
    document.getElementById('nomeStatB').textContent = nomeSquadraB;

    // --- RACCOLTA DATI SQUADRA A ---
    let golFattiA = [], golSubitiA = [], casaTrasfertaA = [], avversariA = [], esitiA = [], posizioniAvversariA = [];
    
    for (let i = 1; i <= 6; i++) {
        const gf = parseInt(formData.get(`golFattiA${i}`)) || 0;
        const gs = parseInt(formData.get(`golSubitiA${i}`)) || 0;
        const ct = formData.get(`casaTrasfertaA${i}`).toUpperCase();
        const avv = formData.get(`avversarioA${i}`) || '';
        const posAvv = parseInt(formData.get(`posAvvA${i}`)) || 0;
        
        golFattiA.push(gf);
        golSubitiA.push(gs);
        casaTrasfertaA.push(ct);
        avversariA.push(avv);
        posizioniAvversariA.push(posAvv);
        
        const esito = gf > gs ? 'V' : (gf < gs ? 'S' : 'P');
        esitiA.push(esito);
        
        // Aggiorna UI esito
        const esitoCell = document.querySelectorAll('#squadraA .esito')[i-1];
        if (esitoCell) {
            esitoCell.textContent = esito;
            esitoCell.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta');
        }
    }

    // --- RACCOLTA DATI SQUADRA B ---
    let golFattiB = [], golSubitiB = [], casaTrasfertaB = [], avversariB = [], esitiB = [], posizioniAvversariB = [];
    
    for (let i = 1; i <= 6; i++) {
        const gf = parseInt(formData.get(`golFattiB${i}`)) || 0;
        const gs = parseInt(formData.get(`golSubitiB${i}`)) || 0;
        const ct = formData.get(`casaTrasfertaB${i}`).toUpperCase();
        const avv = formData.get(`avversarioB${i}`) || '';
        const posAvv = parseInt(formData.get(`posAvvB${i}`)) || 0;
        
        golFattiB.push(gf);
        golSubitiB.push(gs);
        casaTrasfertaB.push(ct);
        avversariB.push(avv);
        posizioniAvversariB.push(posAvv);
        
        const esito = gf > gs ? 'V' : (gf < gs ? 'S' : 'P');
        esitiB.push(esito);
        
        const esitoCell = document.querySelectorAll('#squadraB .esito')[i-1];
        if (esitoCell) {
            esitoCell.textContent = esito;
            esitoCell.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta');
        }
    }

    // Parametri aggiuntivi
    let posizioneA = parseInt(formData.get('posizioneA')) || 1;
    let totSquadreA = parseInt(formData.get('totSquadreA')) || 20;
    let coeffA = parseFloat(formData.get('coeffA')) || 0;
    let posizioneB = parseInt(formData.get('posizioneB')) || 1;
    let totSquadreB = parseInt(formData.get('totSquadreB')) || 20;
    let coeffB = parseFloat(formData.get('coeffB')) || 0;

    // === CALCOLI AVANZATI SQUADRA A ===
    
    // Medie base
    const mediaGolFattiA = golFattiA.reduce((a, b) => a + b, 0) / 6;
    const mediaGolSubitiA = golSubitiA.reduce((a, b) => a + b, 0) / 6;
    
    // Medie pesate (partite recenti contano di più)
    const mediaGolFattiPesataA = mediaPesata(golFattiA);
    const mediaGolSubitiPesataA = mediaPesata(golSubitiA);
    
    // Statistiche casa/trasferta
    const indiciCasaA = casaTrasfertaA.map((ct, i) => ct === 'C' ? i : -1).filter(i => i >= 0);
    const indiciTrasfertaA = casaTrasfertaA.map((ct, i) => ct === 'T' ? i : -1).filter(i => i >= 0);
    
    const golFattiCasaA = indiciCasaA.map(i => golFattiA[i]);
    const golSubitiCasaA = indiciCasaA.map(i => golSubitiA[i]);
    const golFattiTrasfertaA = indiciTrasfertaA.map(i => golFattiA[i]);
    const golSubitiTrasfertaA = indiciTrasfertaA.map(i => golSubitiA[i]);
    
    const mediaGolFattiCasaA = golFattiCasaA.length ? golFattiCasaA.reduce((a, b) => a + b, 0) / golFattiCasaA.length : 0;
    const mediaGolSubitiCasaA = golSubitiCasaA.length ? golSubitiCasaA.reduce((a, b) => a + b, 0) / golSubitiCasaA.length : 0;
    const mediaGolFattiTrasfertaA = golFattiTrasfertaA.length ? golFattiTrasfertaA.reduce((a, b) => a + b, 0) / golFattiTrasfertaA.length : 0;
    const mediaGolSubitiTrasfertaA = golSubitiTrasfertaA.length ? golSubitiTrasfertaA.reduce((a, b) => a + b, 0) / golSubitiTrasfertaA.length : 0;
    
    // Punti e risultati
    const vittorieA = golFattiA.filter((gf, i) => gf > golSubitiA[i]).length;
    const pareggiA = golFattiA.filter((gf, i) => gf === golSubitiA[i]).length;
    const sconfitteA = 6 - vittorieA - pareggiA;
    const puntiA = (vittorieA * 3) + pareggiA;
    
    const vittorieCasaA = golFattiCasaA.filter((gf, i) => gf > golSubitiCasaA[i]).length;
    const pareggiCasaA = golFattiCasaA.filter((gf, i) => gf === golSubitiCasaA[i]).length;
    const sconfitteCasaA = golFattiCasaA.length - vittorieCasaA - pareggiCasaA;
    
    const vittorieTrasfertaA = golFattiTrasfertaA.filter((gf, i) => gf > golSubitiTrasfertaA[i]).length;
    const pareggiTrasfertaA = golFattiTrasfertaA.filter((gf, i) => gf === golSubitiTrasfertaA[i]).length;
    const sconfitteTrasfertaA = golFattiTrasfertaA.length - vittorieTrasfertaA - pareggiTrasfertaA;
    
    // Calcoli avanzati
    const momentumA = calcolaMomentum(golFattiA, golSubitiA);
    const sosA = calcolaStrengthOfSchedule(posizioniAvversariA, totSquadreA);
    
    // Punteggio complessivo (formula migliorata)
    const formaA = puntiA / 18; // 0-1
    const posizioneNormA = 1 - ((posizioneA - 1) / (totSquadreA - 1)); // 0-1, migliore = più alto
    const attaccoA = mediaGolFattiPesataA / 3; // Normalizzato assumendo 3 gol = ottimo
    const difesaA = 1 - (mediaGolSubitiPesataA / 3); // Invertito
    const momentumNormA = (momentumA + 100) / 200; // -100,+100 -> 0-1
    
    let punteggioTotaleA = (formaA * 0.3 + posizioneNormA * 0.25 + attaccoA * 0.2 + difesaA * 0.15 + momentumNormA * 0.1);
    
    // Adjustment per coefficiente e SoS
    if (coeffA > 0) punteggioTotaleA += coeffA * 0.05;
    if (sosA.completezza > 0.5) {
        // Se ha affrontato squadre forti (sos basso), bonus
        punteggioTotaleA += (1 - sosA.sos) * 0.05;
    }
    
    punteggioTotaleA = Math.max(0, Math.min(1, punteggioTotaleA));

    // === CALCOLI AVANZATI SQUADRA B ===
    
    const mediaGolFattiB = golFattiB.reduce((a, b) => a + b, 0) / 6;
    const mediaGolSubitiB = golSubitiB.reduce((a, b) => a + b, 0) / 6;
    const mediaGolFattiPesataB = mediaPesata(golFattiB);
    const mediaGolSubitiPesataB = mediaPesata(golSubitiB);
    
    const indiciCasaB = casaTrasfertaB.map((ct, i) => ct === 'C' ? i : -1).filter(i => i >= 0);
    const indiciTrasfertaB = casaTrasfertaB.map((ct, i) => ct === 'T' ? i : -1).filter(i => i >= 0);
    
    const golFattiCasaB = indiciCasaB.map(i => golFattiB[i]);
    const golSubitiCasaB = indiciCasaB.map(i => golSubitiB[i]);
    const golFattiTrasfertaB = indiciTrasfertaB.map(i => golFattiB[i]);
    const golSubitiTrasfertaB = indiciTrasfertaB.map(i => golSubitiB[i]);
    
    const mediaGolFattiCasaB = golFattiCasaB.length ? golFattiCasaB.reduce((a, b) => a + b, 0) / golFattiCasaB.length : 0;
    const mediaGolSubitiCasaB = golSubitiCasaB.length ? golSubitiCasaB.reduce((a, b) => a + b, 0) / golSubitiCasaB.length : 0;
    const mediaGolFattiTrasfertaB = golFattiTrasfertaB.length ? golFattiTrasfertaB.reduce((a, b) => a + b, 0) / golFattiTrasfertaB.length : 0;
    const mediaGolSubitiTrasfertaB = golSubitiTrasfertaB.length ? golSubitiTrasfertaB.reduce((a, b) => a + b, 0) / golSubitiTrasfertaB.length : 0;
    
    const vittorieB = golFattiB.filter((gf, i) => gf > golSubitiB[i]).length;
    const pareggiB = golFattiB.filter((gf, i) => gf === golSubitiB[i]).length;
    const sconfitteB = 6 - vittorieB - pareggiB;
    const puntiB = (vittorieB * 3) + pareggiB;
    
    const vittorieCasaB = golFattiCasaB.filter((gf, i) => gf > golSubitiCasaB[i]).length;
    const pareggiCasaB = golFattiCasaB.filter((gf, i) => gf === golSubitiCasaB[i]).length;
    const sconfitteCasaB = golFattiCasaB.length - vittorieCasaB - pareggiCasaB;
    
    const vittorieTrasfertaB = golFattiTrasfertaB.filter((gf, i) => gf > golSubitiTrasfertaB[i]).length;
    const pareggiTrasfertaB = golFattiTrasfertaB.filter((gf, i) => gf === golSubitiTrasfertaB[i]).length;
    const sconfitteTrasfertaB = golFattiTrasfertaB.length - vittorieTrasfertaB - pareggiTrasfertaB;
    
    const momentumB = calcolaMomentum(golFattiB, golSubitiB);
    const sosB = calcolaStrengthOfSchedule(posizioniAvversariB, totSquadreB);
    
    const formaB = puntiB / 18;
    const posizioneNormB = 1 - ((posizioneB - 1) / (totSquadreB - 1));
    const attaccoB = mediaGolFattiPesataB / 3;
    const difesaB = 1 - (mediaGolSubitiPesataB / 3);
    const momentumNormB = (momentumB + 100) / 200;
    
    let punteggioTotaleB = (formaB * 0.3 + posizioneNormB * 0.25 + attaccoB * 0.2 + difesaB * 0.15 + momentumNormB * 0.1);
    
    if (coeffB > 0) punteggioTotaleB += coeffB * 0.05;
    if (sosB.completezza > 0.5) {
        punteggioTotaleB += (1 - sosB.sos) * 0.05;
    }
    
    punteggioTotaleB = Math.max(0, Math.min(1, punteggioTotaleB));

    // === EXPECTED GOALS CON POISSON ===
    
    // SoS adjustment: se ha affrontato avversari forti, aumenta valore attacco
    const sosAdjustmentA = sosA.completezza > 0.5 ? (1 + (1 - sosA.sos) * 0.3) : 1.0;
    const sosAdjustmentB = sosB.completezza > 0.5 ? (1 + (1 - sosB.sos) * 0.3) : 1.0;
    
    // Expected goals casa: attacco casa A vs difesa trasferta B
    const xgCasa = calcolaExpectedGoals(
        mediaGolFattiCasaA || mediaGolFattiPesataA,
        mediaGolSubitiTrasfertaB || mediaGolSubitiPesataB,
        sosAdjustmentA
    );
    
    // Expected goals trasferta: attacco trasferta B vs difesa casa A
    const xgTrasferta = calcolaExpectedGoals(
        mediaGolFattiTrasfertaB || mediaGolFattiPesataB,
        mediaGolSubitiCasaA || mediaGolSubitiPesataA,
        sosAdjustmentB
    );

    // === PROBABILITÀ CON POISSON ===
    
    const prob1X2 = calcolaProbabilita1X2Poisson(xgCasa, xgTrasferta);
    const probOverUnder = calcolaProbabilitaOverUnder(xgCasa, xgTrasferta);
    
    // === CONFIDENCE SCORE ===
    
    const confidenceA = calcolaConfidenceScore({
        golFatti: golFattiA,
        golSubiti: golSubitiA,
        casaTrasferta: casaTrasfertaA,
        momentum: momentumA,
        sosCompletezza: sosA.completezza
    });
    
    const confidenceB = calcolaConfidenceScore({
        golFatti: golFattiB,
        golSubiti: golSubitiB,
        casaTrasferta: casaTrasfertaB,
        momentum: momentumB,
        sosCompletezza: sosB.completezza
    });
    
    // Confidence media
    const confidenceMedia = Math.round((confidenceA.score + confidenceB.score) / 2);
    const confidenceLevel = confidenceMedia >= 70 ? 'high' : confidenceMedia >= 45 ? 'medium' : 'low';

    // === POPOLA TABELLE RISULTATI ===
    
    popolaTabellaRisultati('A', {
        punteggio: punteggioTotaleA,
        punti: puntiA,
        vittorie: vittorieA,
        pareggi: pareggiA,
        sconfitte: sconfitteA,
        mediaGolFatti: mediaGolFattiA,
        mediaGolSubiti: mediaGolSubitiA,
        mediaGolFattiPesata: mediaGolFattiPesataA,
        mediaGolSubitiPesata: mediaGolSubitiPesataA,
        golFatti: golFattiA,
        golSubiti: golSubitiA,
        esiti: esitiA,
        momentum: momentumA,
        sos: sosA
    });
    
    popolaTabellaRisultati('B', {
        punteggio: punteggioTotaleB,
        punti: puntiB,
        vittorie: vittorieB,
        pareggi: pareggiB,
        sconfitte: sconfitteB,
        mediaGolFatti: mediaGolFattiB,
        mediaGolSubiti: mediaGolSubitiB,
        mediaGolFattiPesata: mediaGolFattiPesataB,
        mediaGolSubitiPesata: mediaGolSubitiPesataB,
        golFatti: golFattiB,
        golSubiti: golSubitiB,
        esiti: esitiB,
        momentum: momentumB,
        sos: sosB
    });

    // === POPOLA PERCENTUALI ESITI ===
    
    popolaPercentualiEsiti(golFattiA, golSubitiA, golFattiB, golSubitiB);
    
    // === POPOLA TENDENZA CASA/TRASFERTA ===
    
    popolaTendenzaCasaTrasferta({
        nomeSquadraA,
        nomeSquadraB,
        casaA: { vittorie: vittorieCasaA, pareggi: pareggiCasaA, sconfitte: sconfitteCasaA, mediaGolFatti: mediaGolFattiCasaA, mediaGolSubiti: mediaGolSubitiCasaA, partite: golFattiCasaA.length },
        trasfertaB: { vittorie: vittorieTrasfertaB, pareggi: pareggiTrasfertaB, sconfitte: sconfitteTrasfertaB, mediaGolFatti: mediaGolFattiTrasfertaB, mediaGolSubiti: mediaGolSubitiTrasfertaB, partite: golFattiTrasfertaB.length },
        punteggioSpecCasaA: punteggioTotaleA,
        punteggioSpecTrasfB: punteggioTotaleB
    });
    
    // === POPOLA ANALISI DETTAGLIATA (COMPLETAMENTE RISCRITTA) ===
    
    popolaAnalisiDettagliata({
        nomeSquadraA,
        nomeSquadraB,
        xgCasa,
        xgTrasferta,
        prob1X2,
        probOverUnder,
        punteggioA: punteggioTotaleA,
        punteggioB: punteggioTotaleB,
        momentumA,
        momentumB,
        sosA,
        sosB,
        confidenceA,
        confidenceB,
        confidenceMedia,
        confidenceLevel,
        datiA: {
            punti: puntiA,
            vittorie: vittorieA,
            mediaGolFatti: mediaGolFattiA,
            mediaGolSubiti: mediaGolSubitiA,
            cleanSheets: golSubitiA.filter(g => g === 0).length,
            golFatti: golFattiA,
            golSubiti: golSubitiA
        },
        datiB: {
            punti: puntiB,
            vittorie: vittorieB,
            mediaGolFatti: mediaGolFattiB,
            mediaGolSubiti: mediaGolSubitiB,
            cleanSheets: golSubitiB.filter(g => g === 0).length,
            golFatti: golFattiB,
            golSubiti: golSubitiB
        }
    });

    // === SALVA DATI ATTUALI ===
    
    datiAttuali = {
        nomeSquadraA, nomeSquadraB,
        golFattiA, golSubitiA, casaTrasfertaA, avversariA, posizioniAvversariA,
        golFattiB, golSubitiB, casaTrasfertaB, avversariB, posizioniAvversariB,
        posizioneA, totSquadreA, coeffA,
        posizioneB, totSquadreB, coeffB,
        punteggioTotaleA, punteggioTotaleB,
        xgCasa, xgTrasferta,
        prob1X2, probOverUnder,
        confidenceScore: confidenceMedia
    };
    
    localStorage.setItem('ultimiDati', JSON.stringify(datiAttuali));
    
    // Apri automaticamente sezione risultati
    document.getElementById('moduloRisultati').setAttribute('open', '');
}

// ========== FUNZIONI UI ==========

function popolaTabellaRisultati(squadra, dati) {
    const tbody = document.getElementById(`risultatiSquadra${squadra}`).querySelector('tbody');
    tbody.innerHTML = '';
    
    // Punteggio
    const rowPunteggio = `
        <tr>
            <td><strong>Punteggio Complessivo</strong></td>
            <td><span class="punteggio">${(dati.punteggio * 100).toFixed(1)}</span></td>
        </tr>
    `;
    
    // Punti
    const rowPunti = `
        <tr>
            <td>Punti (ultime 6)</td>
            <td><strong>${dati.punti}/18</strong> (V:${dati.vittorie} P:${dati.pareggi} S:${dati.sconfitte})</td>
        </tr>
    `;
    
    // Medie gol
    const rowGol = `
        <tr>
            <td>Media Gol Fatti</td>
            <td>${dati.mediaGolFatti.toFixed(2)}</td>
        </tr>
        <tr>
            <td>Media Gol Subiti</td>
            <td>${dati.mediaGolSubiti.toFixed(2)}</td>
        </tr>
    `;
    
    // Momentum
    const momentumIcon = dati.momentum > 20 ? '📈' : dati.momentum < -20 ? '📉' : '➡️';
    const momentumColor = dati.momentum > 20 ? '#34C759' : dati.momentum < -20 ? '#FF3B30' : '#8E8E93';
    const momentumText = dati.momentum > 20 ? 'In crescita' : dati.momentum < -20 ? 'In calo' : 'Stabile';
    const rowMomentum = `
        <tr>
            <td>Trend Forma</td>
            <td>${momentumIcon} ${momentumText} <span style="color: ${momentumColor}; font-weight: 700;">${dati.momentum > 0 ? '+' : ''}${dati.momentum.toFixed(0)}%</span></td>
        </tr>
    `;
    
    // Strength of Schedule
    const sosText = dati.sos.completezza > 0.5 ? 
        `Difficoltà: ${((1 - dati.sos.sos) * 100).toFixed(0)}% <small>(${(dati.sos.completezza * 100).toFixed(0)}% dati)</small>` :
        '<small style="color: #8E8E93;">Dati posizioni avversari non disponibili</small>';
    const rowSos = `
        <tr>
            <td>Difficoltà Avversari</td>
            <td>${sosText}</td>
        </tr>
    `;
    
    // Sequenza esiti
    const sequenza = dati.esiti.map(e => {
        const classe = e === 'V' ? 'vittoria' : e === 'P' ? 'pareggio' : 'sconfitta';
        return `<span class="esito ${classe}">${e}</span>`;
    }).join('');
    
    const rowSequenza = `
        <tr>
            <td>Sequenza (recente → vecchia)</td>
            <td class="sequenza-cell"><div id="sequenza${squadra}">${sequenza}</div></td>
        </tr>
    `;
    
    tbody.innerHTML = rowPunteggio + rowPunti + rowGol + rowMomentum + rowSos + rowSequenza;
}

function popolaPercentualiEsiti(golFattiA, golSubitiA, golFattiB, golSubitiB) {
    const tbody = document.getElementById('percentualiEsiti').querySelector('tbody');
    tbody.innerHTML = '';
    
    // Calcoli totali gol per partita
    const totaliA = golFattiA.map((gf, i) => gf + golSubitiA[i]);
    const totaliB = golFattiB.map((gf, i) => gf + golSubitiB[i]);
    const totaliCombinati = [...totaliA, ...totaliB];
    
    // === GOL / NO GOL ===
    const golA = golFattiA.filter((gf, i) => gf > 0 && golSubitiA[i] > 0).length / 6 * 100;
    const nogolA = golFattiA.filter((gf, i) => gf === 0 || golSubitiA[i] === 0).length / 6 * 100;
    const golB = golFattiB.filter((gf, i) => gf > 0 && golSubitiB[i] > 0).length / 6 * 100;
    const nogolB = golFattiB.filter((gf, i) => gf === 0 || golSubitiB[i] === 0).length / 6 * 100;
    const golTot = [...golFattiA, ...golFattiB].filter((gf, i) => {
        const gs = i < 6 ? golSubitiA[i] : golSubitiB[i - 6];
        return gf > 0 && gs > 0;
    }).length / 12 * 100;
    const nogolTot = 100 - golTot;
    
    // === CLEAN SHEET ===
    const cleanSheetA = golSubitiA.filter(gs => gs === 0).length / 6 * 100;
    const cleanSheetB = golSubitiB.filter(gs => gs === 0).length / 6 * 100;
    const cleanSheetTot = [...golSubitiA, ...golSubitiB].filter(gs => gs === 0).length / 12 * 100;
    
    // === OVER 0.5 SQUADRA ===
    const over05A = golFattiA.filter(gf => gf >= 1).length / 6 * 100;
    const over05B = golFattiB.filter(gf => gf >= 1).length / 6 * 100;
    const over05Tot = [...golFattiA, ...golFattiB].filter(gf => gf >= 1).length / 12 * 100;
    
    // === OVER/UNDER 1.5 TOTALE ===
    const over15A = totaliA.filter(t => t >= 2).length / 6 * 100;
    const under15A = 100 - over15A;
    const over15B = totaliB.filter(t => t >= 2).length / 6 * 100;
    const under15B = 100 - over15B;
    const over15Tot = totaliCombinati.filter(t => t >= 2).length / 12 * 100;
    const under15Tot = 100 - over15Tot;
    
    // === OVER/UNDER 2.5 TOTALE ===
    const over25A = totaliA.filter(t => t > 2).length / 6 * 100;
    const under25A = 100 - over25A;
    const over25B = totaliB.filter(t => t > 2).length / 6 * 100;
    const under25B = 100 - over25B;
    const over25Tot = totaliCombinati.filter(t => t > 2).length / 12 * 100;
    const under25Tot = 100 - over25Tot;
    
    // === OVER/UNDER 3.5 TOTALE ===
    const over35A = totaliA.filter(t => t > 3).length / 6 * 100;
    const under35A = 100 - over35A;
    const over35B = totaliB.filter(t => t > 3).length / 6 * 100;
    const under35B = 100 - over35B;
    const over35Tot = totaliCombinati.filter(t => t > 3).length / 12 * 100;
    const under35Tot = 100 - over35Tot;
    
    // === MULTIGOL ===
    const mg13A = totaliA.filter(t => t >= 1 && t <= 3).length / 6 * 100;
    const mg24A = totaliA.filter(t => t >= 2 && t <= 4).length / 6 * 100;
    const mg35A = totaliA.filter(t => t >= 3 && t <= 5).length / 6 * 100;
    const mg13B = totaliB.filter(t => t >= 1 && t <= 3).length / 6 * 100;
    const mg24B = totaliB.filter(t => t >= 2 && t <= 4).length / 6 * 100;
    const mg35B = totaliB.filter(t => t >= 3 && t <= 5).length / 6 * 100;
    const mg13Tot = totaliCombinati.filter(t => t >= 1 && t <= 3).length / 12 * 100;
    const mg24Tot = totaliCombinati.filter(t => t >= 2 && t <= 4).length / 12 * 100;
    const mg35Tot = totaliCombinati.filter(t => t >= 3 && t <= 5).length / 12 * 100;
    
    // Costruisci HTML
    const percentuali = [
        { categoria: 'GOL / NO GOL', dati: [
            { nome: 'Gol (entrambe)', valA: golA, valB: golB, valTot: golTot, ids: ['golA', 'golB', 'golTot'] },
            { nome: 'No Gol (almeno una)', valA: nogolA, valB: nogolB, valTot: nogolTot, ids: ['nogolA', 'nogolB', 'nogolTot'] }
        ]},
        { categoria: 'CLEAN SHEET', dati: [
            { nome: 'Clean Sheet', valA: cleanSheetA, valB: cleanSheetB, valTot: cleanSheetTot, ids: ['cleanSheetA', 'cleanSheetB', 'cleanSheetTot'] }
        ]},
        { categoria: 'OVER 0.5 SQUADRA', dati: [
            { nome: 'Over 0.5 (segna)', valA: over05A, valB: over05B, valTot: over05Tot, ids: ['over05A', 'over05B', 'over05Tot'] }
        ]},
        { categoria: 'OVER/UNDER 1.5', dati: [
            { nome: 'Over 1.5', valA: over15A, valB: over15B, valTot: over15Tot, ids: ['over15A', 'over15B', 'over15Tot'] },
            { nome: 'Under 1.5', valA: under15A, valB: under15B, valTot: under15Tot, ids: ['under15A', 'under15B', 'under15Tot'] }
        ]},
        { categoria: 'OVER/UNDER 2.5', dati: [
            { nome: 'Over 2.5', valA: over25A, valB: over25B, valTot: over25Tot, ids: ['over25A', 'over25B', 'over25Tot'] },
            { nome: 'Under 2.5', valA: under25A, valB: under25B, valTot: under25Tot, ids: ['under25A', 'under25B', 'under25Tot'] }
        ]},
        { categoria: 'OVER/UNDER 3.5', dati: [
            { nome: 'Over 3.5', valA: over35A, valB: over35B, valTot: over35Tot, ids: ['over35A', 'over35B', 'over35Tot'] },
            { nome: 'Under 3.5', valA: under35A, valB: under35B, valTot: under35Tot, ids: ['under35A', 'under35B', 'under35Tot'] }
        ]},
        { categoria: 'MULTIGOL', dati: [
            { nome: 'Multigol 1-3', valA: mg13A, valB: mg13B, valTot: mg13Tot, ids: ['mg13A', 'mg13B', 'mg13Tot'] },
            { nome: 'Multigol 2-4', valA: mg24A, valB: mg24B, valTot: mg24Tot, ids: ['mg24A', 'mg24B', 'mg24Tot'] },
            { nome: 'Multigol 3-5', valA: mg35A, valB: mg35B, valTot: mg35Tot, ids: ['mg35A', 'mg35B', 'mg35Tot'] }
        ]}
    ];
    
    percentuali.forEach(gruppo => {
        // Header categoria
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `<td colspan="4" style="background: #F2F2F7; font-weight: 700; text-align: left; padding: 10px; font-size: 14px;">${gruppo.categoria}</td>`;
        tbody.appendChild(headerRow);
        
        // Righe dati
        gruppo.dati.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align: left; padding-left: 20px;">${item.nome}</td>
                <td><span class="perc" id="${item.ids[0]}">${item.valA.toFixed(1)}%</span></td>
                <td><span class="perc" id="${item.ids[1]}">${item.valB.toFixed(1)}%</span></td>
                <td><span class="perc" id="${item.ids[2]}">${item.valTot.toFixed(1)}%</span></td>
            `;
            tbody.appendChild(row);
            
            // Colora percentuali
            coloraPercentuale(item.valA, document.getElementById(item.ids[0]));
            coloraPercentuale(item.valB, document.getElementById(item.ids[1]));
            coloraPercentuale(item.valTot, document.getElementById(item.ids[2]));
        });
    });
}

function coloraPercentuale(valore, elemento) {
    if (isNaN(valore)) {
        elemento.style.backgroundColor = '#6c757d';
        elemento.textContent = 'N/D';
        return;
    }
    
    let color;
    if (valore >= 70) color = '#52b788';
    else if (valore >= 55) color = '#74c69d';
    else if (valore >= 40) color = '#f4a261';
    else if (valore >= 25) color = '#e76f51';
    else color = '#e63946';
    
    elemento.style.backgroundColor = color;
    if (!elemento.textContent.includes('%')) {
        elemento.textContent = valore.toFixed(1) + '%';
    }
}

function popolaTendenzaCasaTrasferta(dati) {
    const tbody = document.getElementById('tendenzaCasaTrasfertaTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    const percVittCasaA = dati.casaA.partite > 0 ? (dati.casaA.vittorie / dati.casaA.partite * 100) : 0;
    const percParCasaA = dati.casaA.partite > 0 ? (dati.casaA.pareggi / dati.casaA.partite * 100) : 0;
    const percSconfCasaA = dati.casaA.partite > 0 ? (dati.casaA.sconfitte / dati.casaA.partite * 100) : 0;
    
    const percVittTrasfB = dati.trasfertaB.partite > 0 ? (dati.trasfertaB.vittorie / dati.trasfertaB.partite * 100) : 0;
    const percParTrasfB = dati.trasfertaB.partite > 0 ? (dati.trasfertaB.pareggi / dati.trasfertaB.partite * 100) : 0;
    const percSconfTrasfB = dati.trasfertaB.partite > 0 ? (dati.trasfertaB.sconfitte / dati.trasfertaB.partite * 100) : 0;
    
    tbody.innerHTML = `
        <tr>
            <td rowspan="4"><strong>${dati.nomeSquadraA} (Casa)</strong></td>
            <td>Vittorie</td>
            <td><span class="perc" id="vittorieCasaA">${percVittCasaA.toFixed(1)}%</span></td>
        </tr>
        <tr>
            <td>Pareggi</td>
            <td><span class="perc">${percParCasaA.toFixed(1)}%</span></td>
        </tr>
        <tr>
            <td>Sconfitte</td>
            <td><span class="perc" id="sconfitteCasaA">${percSconfCasaA.toFixed(1)}%</span></td>
        </tr>
        <tr>
            <td>Media Gol</td>
            <td>${dati.casaA.mediaGolFatti.toFixed(2)} fatti, ${dati.casaA.mediaGolSubiti.toFixed(2)} subiti</td>
        </tr>
        <tr>
            <td rowspan="4"><strong>${dati.nomeSquadraB} (Trasferta)</strong></td>
            <td>Vittorie</td>
            <td><span class="perc" id="vittorieTrasfertaB">${percVittTrasfB.toFixed(1)}%</span></td>
        </tr>
        <tr>
            <td>Pareggi</td>
            <td><span class="perc">${percParTrasfB.toFixed(1)}%</span></td>
        </tr>
        <tr>
            <td>Sconfitte</td>
            <td><span class="perc" id="sconfitteTrasfertaB">${percSconfTrasfB.toFixed(1)}%</span></td>
        </tr>
        <tr>
            <td>Media Gol</td>
            <td>${dati.trasfertaB.mediaGolFatti.toFixed(2)} fatti, ${dati.trasfertaB.mediaGolSubiti.toFixed(2)} subiti</td>
        </tr>
        <tr>
            <td colspan="2"><strong>Punteggio Specifico C/T</strong></td>
            <td id="punteggioSpecifico"><span class="punteggio" id="punteggioCasaA">${(dati.punteggioSpecCasaA * 100).toFixed(1)}</span> vs <span class="punteggio" id="punteggioCasaB">${(dati.punteggioSpecTrasfB * 100).toFixed(1)}</span></td>
        </tr>
    `;
    
    document.querySelectorAll('#tendenzaCasaTrasfertaTable .perc').forEach(elem => {
        const val = parseFloat(elem.textContent);
        coloraPercentuale(val, elem);
    });
}

function popolaAnalisiDettagliata(dati) {
    // === CONFRONTO FORMA ===
    const confrontoForma = document.getElementById('confrontoForma');
    confrontoForma.innerHTML = '';
    
    const diffPunti = dati.datiA.punti - dati.datiB.punti;
    const diffPunteggio = dati.punteggioA - dati.punteggioB;
    
    confrontoForma.innerHTML += `
        <p><strong>Punti nelle ultime 6 partite:</strong> ${dati.nomeSquadraA} (${dati.datiA.punti} pt) vs ${dati.nomeSquadraB} (${dati.datiB.punti} pt)</p>
        <p><strong>Differenza forma:</strong> ${diffPunti > 0 ? `${dati.nomeSquadraA} ha ${diffPunti} punti in più` : diffPunti < 0 ? `${dati.nomeSquadraB} ha ${Math.abs(diffPunti)} punti in più` : 'Parità di punti'}</p>
        <p><strong>Momentum:</strong> ${dati.nomeSquadraA} ${dati.momentumA > 0 ? '📈' : dati.momentumA < 0 ? '📉' : '➡️'} ${dati.momentumA.toFixed(0)}% | ${dati.nomeSquadraB} ${dati.momentumB > 0 ? '📈' : dati.momentumB < 0 ? '📉' : '➡️'} ${dati.momentumB.toFixed(0)}%</p>
        <p><strong>Punteggio Complessivo:</strong> ${dati.nomeSquadraA} <span class="highlight">${(dati.punteggioA * 100).toFixed(1)}</span> vs ${dati.nomeSquadraB} <span class="highlight">${(dati.punteggioB * 100).toFixed(1)}</span></p>
    `;
    
    if (dati.sosA.completezza > 0.5 || dati.sosB.completezza > 0.5) {
        confrontoForma.innerHTML += `<p><strong>Difficoltà Avversari:</strong> `;
        if (dati.sosA.completezza > 0.5) {
            const sosTextA = dati.sosA.sos < 0.4 ? 'avversari forti' : dati.sosA.sos > 0.6 ? 'avversari deboli' : 'avversari misti';
            confrontoForma.innerHTML += `${dati.nomeSquadraA} ha affrontato ${sosTextA}. `;
        }
        if (dati.sosB.completezza > 0.5) {
            const sosTextB = dati.sosB.sos < 0.4 ? 'avversari forti' : dati.sosB.sos > 0.6 ? 'avversari deboli' : 'avversari misti';
            confrontoForma.innerHTML += `${dati.nomeSquadraB} ha affrontato ${sosTextB}.`;
        }
        confrontoForma.innerHTML += `</p>`;
    }
    
    // === STATISTICHE CHIAVE ===
    const statisticheChiave = document.getElementById('statisticheChiave').querySelector('tbody');
    statisticheChiave.innerHTML = '';
    
    const statistiche = [
        { nome: 'Media Gol Fatti', valA: dati.datiA.mediaGolFatti, valB: dati.datiB.mediaGolFatti },
        { nome: 'Media Gol Subiti', valA: dati.datiA.mediaGolSubiti, valB: dati.datiB.mediaGolSubiti },
        { nome: '% Vittorie', valA: dati.datiA.vittorie / 6 * 100, valB: dati.datiB.vittorie / 6 * 100 },
        { nome: '% Clean Sheet', valA: dati.datiA.cleanSheets / 6 * 100, valB: dati.datiB.cleanSheets / 6 * 100 },
        { nome: 'Expected Goals (xG)', valA: dati.xgCasa, valB: dati.xgTrasferta }
    ];
    
    statistiche.forEach(stat => {
        const row = document.createElement('tr');
        const meglio = stat.nome === 'Media Gol Subiti' ? 
            (stat.valA < stat.valB ? 'A' : stat.valA > stat.valB ? 'B' : 'none') :
            (stat.valA > stat.valB ? 'A' : stat.valA < stat.valB ? 'B' : 'none');
        
        const suffisso = stat.nome.includes('%') ? '%' : '';
        row.innerHTML = `
            <td>${stat.nome}</td>
            <td${meglio === 'A' ? ' class="highlight"' : ''}>${stat.valA.toFixed(2)}${suffisso}</td>
            <td${meglio === 'B' ? ' class="highlight"' : ''}>${stat.valB.toFixed(2)}${suffisso}</td>
        `;
        statisticheChiave.appendChild(row);
    });
    
    // === PREDIZIONE ESITO E SPUNTI ===
    document.getElementById('golAttesiOut').textContent = `${dati.nomeSquadraA} ${dati.xgCasa.toFixed(2)} - ${dati.nomeSquadraB} ${dati.xgTrasferta.toFixed(2)}`;
    
    document.getElementById('prob1X2Out').innerHTML = `
        1 (<span class="highlight">${dati.prob1X2.prob1.toFixed(0)}%</span>) - 
        X (<span class="highlight">${dati.prob1X2.probX.toFixed(0)}%</span>) - 
        2 (<span class="highlight">${dati.prob1X2.prob2.toFixed(0)}%</span>)
        <span class="confidence-badge confidence-${dati.confidenceLevel}">Confidence: ${dati.confidenceMedia}%</span>
    `;
    
    document.getElementById('probOverGolOut').innerHTML = `
        Over 2.5 (<span class="highlight">${dati.probOverUnder.probOver25.toFixed(0)}%</span>) - 
        Gol (<span class="highlight">${dati.probOverUnder.probGol.toFixed(0)}%</span>)
    `;
    
    // === SPUNTI INTELLIGENTI ===
    const spuntiList = document.getElementById('spuntiAnalisiList');
    spuntiList.innerHTML = '';
    
    const spunti = generaSpuntiIntelligenti(dati);
    
    spunti.forEach(spunto => {
        const li = document.createElement('li');
        li.innerHTML = spunto;
        spuntiList.appendChild(li);
    });
}

function generaSpuntiIntelligenti(dati) {
    const spunti = [];
    const sogliaAlta = 68;
    const sogliaMoltoAlta = 75;
    
    // === PRIORITÀ 1: VALUE BET (Alta probabilità + Alta confidence) ===
    if (dati.confidenceMedia >= 60) {
        if (dati.prob1X2.prob1 > sogliaAlta && dati.punteggioA > dati.punteggioB + 0.15) {
            const quotaImplicita = 100 / dati.prob1X2.prob1;
            spunti.push(`<strong>💎 VALUE BET - Esito 1 (${dati.nomeSquadraA})</strong>: Probabilità ${dati.prob1X2.prob1.toFixed(0)}% → Quota implicita ${quotaImplicita.toFixed(2)}. Cerca quote superiori! <span class="confidence-badge confidence-high">Alta Affidabilità</span>`);
        } else if (dati.prob1X2.prob2 > sogliaAlta && dati.punteggioB > dati.punteggioA + 0.15) {
            const quotaImplicita = 100 / dati.prob1X2.prob2;
            spunti.push(`<strong>💎 VALUE BET - Esito 2 (${dati.nomeSquadraB})</strong>: Probabilità ${dati.prob1X2.prob2.toFixed(0)}% → Quota implicita ${quotaImplicita.toFixed(2)}. Cerca quote superiori! <span class="confidence-badge confidence-high">Alta Affidabilità</span>`);
        }
        
        if (dati.probOverUnder.probOver25 > sogliaAlta) {
            const quotaImplicita = 100 / dati.probOverUnder.probOver25;
            spunti.push(`<strong>💎 VALUE BET - Over 2.5</strong>: Probabilità ${dati.probOverUnder.probOver25.toFixed(0)}% → Quota implicita ${quotaImplicita.toFixed(2)}. Gol attesi: ${(dati.xgCasa + dati.xgTrasferta).toFixed(2)} <span class="confidence-badge confidence-high">Alta Affidabilità</span>`);
        } else if (dati.probOverUnder.probOver25 < 35) {
            const probUnder = 100 - dati.probOverUnder.probOver25;
            const quotaImplicita = 100 / probUnder;
            spunti.push(`<strong>💎 VALUE BET - Under 2.5</strong>: Probabilità ${probUnder.toFixed(0)}% → Quota implicita ${quotaImplicita.toFixed(2)}. Partita tattica <span class="confidence-badge confidence-high">Alta Affidabilità</span>`);
        }
    }
    
    // === PRIORITÀ 2: SCOMMESSE SICURE (Molto alta probabilità) ===
    const prob1X = dati.prob1X2.prob1 + dati.prob1X2.probX;
    const probX2 = dati.prob1X2.prob2 + dati.prob1X2.probX;
    
    if (prob1X > sogliaMoltoAlta) {
        spunti.push(`<strong>🛡️ SCOMMESSA SICURA - Doppia Chance 1X</strong>: ${prob1X.toFixed(0)}% di probabilità. ${dati.nomeSquadraA} non dovrebbe perdere`);
    } else if (probX2 > sogliaMoltoAlta) {
        spunti.push(`<strong>🛡️ SCOMMESSA SICURA - Doppia Chance X2</strong>: ${probX2.toFixed(0)}% di probabilità. ${dati.nomeSquadraB} difficilmente perde`);
    }
    
    // === PRIORITÀ 3: GOL/NOGOL ===
    if (dati.probOverUnder.probGol > sogliaAlta && dati.confidenceMedia >= 50) {
        spunti.push(`<strong>⚽ Gol (entrambe segnano)</strong>: Probabilità ${dati.probOverUnder.probGol.toFixed(0)}%. xG: ${dati.nomeSquadraA} ${dati.xgCasa.toFixed(2)} - ${dati.nomeSquadraB} ${dati.xgTrasferta.toFixed(2)}`);
    } else if (dati.probOverUnder.probNoGol > 55) {
        spunti.push(`<strong>🚫 No Gol probabile</strong>: ${dati.probOverUnder.probNoGol.toFixed(0)}% che almeno una squadra non segni`);
    }
    
    // === PRIORITÀ 4: MOMENTUM E TREND ===
    if (Math.abs(dati.momentumA - dati.momentumB) > 50) {
        const squadraMigliore = dati.momentumA > dati.momentumB ? dati.nomeSquadraA : dati.nomeSquadraB;
        const momentoMigliore = Math.max(dati.momentumA, dati.momentumB);
        const squadraPeggiore = dati.momentumA < dati.momentumB ? dati.nomeSquadraA : dati.nomeSquadraB;
        const momentoPeggiore = Math.min(dati.momentumA, dati.momentumB);
        spunti.push(`<strong>📈 TREND OPPOSTI</strong>: ${squadraMigliore} in forte crescita (+${momentoMigliore.toFixed(0)}%) mentre ${squadraPeggiore} in calo (${momentoPeggiore.toFixed(0)}%). Opportunità!`);
    } else if (dati.momentumA > 30 || dati.momentumB > 30) {
        const squadra = dati.momentumA > 30 ? dati.nomeSquadraA : dati.nomeSquadraB;
        const momento = Math.max(dati.momentumA, dati.momentumB);
        spunti.push(`<strong>📈 ${squadra}</strong> in ottima forma: momentum +${momento.toFixed(0)}%. Può sorprendere`);
    }
    
    // === WARNING SE CONFIDENCE BASSA ===
    if (dati.confidenceMedia < 40) {
        spunti.push(`<strong>⚠️ ATTENZIONE</strong>: Affidabilità predizione bassa (${dati.confidenceMedia}%). Dati limitati o risultati inconsistenti. <span class="confidence-badge confidence-low">Bassa Affidabilità</span>`);
    }
    
    // === INFO EXTRA: PAREGGIO SE EQUILIBRATO ===
    if (dati.prob1X2.probX > 30 && Math.abs(dati.punteggioA - dati.punteggioB) < 0.08 && spunti.length < 3) {
        spunti.push(`<strong>⚖️ Pareggio possibile</strong>: Squadre molto equilibrate (${dati.prob1X2.probX.toFixed(0)}%). Considera doppia chance o combo`);
    }
    
    // Limita a max 6 spunti più rilevanti
    return spunti.slice(0, 6);
}

// ========== FUNZIONI PARTITE SALVATE & STORICO ==========
// [Il resto delle funzioni rimane identico al codice originale]
// Manteniamo intatte le funzioni di: salvaPartita, esportaPartite, importaPartite,
// generaFile, importaFile, generaFileDaTesto, aggiornaTabellaPartite, aggiornaStoricoGiocate, ecc.

function popolaDropdownPartite() {
    const stored = localStorage.getItem('partitePrecedenti');
    if (stored) {
        try {
            partitePrecedentiCache = JSON.parse(stored);
        } catch (e) {
            console.error("Errore parsing partite precedenti:", e);
            partitePrecedentiCache = [];
        }
    }
    
    const select = document.getElementById('selezionaPartitaPrecedente');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Seleziona Partita Precedente --</option>';
    partitePrecedentiCache.forEach((p, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${p.nomeSquadraA} vs ${p.nomeSquadraB}${p.timestamp ? ` (${p.timestamp})` : ''}`;
        select.appendChild(option);
    });
}

function caricaDatiPartita(partita) {
    document.getElementById('nomeSquadraA').value = partita.nomeSquadraA || '';
    document.getElementById('nomeSquadraB').value = partita.nomeSquadraB || '';
    
    for (let i = 1; i <= 6; i++) {
        const idx = i - 1;
        
        // Squadra A
        document.getElementsByName(`avversarioA${i}`)[0].value = partita.avversariA?.[idx] || '';
        document.getElementsByName(`golFattiA${i}`)[0].value = partita.golFattiA?.[idx] || 0;
        document.getElementsByName(`golSubitiA${i}`)[0].value = partita.golSubitiA?.[idx] || 0;
        document.getElementsByName(`casaTrasfertaA${i}`)[0].value = partita.casaTrasfertaA?.[idx] || 'C';
        document.getElementsByName(`posAvvA${i}`)[0].value = partita.posizioniAvversariA?.[idx] || '';
        
        // Squadra B
        document.getElementsByName(`avversarioB${i}`)[0].value = partita.avversariB?.[idx] || '';
        document.getElementsByName(`golFattiB${i}`)[0].value = partita.golFattiB?.[idx] || 0;
        document.getElementsByName(`golSubitiB${i}`)[0].value = partita.golSubitiB?.[idx] || 0;
        document.getElementsByName(`casaTrasfertaB${i}`)[0].value = partita.casaTrasfertaB?.[idx] || 'C';
        document.getElementsByName(`posAvvB${i}`)[0].value = partita.posizioniAvversariB?.[idx] || '';
    }
    
    document.getElementsByName('posizioneA')[0].value = partita.posizioneA || '';
    document.getElementsByName('totSquadreA')[0].value = partita.totSquadreA || '';
    document.getElementsByName('coeffA')[0].value = partita.coeffA || 0;
    
    document.getElementsByName('posizioneB')[0].value = partita.posizioneB || '';
    document.getElementsByName('totSquadreB')[0].value = partita.totSquadreB || '';
    document.getElementsByName('coeffB')[0].value = partita.coeffB || 0;
    
    if (partita.giocata) {
        giocataManuale = partita.giocata;
    }
    
    calcolaRisultati();
}

function aggiornaTabellaPartite() {
    const container = document.getElementById('partiteSalvatiBody');
    if (!container) return;
    
    if (partitePrecedentiCache.length === 0) {
        container.innerHTML = '<p>Nessuna partita salvata.</p>';
        return;
    }
    
    container.innerHTML = '';
    let totalePartiteValutate = 0;
    let totaleVincente = 0;
    
    // Crea tabella semplice
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Partita</th>
                <th>Giocata</th>
                <th>Risultato</th>
                <th>Esito</th>
                <th>Data</th>
                <th>Azioni</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    
    partitePrecedentiCache.forEach((p, idx) => {
        const row = document.createElement('tr');
        
        // Conta per statistiche
        if (p.esito === 'Vincente' || p.esito === 'Perdente') {
            totalePartiteValutate++;
            if (p.esito === 'Vincente') totaleVincente++;
        }
        
        row.innerHTML = `
            <td><strong>${p.nomeSquadraA} vs ${p.nomeSquadraB}</strong></td>
            <td><input type="text" class="gioco-input" value="${p.giocata || ''}" onchange="aggiornaGiocata(${idx}, this.value)"></td>
            <td><input type="text" class="gioco-input" value="${p.risultato || ''}" onchange="aggiornaRisultato(${idx}, this.value)"></td>
            <td>
                <select class="esito-select ${p.esito === 'Vincente' ? 'vincente' : p.esito === 'Perdente' ? 'perdente' : ''}" onchange="aggiornaEsito(${idx}, this.value)">
                    <option value="" ${!p.esito ? 'selected' : ''}>-</option>
                    <option value="Vincente" ${p.esito === 'Vincente' ? 'selected' : ''}>✓</option>
                    <option value="Perdente" ${p.esito === 'Perdente' ? 'selected' : ''}>✗</option>
                </select>
            </td>
            <td><small>${p.timestamp || '-'}</small></td>
            <td><button class="elimina-btn" onclick="eliminaSingolaPartita(${idx})">Elimina</button></td>
        `;
        tbody.appendChild(row);
    });
    
    container.appendChild(table);
    
    // Riepilogo
    const percTotale = totalePartiteValutate ? (totaleVincente / totalePartiteValutate * 100) : 0;
    const riepilogoDiv = document.createElement('div');
    riepilogoDiv.style.marginTop = '20px';
    riepilogoDiv.innerHTML = `<h3>Riepilogo Totale</h3><span class="perc-vincente">Percentuale Vincente: ${percTotale.toFixed(1)}% (${totaleVincente}/${totalePartiteValutate})</span>`;
    container.appendChild(riepilogoDiv);
}

function eliminaSingolaPartita(indexOriginale) {
    if (confirm("Eliminare questa partita?")) {
        partitePrecedentiCache.splice(indexOriginale, 1);
        localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache));
        popolaDropdownPartite();
        aggiornaTabellaPartite();
        
    }
}

function eliminaPartiteSalvati() {
    if (confirm("Eliminare TUTTE le partite salvate?")) {
        localStorage.removeItem('partitePrecedenti');
        localStorage.removeItem('ultimiDati');
        datiAttuali = null;
        partitePrecedentiCache = [];
        popolaDropdownPartite();
        aggiornaTabellaPartite();
        
        alert("Partite eliminate!");
    }
}

function aggiornaRisultato(indexOriginale, valore) {
    if (partitePrecedentiCache[indexOriginale]) {
        partitePrecedentiCache[indexOriginale].risultato = valore.trim();
        localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache));
    }
}

function aggiornaEsito(indexOriginale, valore) {
    if (partitePrecedentiCache[indexOriginale]) {
        partitePrecedentiCache[indexOriginale].esito = valore;
        localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache));
        aggiornaTabellaPartite();
        
    }
}


function aggiornaGiocata(indexOriginale, valore) {
    if (partitePrecedentiCache[indexOriginale]) {
        partitePrecedentiCache[indexOriginale].giocata = valore.trim();
        localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache));
        
        popolaDropdownPartite();
    }
}

function salvaPartita() {
    if (!datiAttuali) {
        alert("Calcola risultati prima.");
        return;
    }
    if (!datiAttuali.nomeSquadraA || !datiAttuali.nomeSquadraB) {
        alert("Inserisci nomi squadre.");
        return;
    }
    
    const partitaDaSalvare = JSON.parse(JSON.stringify(datiAttuali));
    partitaDaSalvare.giocata = "";
    partitaDaSalvare.gruppo = "Senza Gruppo";
    partitaDaSalvare.schedina = 1;
    partitaDaSalvare.risultato = "";
    partitaDaSalvare.esito = "";
    partitaDaSalvare.timestamp = new Date().toLocaleString();
    
    partitePrecedentiCache.push(partitaDaSalvare);
    localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache));
    
    popolaDropdownPartite();
    aggiornaTabellaPartite();
    
    
    alert(`Partita "${partitaDaSalvare.nomeSquadraA} vs ${partitaDaSalvare.nomeSquadraB}" salvata. Modifica dettagli in tabella.`);
}

function esportaPartite() {
    if (partitePrecedentiCache.length === 0) {
        alert("Nessuna partita!");
        return;
    }
    const nomeFile = prompt("Nome file:", "partite_salvate");
    if (!nomeFile) return;
    
    const dataString = JSON.stringify(partitePrecedentiCache, null, 2);
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nomeFile}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importaPartite() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (!Array.isArray(data)) throw new Error("File non è array.");
                
                const validData = data.filter(p => p && p.nomeSquadraA && p.nomeSquadraB);
                if (validData.length !== data.length) alert("Alcune partite scartate.");
                
                partitePrecedentiCache = partitePrecedentiCache.concat(validData);
                localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache));
                
                popolaDropdownPartite();
                aggiornaTabellaPartite();
                
                
                alert(`Importate ${validData.length} partite.`);
            } catch (err) {
                alert("Errore importazione: " + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}


function generaFile(squadra) {
    const form = document.getElementById('formAnalisi');
    const formData = new FormData(form);
    const nomeSquadra = squadra === 'A' ? formData.get('nomeSquadraA') : formData.get('nomeSquadraB');
    
    if (!nomeSquadra) {
        alert("Nome squadra?");
        return;
    }
    
    let dataStruct = { nomeSquadra: nomeSquadra, partite: [] };
    
    for (let i = 1; i <= 6; i++) {
        const avversario = formData.get(`avversario${squadra}${i}`) || '';
        if (avversario) {
            const gf = parseInt(formData.get(`golFatti${squadra}${i}`)) || 0;
            const gs = parseInt(formData.get(`golSubiti${squadra}${i}`)) || 0;
            const ct = formData.get(`casaTrasferta${squadra}${i}`).toUpperCase();
            const esito = gf > gs ? 'V' : (gf < gs ? 'S' : 'P');
            const posAvv = parseInt(formData.get(`posAvv${squadra}${i}`)) || 0;
            
            dataStruct.partite.push({
                avversario: avversario,
                golCasa: ct === 'C' ? gf : gs,
                golTrasferta: ct === 'C' ? gs : gf,
                esito: esito,
                casaTrasferta: ct,
                posizioneAvversario: posAvv
            });
        }
    }
    
    if (dataStruct.partite.length === 0) {
        alert("Nessuna partita valida.");
        return;
    }
    
    const dataString = JSON.stringify(dataStruct, null, 2);
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nomeSquadra}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importaFile(squadra) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const dataImported = JSON.parse(ev.target.result);
                if (!dataImported || !dataImported.nomeSquadra || !Array.isArray(dataImported.partite)) {
                    throw new Error("Formato JSON non valido.");
                }
                
                const nomeCampo = squadra === 'A' ? 'nomeSquadraA' : 'nomeSquadraB';
                document.getElementById(nomeCampo).value = dataImported.nomeSquadra;
                
                // Reset campi
                for (let j = 1; j <= 6; j++) {
                    document.getElementsByName(`avversario${squadra}${j}`)[0].value = '';
                    document.getElementsByName(`golFatti${squadra}${j}`)[0].value = 0;
                    document.getElementsByName(`golSubiti${squadra}${j}`)[0].value = 0;
                    document.getElementsByName(`casaTrasferta${squadra}${j}`)[0].value = 'C';
                    document.getElementsByName(`posAvv${squadra}${j}`)[0].value = '';
                }
                
                // Popola con dati importati
                for (let j = 0; j < Math.min(6, dataImported.partite.length); j++) {
                    const p = dataImported.partite[j];
                    const indexForm = j + 1;
                    
                    document.getElementsByName(`avversario${squadra}${indexForm}`)[0].value = p.avversario;
                    document.getElementsByName(`golFatti${squadra}${indexForm}`)[0].value = p.casaTrasferta === 'C' ? p.golCasa : p.golTrasferta;
                    document.getElementsByName(`golSubiti${squadra}${indexForm}`)[0].value = p.casaTrasferta === 'C' ? p.golTrasferta : p.golCasa;
                    document.getElementsByName(`casaTrasferta${squadra}${indexForm}`)[0].value = p.casaTrasferta;
                    document.getElementsByName(`posAvv${squadra}${indexForm}`)[0].value = p.posizioneAvversario || '';
                }
                
                alert(`Dati "${dataImported.nomeSquadra}" importati!`);
            } catch (err) {
                alert("Errore importazione: " + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function generaFileDaTesto() {
    const textInput = document.getElementById('textInput').value.trim();
    if (!textInput) {
        alert("Inserisci testo...");
        return;
    }
    
    const righe = textInput.split('\n').filter(l => l.trim() !== '');
    const righePerPartita = 7;
    
    if (righe.length < righePerPartita || righe.length % righePerPartita !== 0) {
        alert(`Formato testo errato. Righe: ${righe.length}. Devono essere multipli di 7.`);
        return;
    }
    
    let dataStruct = { nomeSquadra: "", partite: [] };
    const squadreCount = {};
    const numPartite = righe.length / righePerPartita;
    
    // Identifica squadra principale
    for (let i = 0; i < righe.length; i += righePerPartita) {
        const sq1 = righe[i + 2];
        const sq2 = righe[i + 3];
        squadreCount[sq1] = (squadreCount[sq1] || 0) + 1;
        squadreCount[sq2] = (squadreCount[sq2] || 0) + 1;
    }
    
    dataStruct.nomeSquadra = Object.keys(squadreCount).find(s => squadreCount[s] === numPartite);
    if (!dataStruct.nomeSquadra) {
        alert("Squadra principale non trovata.");
        return;
    }
    
    // Estrai partite
    for (let i = 0; i < righe.length; i += righePerPartita) {
        const sq1 = righe[i + 2];
        const sq2 = righe[i + 3];
        const golCasa = parseInt(righe[i + 4]) || 0;
        const golTrasferta = parseInt(righe[i + 5]) || 0;
        const esito = righe[i + 6].toUpperCase();
        
        const isCasa = dataStruct.nomeSquadra === sq1;
        const casaTrasferta = isCasa ? 'C' : 'T';
        const avversario = isCasa ? sq2 : sq1;
        const avversarioShort = avversario.replace(/^(Ath\.|FC|Real|Sporting)\s+/i, '');
        
        dataStruct.partite.push({
            avversario: avversarioShort,
            golCasa: golCasa,
            golTrasferta: golTrasferta,
            esito: esito,
            casaTrasferta: casaTrasferta,
            posizioneAvversario: 0  // Da compilare dopo
        });
    }
    
    if (dataStruct.partite.length === 0) {
        alert("Nessuna partita estratta.");
        return;
    }
    
    const dataString = JSON.stringify(dataStruct, null, 2);
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataStruct.nomeSquadra}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    const genForm = document.querySelector('.generatore-form');
    if (!document.getElementById('pulisciBtn')) {
        const btnPulisci = document.createElement('button');
        btnPulisci.id = 'pulisciBtn';
        btnPulisci.textContent = 'Pulisci';
        btnPulisci.type = 'button';
        btnPulisci.style.marginLeft = '10px';
        btnPulisci.onclick = pulisciGeneratore;
        genForm.appendChild(btnPulisci);
    }
}

function pulisciGeneratore() {
    document.getElementById('textInput').value = '';
}

// ========== INIZIALIZZAZIONE ==========

document.addEventListener("DOMContentLoaded", () => {
    popolaDropdownPartite();
    
    const selectPartite = document.getElementById('selezionaPartitaPrecedente');
    if (selectPartite) {
        selectPartite.addEventListener('change', function() {
            const index = this.value;
            if (index !== "" && partitePrecedentiCache[index]) {
                caricaDatiPartita(partitePrecedentiCache[index]);
            } else if (index !== "") {
                console.warn(`Indice ${index} non valido.`);
                this.selectedIndex = 0;
            }
        });
    }
    
    const ultimiDatiSalvati = localStorage.getItem('ultimiDati');
    if (ultimiDatiSalvati) {
        try {
            const datiRecuperati = JSON.parse(ultimiDatiSalvati);
            if (datiRecuperati && datiRecuperati.nomeSquadraA && datiRecuperati.nomeSquadraB) {
                caricaDatiPartita(datiRecuperati);
            } else {
                localStorage.removeItem('ultimiDati');
            }
        } catch (e) {
            console.error("Errore parsing ultimi dati:", e);
            localStorage.removeItem('ultimiDati');
        }
    }
    
    aggiornaTabellaPartite();
});

// ========== FUNZIONE PULISCI CAMPI ==========
function pulisciCampi() {
    if (confirm("Vuoi pulire tutti i campi e iniziare un nuovo inserimento?")) {
        // Pulisci nomi squadre
        document.getElementById('nomeSquadraA').value = '';
        document.getElementById('nomeSquadraB').value = '';
        
        // Pulisci tutti i campi delle 6 partite per entrambe le squadre
        for (let i = 1; i <= 6; i++) {
            // Squadra A
            document.getElementsByName(`avversarioA${i}`)[0].value = '';
            document.getElementsByName(`golFattiA${i}`)[0].value = 0;
            document.getElementsByName(`golSubitiA${i}`)[0].value = 0;
            document.getElementsByName(`casaTrasfertaA${i}`)[0].value = 'C';
            document.getElementsByName(`posAvvA${i}`)[0].value = '';
            
            // Squadra B
            document.getElementsByName(`avversarioB${i}`)[0].value = '';
            document.getElementsByName(`golFattiB${i}`)[0].value = 0;
            document.getElementsByName(`golSubitiB${i}`)[0].value = 0;
            document.getElementsByName(`casaTrasfertaB${i}`)[0].value = 'C';
            document.getElementsByName(`posAvvB${i}`)[0].value = '';
        }
        
        // Pulisci parametri
        document.getElementsByName('posizioneA')[0].value = '';
        document.getElementsByName('totSquadreA')[0].value = '';
        document.getElementsByName('coeffA')[0].value = 0;
        document.getElementsByName('posizioneB')[0].value = '';
        document.getElementsByName('totSquadreB')[0].value = '';
        document.getElementsByName('coeffB')[0].value = 0;
        
        // Reset dropdown partite precedenti
        document.getElementById('selezionaPartitaPrecedente').selectedIndex = 0;
        
        alert("Tutti i campi sono stati puliti!");
    }
}
