let giocataManuale = "";
let datiAttuali = null;
let partitePrecedentiCache = [];
let sortDirection = { 2: 'desc', 3: 'desc' };

// Funzione Rimossa: cercaTransfermarkt

function calcolaRisultati() {
    const form = document.getElementById('formAnalisi');
    const formData = new FormData(form);
    const nomeSquadraA = document.getElementById('nomeSquadraA').value || "Squadra A";
    const nomeSquadraB = document.getElementById('nomeSquadraB').value || "Squadra B";

    // Aggiorna intestazioni e titoli
    document.getElementById('titoloSquadraA').textContent = `${nomeSquadraA} (Casa)`;
    document.getElementById('titoloSquadraB').textContent = `${nomeSquadraB} (Trasferta)`;
    document.getElementById('nomeRisultatiA').textContent = nomeSquadraA;
    document.getElementById('nomeRisultatiB').textContent = nomeSquadraB;
    document.getElementById('colonnaSquadraA').textContent = nomeSquadraA;
    document.getElementById('colonnaSquadraB').textContent = nomeSquadraB;
    document.getElementById('casaSquadraA').textContent = `${nomeSquadraA} (Casa)`;
    document.getElementById('trasfertaSquadraB').textContent = `${nomeSquadraB} (Trasferta)`;
    document.getElementById('nomeStatA').textContent = nomeSquadraA;
    document.getElementById('nomeStatB').textContent = nomeSquadraB;

    // --- Calcoli Squadra A ---
    let golFattiA = [], golSubitiA = [], casaTrasfertaA = [], avversariA = [], esitiA = [];
    for (let i = 1; i <= 6; i++) {
        golFattiA.push(parseInt(formData.get(`golFattiA${i}`)) || 0);
        golSubitiA.push(parseInt(formData.get(`golSubitiA${i}`)) || 0);
        casaTrasfertaA.push(formData.get(`casaTrasfertaA${i}`).toUpperCase());
        avversariA.push(formData.get(`avversarioA${i}`) || '');
        const esito = golFattiA[i-1] > golSubitiA[i-1] ? 'V' : (golFattiA[i-1] < golSubitiA[i-1] ? 'S' : 'P');
        esitiA.push(esito);
        const esitoCell = document.querySelectorAll('#squadraA .esito')[i-1];
        esitoCell.textContent = esito;
        esitoCell.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta');
    }
    let mediaGolFattiA = golFattiA.reduce((a, b) => a + b, 0) / 6;
    let mediaGolSubitiA = golSubitiA.reduce((a, b) => a + b, 0) / 6;
    let vittorieA = golFattiA.filter((gf, i) => gf > golSubitiA[i]).length;
    let pareggiA = golFattiA.filter((gf, i) => gf === golSubitiA[i]).length;
    let puntiA = (vittorieA * 3) + pareggiA;
    let casaGolFattiA = golFattiA.filter((_, i) => casaTrasfertaA[i] === 'C');
    let casaGolSubitiA = golSubitiA.filter((_, i) => casaTrasfertaA[i] === 'C');
    let trasfertaGolFattiA = golFattiA.filter((_, i) => casaTrasfertaA[i] === 'T');
    let trasfertaGolSubitiA = golSubitiA.filter((_, i) => casaTrasfertaA[i] === 'T');
    let mediaGolFattiCasaA = casaGolFattiA.length ? casaGolFattiA.reduce((a, b) => a + b, 0) / casaGolFattiA.length : 0;
    let mediaGolSubitiCasaA = casaGolSubitiA.length ? casaGolSubitiA.reduce((a, b) => a + b, 0) / casaGolSubitiA.length : 0;
    let mediaGolFattiTrasfertaA = trasfertaGolFattiA.length ? trasfertaGolFattiA.reduce((a, b) => a + b, 0) / trasfertaGolFattiA.length : 0;
    let mediaGolSubitiTrasfertaA = trasfertaGolSubitiA.length ? trasfertaGolSubitiA.reduce((a, b) => a + b, 0) / trasfertaGolSubitiA.length : 0;
    let vittorieCasaA = casaGolFattiA.filter((gf, i) => gf > casaGolSubitiA[i]).length;
    let pareggiCasaA = casaGolFattiA.filter((gf, i) => gf === casaGolSubitiA[i]).length;
    let vittorieTrasfertaA = trasfertaGolFattiA.filter((gf, i) => gf > trasfertaGolSubitiA[i]).length;
    let pareggiTrasfertaA = trasfertaGolFattiA.filter((gf, i) => gf === trasfertaGolSubitiA[i]).length;
    let posizioneA = parseInt(formData.get('posizioneA')) || 1;
    let totSquadreA = parseInt(formData.get('totSquadreA')) || 1;
    let pesoPosizioneA = (totSquadreA > 0) ? (totSquadreA - posizioneA + 1) / totSquadreA : 0;
    let coeffA = parseFloat(formData.get('coeffA')) || 0;
    let punteggioGeneraleA = (mediaGolFattiA * 0.15) - (mediaGolSubitiA * 0.10) + ((vittorieA / 6) * 0.25) + (pesoPosizioneA * 0.17) + ((puntiA / 18) * 0.18);
    let punteggioCasaA = (mediaGolFattiCasaA * 0.15) - (mediaGolSubitiCasaA * 0.10) + ((casaGolFattiA.length ? vittorieCasaA / casaGolFattiA.length : 0) * 0.25) + (pesoPosizioneA * 0.17) + ((puntiA / 18) * 0.18) + 0.2;
    let punteggioTotaleA = (punteggioGeneraleA * 0.7) + (punteggioCasaA * 0.3);
    let punteggioCoppeA = punteggioTotaleA + coeffA;

    // --- Calcoli Squadra B ---
    let golFattiB = [], golSubitiB = [], casaTrasfertaB = [], avversariB = [], esitiB = [];
    for (let i = 1; i <= 6; i++) {
        golFattiB.push(parseInt(formData.get(`golFattiB${i}`)) || 0);
        golSubitiB.push(parseInt(formData.get(`golSubitiB${i}`)) || 0);
        casaTrasfertaB.push(formData.get(`casaTrasfertaB${i}`).toUpperCase());
        avversariB.push(formData.get(`avversarioB${i}`) || '');
        const esito = golFattiB[i-1] > golSubitiB[i-1] ? 'V' : (golFattiB[i-1] < golSubitiB[i-1] ? 'S' : 'P');
        esitiB.push(esito);
        const esitoCell = document.querySelectorAll('#squadraB .esito')[i-1];
        esitoCell.textContent = esito;
        esitoCell.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta');
    }
    let mediaGolFattiB = golFattiB.reduce((a, b) => a + b, 0) / 6;
    let mediaGolSubitiB = golSubitiB.reduce((a, b) => a + b, 0) / 6;
    let vittorieB = golFattiB.filter((gf, i) => gf > golSubitiB[i]).length;
    let pareggiB = golFattiB.filter((gf, i) => gf === golSubitiB[i]).length;
    let puntiB = (vittorieB * 3) + pareggiB;
    let casaGolFattiB = golFattiB.filter((_, i) => casaTrasfertaB[i] === 'C');
    let casaGolSubitiB = golSubitiB.filter((_, i) => casaTrasfertaB[i] === 'C');
    let trasfertaGolFattiB = golFattiB.filter((_, i) => casaTrasfertaB[i] === 'T');
    let trasfertaGolSubitiB = golSubitiB.filter((_, i) => casaTrasfertaB[i] === 'T');
    let mediaGolFattiCasaB = casaGolFattiB.length ? casaGolFattiB.reduce((a, b) => a + b, 0) / casaGolFattiB.length : 0;
    let mediaGolSubitiCasaB = casaGolSubitiB.length ? casaGolSubitiB.reduce((a, b) => a + b, 0) / casaGolSubitiB.length : 0;
    let mediaGolFattiTrasfertaB = trasfertaGolFattiB.length ? trasfertaGolFattiB.reduce((a, b) => a + b, 0) / trasfertaGolFattiB.length : 0;
    let mediaGolSubitiTrasfertaB = trasfertaGolSubitiB.length ? trasfertaGolSubitiB.reduce((a, b) => a + b, 0) / trasfertaGolSubitiB.length : 0;
    let vittorieTrasfertaB = trasfertaGolFattiB.filter((gf, i) => gf > trasfertaGolSubitiB[i]).length;
    let pareggiTrasfertaB = trasfertaGolFattiB.filter((gf, i) => gf === trasfertaGolSubitiB[i]).length;
    let posizioneB = parseInt(formData.get('posizioneB')) || 1;
    let totSquadreB = parseInt(formData.get('totSquadreB')) || 1;
    let pesoPosizioneB = (totSquadreB > 0) ? (totSquadreB - posizioneB + 1) / totSquadreB : 0;
    let coeffB = parseFloat(formData.get('coeffB')) || 0;
    let punteggioGeneraleB = (mediaGolFattiB * 0.15) - (mediaGolSubitiB * 0.10) + ((vittorieB / 6) * 0.25) + (pesoPosizioneB * 0.17) + ((puntiB / 18) * 0.18);
    let punteggioTrasfertaB = (mediaGolFattiTrasfertaB * 0.15) - (mediaGolSubitiTrasfertaB * 0.10) + ((trasfertaGolFattiB.length ? vittorieTrasfertaB / trasfertaGolFattiB.length : 0) * 0.25) + (pesoPosizioneB * 0.17) + ((puntiB / 18) * 0.18);
    let punteggioTotaleB = (punteggioGeneraleB * 0.7) + (punteggioTrasfertaB * 0.3);
    let punteggioCoppeB = punteggioTotaleB + coeffB;

    // Salva dati correnti per eventuale salvataggio partita
    datiAttuali = {
        nomeSquadraA, nomeSquadraB, golFattiA, golSubitiA, casaTrasfertaA, avversariA, esitiA,
        golFattiB, golSubitiB, casaTrasfertaB, avversariB, esitiB, posizioneA, totSquadreA,
        coeffA, posizioneB, totSquadreB, coeffB,
        timestamp: new Date().toLocaleString(),
        risultato: "", esito: "", giocata: "", gruppo: "Senza Gruppo", schedina: 1
    };

    // --- Aggiornamento UI: Sequenza Recente ---
    const sequenzaA = document.getElementById('sequenzaA'); const sequenzaB = document.getElementById('sequenzaB');
    sequenzaA.innerHTML = ''; sequenzaB.innerHTML = '';
    esitiA.forEach(esito => { const span = document.createElement('span'); span.textContent = esito; span.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta'); sequenzaA.appendChild(span); });
    esitiB.forEach(esito => { const span = document.createElement('span'); span.textContent = esito; span.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta'); sequenzaB.appendChild(span); });

    // Funzione Helper per colorare le percentuali
    function coloraPercentuale(perc, elemento) { if (!elemento) return; const val = parseFloat(perc); if (isNaN(val)) { elemento.textContent = '- %'; elemento.style.backgroundColor = '#ccc'; elemento.className = 'perc'; return; } const clampedVal = Math.max(0, Math.min(100, val)); const r = Math.round(255 * (1 - clampedVal / 100)); const g = Math.round(255 * (clampedVal / 100)); elemento.style.backgroundColor = `rgb(${r}, ${g}, 0)`; elemento.textContent = val.toFixed(1) + '%'; elemento.className = 'perc'; }

    // --- Aggiornamento UI: Risultati Squadra A & B ---
    document.getElementById('golFattiA').textContent = mediaGolFattiA.toFixed(2); document.getElementById('golSubitiA').textContent = mediaGolSubitiA.toFixed(2);
    coloraPercentuale(vittorieA / 6 * 100, document.getElementById('vittorieA')); coloraPercentuale(pareggiA / 6 * 100, document.getElementById('pareggiA')); coloraPercentuale((6 - vittorieA - pareggiA) / 6 * 100, document.getElementById('sconfitteA'));
    document.getElementById('golFattiCasaA').textContent = mediaGolFattiCasaA.toFixed(2); document.getElementById('golSubitiCasaA').textContent = mediaGolSubitiCasaA.toFixed(2);
    coloraPercentuale(casaGolFattiA.length ? (vittorieCasaA / casaGolFattiA.length * 100) : NaN, document.getElementById('vittorieCasaA')); coloraPercentuale(casaGolFattiA.length ? (pareggiCasaA / casaGolFattiA.length * 100) : NaN, document.getElementById('pareggiCasaA')); coloraPercentuale(casaGolFattiA.length ? ((casaGolFattiA.length - vittorieCasaA - pareggiCasaA) / casaGolFattiA.length * 100) : NaN, document.getElementById('sconfitteCasaA'));
    document.getElementById('golFattiTrasfertaA').textContent = mediaGolFattiTrasfertaA.toFixed(2); document.getElementById('golSubitiTrasfertaA').textContent = mediaGolSubitiTrasfertaA.toFixed(2);
    coloraPercentuale(trasfertaGolFattiA.length ? (vittorieTrasfertaA / trasfertaGolFattiA.length * 100) : NaN, document.getElementById('vittorieTrasfertaA')); coloraPercentuale(trasfertaGolFattiA.length ? (pareggiTrasfertaA / trasfertaGolFattiA.length * 100) : NaN, document.getElementById('pareggiTrasfertaA')); coloraPercentuale(trasfertaGolFattiA.length ? ((trasfertaGolFattiA.length - vittorieTrasfertaA - pareggiTrasfertaA) / trasfertaGolFattiA.length * 100) : NaN, document.getElementById('sconfitteTrasfertaA'));
    document.getElementById('pesoPosizioneA').textContent = pesoPosizioneA.toFixed(2); document.getElementById('formaA').textContent = puntiA; document.getElementById('punteggioA').textContent = punteggioGeneraleA.toFixed(2); document.getElementById('punteggioCasaA').textContent = punteggioCasaA.toFixed(2); document.getElementById('punteggioTotaleA').textContent = punteggioTotaleA.toFixed(2); document.getElementById('punteggioCoppeA').textContent = punteggioCoppeA.toFixed(2);
    ['punteggioA', 'punteggioCasaA', 'punteggioTotaleA', 'punteggioCoppeA'].forEach(id => document.getElementById(id).className = 'punteggio');
    document.getElementById('golFattiB').textContent = mediaGolFattiB.toFixed(2); document.getElementById('golSubitiB').textContent = mediaGolSubitiB.toFixed(2);
    coloraPercentuale(vittorieB / 6 * 100, document.getElementById('vittorieB')); coloraPercentuale(pareggiB / 6 * 100, document.getElementById('pareggiB')); coloraPercentuale((6 - vittorieB - pareggiB) / 6 * 100, document.getElementById('sconfitteB'));
    document.getElementById('golFattiCasaB').textContent = mediaGolFattiCasaB.toFixed(2); document.getElementById('golSubitiCasaB').textContent = mediaGolSubitiCasaB.toFixed(2);
    coloraPercentuale(casaGolFattiB.length ? (casaGolFattiB.filter((gf, i) => gf > casaGolSubitiB[i]).length / casaGolFattiB.length * 100) : NaN, document.getElementById('vittorieCasaB')); coloraPercentuale(casaGolFattiB.length ? (casaGolFattiB.filter((gf, i) => gf === casaGolSubitiB[i]).length / casaGolFattiB.length * 100) : NaN, document.getElementById('pareggiCasaB')); coloraPercentuale(casaGolFattiB.length ? (casaGolFattiB.filter((gf, i) => gf < casaGolSubitiB[i]).length / casaGolFattiB.length * 100) : NaN, document.getElementById('sconfitteCasaB'));
    document.getElementById('golFattiTrasfertaB').textContent = mediaGolFattiTrasfertaB.toFixed(2); document.getElementById('golSubitiTrasfertaB').textContent = mediaGolSubitiTrasfertaB.toFixed(2);
    coloraPercentuale(trasfertaGolFattiB.length ? (vittorieTrasfertaB / trasfertaGolFattiB.length * 100) : NaN, document.getElementById('vittorieTrasfertaB')); coloraPercentuale(trasfertaGolFattiB.length ? (trasfertaGolFattiB.filter((gf, i) => gf === trasfertaGolSubitiB[i]).length / trasfertaGolFattiB.length * 100) : NaN, document.getElementById('pareggiTrasfertaB')); coloraPercentuale(trasfertaGolFattiB.length ? ((trasfertaGolFattiB.length - vittorieTrasfertaB - trasfertaGolFattiB.filter((gf, i) => gf === trasfertaGolSubitiB[i]).length) / trasfertaGolFattiB.length * 100) : NaN, document.getElementById('sconfitteTrasfertaB'));
    document.getElementById('pesoPosizioneB').textContent = pesoPosizioneB.toFixed(2); document.getElementById('formaB').textContent = puntiB; document.getElementById('punteggioB').textContent = punteggioGeneraleB.toFixed(2); document.getElementById('punteggioCasaB').textContent = punteggioTrasfertaB.toFixed(2); document.getElementById('punteggioTotaleB').textContent = punteggioTotaleB.toFixed(2); document.getElementById('punteggioCoppeB').textContent = punteggioCoppeB.toFixed(2);
    ['punteggioB', 'punteggioCasaB', 'punteggioTotaleB', 'punteggioCoppeB'].forEach(id => document.getElementById(id).className = 'punteggio');

    // --- Aggiornamento UI: Percentuali Esiti & Tendenza C/T ---
    let totaliA = golFattiA.map((gf, i) => gf + golSubitiA[i]);
    let totaliB = golFattiB.map((gf, i) => gf + golSubitiB[i]);
    let casaTotaliA = casaGolFattiA.map((gf, i) => gf + casaGolSubitiA[i]);
    let trasfertaTotaliB = trasfertaGolFattiB.map((gf, i) => gf + trasfertaGolSubitiB[i]);
    const combinedGoalsFatti = [...golFattiA, ...golFattiB]; const combinedGoalsSubiti = [...golSubitiA, ...golSubitiB];
    const lenCasaA = casaGolFattiA.length; const lenTrasfertaB = trasfertaGolFattiB.length;

    // Gol/NoGol/Clean Sheet
    coloraPercentuale(golFattiA.filter((gf, i) => gf > 0 && golSubitiA[i] > 0).length / 6 * 100, document.getElementById('golA'));
    coloraPercentuale(golFattiA.filter((gf, i) => gf === 0 || golSubitiA[i] === 0).length / 6 * 100, document.getElementById('nogolA'));
    coloraPercentuale(golSubitiA.filter(g => g === 0).length / 6 * 100, document.getElementById('cleanSheetA'));
    coloraPercentuale(golFattiB.filter((gf, i) => gf > 0 && golSubitiB[i] > 0).length / 6 * 100, document.getElementById('golB'));
    coloraPercentuale(golFattiB.filter((gf, i) => gf === 0 || golSubitiB[i] === 0).length / 6 * 100, document.getElementById('nogolB'));
    coloraPercentuale(golSubitiB.filter(g => g === 0).length / 6 * 100, document.getElementById('cleanSheetB'));
    coloraPercentuale(combinedGoalsFatti.filter((gf, i) => gf > 0 && combinedGoalsSubiti[i] > 0).length / 12 * 100, document.getElementById('golTot'));
    coloraPercentuale(combinedGoalsFatti.filter((gf, i) => gf === 0 || combinedGoalsSubiti[i] === 0).length / 12 * 100, document.getElementById('nogolTot'));
    coloraPercentuale(combinedGoalsSubiti.filter(g => g === 0).length / 12 * 100, document.getElementById('cleanSheetTot'));
    coloraPercentuale(lenCasaA ? (casaGolFattiA.filter((gf, i) => gf > 0 && casaGolSubitiA[i] > 0).length / lenCasaA * 100) : NaN, document.getElementById('golCasaA'));
    coloraPercentuale(lenCasaA ? (casaGolFattiA.filter((gf, i) => gf === 0 || casaGolSubitiA[i] === 0).length / lenCasaA * 100) : NaN, document.getElementById('nogolCasaA'));
    coloraPercentuale(lenCasaA ? (casaGolSubitiA.filter(g => g === 0).length / lenCasaA * 100) : NaN, document.getElementById('cleanSheetCasaA'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaGolFattiB.filter((gf, i) => gf > 0 && trasfertaGolSubitiB[i] > 0).length / lenTrasfertaB * 100) : NaN, document.getElementById('golTrasfertaB'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaGolFattiB.filter((gf, i) => gf === 0 || trasfertaGolSubitiB[i] === 0).length / lenTrasfertaB * 100) : NaN, document.getElementById('nogolTrasfertaB'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaGolSubitiB.filter(g => g === 0).length / lenTrasfertaB * 100) : NaN, document.getElementById('cleanSheetTrasfertaB'));
    // Over 0.5 (Squadra)
    coloraPercentuale(golFattiA.filter(gf => gf >= 1).length / 6 * 100, document.getElementById('over05A'));
    coloraPercentuale(golFattiB.filter(gf => gf >= 1).length / 6 * 100, document.getElementById('over05B'));
    coloraPercentuale((golFattiA.filter(gf => gf >= 1).length + golFattiB.filter(gf => gf >= 1).length) / 12 * 100, document.getElementById('over05Tot'));
    coloraPercentuale(lenCasaA ? (casaGolFattiA.filter(gf => gf >= 1).length / lenCasaA * 100) : NaN, document.getElementById('over05CasaA'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaGolFattiB.filter(gf => gf >= 1).length / lenTrasfertaB * 100) : NaN, document.getElementById('over05TrasfertaB'));
    // Over/Under 1.5 (Totali)
    coloraPercentuale(totaliA.filter(t => t >= 2).length / 6 * 100, document.getElementById('over15A'));
    coloraPercentuale(totaliB.filter(t => t >= 2).length / 6 * 100, document.getElementById('over15B'));
    coloraPercentuale([...totaliA, ...totaliB].filter(t => t >= 2).length / 12 * 100, document.getElementById('over15Tot'));
    coloraPercentuale(lenCasaA ? (casaTotaliA.filter(t => t >= 2).length / lenCasaA * 100) : NaN, document.getElementById('over15CasaA'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaTotaliB.filter(t => t >= 2).length / lenTrasfertaB * 100) : NaN, document.getElementById('over15TrasfertaB'));
    // Over/Under 2.5 (Totali)
    coloraPercentuale(totaliA.filter(t => t > 2).length / 6 * 100, document.getElementById('over25A'));
    coloraPercentuale(totaliA.filter(t => t <= 2).length / 6 * 100, document.getElementById('under25A'));
    coloraPercentuale(totaliB.filter(t => t > 2).length / 6 * 100, document.getElementById('over25B'));
    coloraPercentuale(totaliB.filter(t => t <= 2).length / 6 * 100, document.getElementById('under25B'));
    coloraPercentuale([...totaliA, ...totaliB].filter(t => t > 2).length / 12 * 100, document.getElementById('over25Tot'));
    coloraPercentuale([...totaliA, ...totaliB].filter(t => t <= 2).length / 12 * 100, document.getElementById('under25Tot'));
    coloraPercentuale(lenCasaA ? (casaTotaliA.filter(t => t > 2).length / lenCasaA * 100) : NaN, document.getElementById('over25CasaA'));
    coloraPercentuale(lenCasaA ? (casaTotaliA.filter(t => t <= 2).length / lenCasaA * 100) : NaN, document.getElementById('under25CasaA'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaTotaliB.filter(t => t > 2).length / lenTrasfertaB * 100) : NaN, document.getElementById('over25TrasfertaB'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaTotaliB.filter(t => t <= 2).length / lenTrasfertaB * 100) : NaN, document.getElementById('under25TrasfertaB'));
    // Over/Under 3.5 (Totali)
    coloraPercentuale(totaliA.filter(t => t > 3).length / 6 * 100, document.getElementById('over35A'));
    coloraPercentuale(totaliA.filter(t => t <= 3).length / 6 * 100, document.getElementById('under35A'));
    coloraPercentuale(totaliB.filter(t => t > 3).length / 6 * 100, document.getElementById('over35B'));
    coloraPercentuale(totaliB.filter(t => t <= 3).length / 6 * 100, document.getElementById('under35B'));
    coloraPercentuale([...totaliA, ...totaliB].filter(t => t > 3).length / 12 * 100, document.getElementById('over35Tot'));
    coloraPercentuale([...totaliA, ...totaliB].filter(t => t <= 3).length / 12 * 100, document.getElementById('under35Tot'));
    coloraPercentuale(lenCasaA ? (casaTotaliA.filter(t => t > 3).length / lenCasaA * 100) : NaN, document.getElementById('over35CasaA'));
    coloraPercentuale(lenCasaA ? (casaTotaliA.filter(t => t <= 3).length / lenCasaA * 100) : NaN, document.getElementById('under35CasaA'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaTotaliB.filter(t => t > 3).length / lenTrasfertaB * 100) : NaN, document.getElementById('over35TrasfertaB'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaTotaliB.filter(t => t <= 3).length / lenTrasfertaB * 100) : NaN, document.getElementById('under35TrasfertaB'));
    // Multigol
    coloraPercentuale(totaliA.filter(t => t >= 1 && t <= 3).length / 6 * 100, document.getElementById('mg13A'));
    coloraPercentuale(totaliA.filter(t => t >= 2 && t <= 4).length / 6 * 100, document.getElementById('mg24A'));
    coloraPercentuale(totaliA.filter(t => t >= 3 && t <= 5).length / 6 * 100, document.getElementById('mg35A'));
    coloraPercentuale(totaliB.filter(t => t >= 1 && t <= 3).length / 6 * 100, document.getElementById('mg13B'));
    coloraPercentuale(totaliB.filter(t => t >= 2 && t <= 4).length / 6 * 100, document.getElementById('mg24B'));
    coloraPercentuale(totaliB.filter(t => t >= 3 && t <= 5).length / 6 * 100, document.getElementById('mg35B'));
    coloraPercentuale([...totaliA, ...totaliB].filter(t => t >= 1 && t <= 3).length / 12 * 100, document.getElementById('mg13Tot'));
    coloraPercentuale([...totaliA, ...totaliB].filter(t => t >= 2 && t <= 4).length / 12 * 100, document.getElementById('mg24Tot'));
    coloraPercentuale([...totaliA, ...totaliB].filter(t => t >= 3 && t <= 5).length / 12 * 100, document.getElementById('mg35Tot'));
    coloraPercentuale(lenCasaA ? (casaTotaliA.filter(t => t >= 1 && t <= 3).length / lenCasaA * 100) : NaN, document.getElementById('mg13CasaA'));
    coloraPercentuale(lenCasaA ? (casaTotaliA.filter(t => t >= 2 && t <= 4).length / lenCasaA * 100) : NaN, document.getElementById('mg24CasaA'));
    coloraPercentuale(lenCasaA ? (casaTotaliA.filter(t => t >= 3 && t <= 5).length / lenCasaA * 100) : NaN, document.getElementById('mg35CasaA'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaTotaliB.filter(t => t >= 1 && t <= 3).length / lenTrasfertaB * 100) : NaN, document.getElementById('mg13TrasfertaB'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaTotaliB.filter(t => t >= 2 && t <= 4).length / lenTrasfertaB * 100) : NaN, document.getElementById('mg24TrasfertaB'));
    coloraPercentuale(lenTrasfertaB ? (trasfertaTotaliB.filter(t => t >= 3 && t <= 5).length / lenTrasfertaB * 100) : NaN, document.getElementById('mg35TrasfertaB'));

    // --- Analisi Dettagliata: Confronto Forma & Statistiche Chiave ---
    const confrontoForma = document.getElementById('confrontoForma');
    confrontoForma.innerHTML = '';
    confrontoForma.innerHTML += `<p><strong>Punti nelle ultime 6:</strong> ${nomeSquadraA} (${puntiA}) vs ${nomeSquadraB} (${puntiB}).</p>`;
    const formaDiff = puntiA - puntiB;
    confrontoForma.innerHTML += `<p><strong>Differenza:</strong> ${formaDiff > 0 ? `${nomeSquadraA} +${formaDiff}` : formaDiff < 0 ? `${nomeSquadraB} +${Math.abs(formaDiff)}` : 'Parità'}.</p>`;
    confrontoForma.innerHTML += `<p><strong>Trend Forma:</strong> ${formaDiff > 3 ? `${nomeSquadraA} in forte crescita` : formaDiff < -3 ? `${nomeSquadraB} in forte crescita` : 'Forma simile'}.</p>`;

    const statisticheChiave = document.getElementById('statisticheChiave').querySelector('tbody');
    statisticheChiave.innerHTML = '';
    const statistiche = [
        { nome: 'Media Gol Fatti', valA: mediaGolFattiA, valB: mediaGolFattiB },
        { nome: 'Media Gol Subiti', valA: mediaGolSubitiA, valB: mediaGolSubitiB },
        { nome: '% Vittorie', valA: vittorieA / 6 * 100, valB: vittorieB / 6 * 100 },
        { nome: '% Clean Sheet', valA: golSubitiA.filter(g => g === 0).length / 6 * 100, valB: golSubitiB.filter(g => g === 0).length / 6 * 100 },
        { nome: '% Over 2.5', valA: totaliA.filter(t => t > 2).length / 6 * 100, valB: totaliB.filter(t => t > 2).length / 6 * 100 }
    ];
    statistiche.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${stat.nome}</td><td>${stat.valA.toFixed(1)}${stat.nome.includes('%') ? '%' : ''}</td><td>${stat.valB.toFixed(1)}${stat.nome.includes('%') ? '%' : ''}</td>`;
        statisticheChiave.appendChild(row);
    });

    // --- Analisi Dettagliata: Predizione Esito e Spunti (Logica Estesa) ---
    const predizioneContainer = document.getElementById('predizioneEsito');
    const golAttesiOut = document.getElementById('golAttesiOut');
    const prob1X2Out = document.getElementById('prob1X2Out');
    const probOverGolOut = document.getElementById('probOverGolOut');
    const spuntiList = document.getElementById('spuntiAnalisiList');
    spuntiList.innerHTML = ''; // Pulisci

    const golAttesiA = (mediaGolFattiCasaA * 0.6 + mediaGolSubitiTrasfertaB * 0.4) || (mediaGolFattiA * 0.6 + mediaGolSubitiB * 0.4) * 1.1;
    const golAttesiB = (mediaGolFattiTrasfertaB * 0.6 + mediaGolSubitiCasaA * 0.4) || (mediaGolFattiB * 0.6 + mediaGolSubitiA * 0.4) * 0.9;
    golAttesiOut.textContent = `${nomeSquadraA} ${golAttesiA.toFixed(1)} - ${nomeSquadraB} ${golAttesiB.toFixed(1)}`;

    let probVittoriaA_pred = 50 + (golAttesiA - golAttesiB) * 15;
    let probVittoriaB_pred = 50 + (golAttesiB - golAttesiA) * 15;
    let probPareggio_pred = 100 - probVittoriaA_pred - probVittoriaB_pred;
    if (probPareggio_pred < 10) { const d = 10 - probPareggio_pred; probPareggio_pred=10; if(probVittoriaA_pred>probVittoriaB_pred) probVittoriaA_pred-=d; else probVittoriaB_pred-=d; }
    probVittoriaA_pred = Math.max(5, Math.min(90, probVittoriaA_pred));
    probVittoriaB_pred = Math.max(5, Math.min(90, probVittoriaB_pred));
    probPareggio_pred = 100 - probVittoriaA_pred - probVittoriaB_pred;
    prob1X2Out.innerHTML = `1 (<span class="highlight">${probVittoriaA_pred.toFixed(0)}%</span>) - X (<span class="highlight">${probPareggio_pred.toFixed(0)}%</span>) - 2 (<span class="highlight">${probVittoriaB_pred.toFixed(0)}%</span>)`;

    const totalGolAttesi = golAttesiA + golAttesiB;
    const over25FreqA = totaliA.filter(t => t > 2).length / 6 * 100;
    const over25FreqB = totaliB.filter(t => t > 2).length / 6 * 100;
    const over25Prob = Math.min(90, Math.max(10, (over25FreqA + over25FreqB) / 2 + (totalGolAttesi > 2.7 ? 15 : (totalGolAttesi < 2.3 ? -15 : 0))));
    const golFreqA_pred = golFattiA.filter((gf, i) => gf > 0 && golSubitiA[i] > 0).length / 6 * 100;
    const golFreqB_pred = golFattiB.filter((gf, i) => gf > 0 && golSubitiB[i] > 0).length / 6 * 100;
    const golProb = Math.min(90, Math.max(10, (golFreqA_pred + golFreqB_pred) / 2 + (golAttesiA > 0.7 && golAttesiB > 0.7 ? 20 : (golAttesiA < 0.4 || golAttesiB < 0.4 ? -20 : 0))));
    probOverGolOut.innerHTML = `Over 2.5 (<span class="highlight">${over25Prob.toFixed(0)}%</span>) - Gol (<span class="highlight">${golProb.toFixed(0)}%</span>)`;

    // Generazione Spunti Estesa
    const spunti = [];
    const diffPunteggio = punteggioTotaleA - punteggioTotaleB;
    const sogliaAlta = 68; const sogliaMoltoAlta = 80; const sogliaMedia = 55; const sogliaBassa = 32;

    // 1. Esito Finale 1X2 Forte
    if (probVittoriaA_pred > sogliaAlta && diffPunteggio > 0.15) spunti.push(`Esito <strong>1</strong> (${nomeSquadraA}) appare probabile. Punteggio (${punteggioTotaleA.toFixed(2)} vs ${punteggioTotaleB.toFixed(2)}) e probabilità (${probVittoriaA_pred.toFixed(0)}%) a favore.`);
    if (probVittoriaB_pred > sogliaAlta && diffPunteggio < -0.15) spunti.push(`Esito <strong>2</strong> (${nomeSquadraB}) appare probabile. Punteggio (${punteggioTotaleA.toFixed(2)} vs ${punteggioTotaleB.toFixed(2)}) e probabilità (${probVittoriaB_pred.toFixed(0)}%) a favore.`);
    if (probPareggio_pred > 35 && Math.abs(diffPunteggio) < 0.1) spunti.push(`Esito <strong>X</strong> (Pareggio) possibile. Punteggi vicini (${punteggioTotaleA.toFixed(2)} vs ${punteggioTotaleB.toFixed(2)}) e probabilità X (${probPareggio_pred.toFixed(0)}%) discreta.`);

    // 2. Doppie Chance Forti
    const prob1X = probVittoriaA_pred + probPareggio_pred; const probX2 = probVittoriaB_pred + probPareggio_pred; const prob12 = probVittoriaA_pred + probVittoriaB_pred;
    if (prob1X > sogliaMoltoAlta && probVittoriaA_pred > probVittoriaB_pred) spunti.push(`Doppia Chance <strong>1X</strong> molto probabile (${prob1X.toFixed(0)}%).`);
    if (probX2 > sogliaMoltoAlta && probVittoriaB_pred > probVittoriaA_pred) spunti.push(`Doppia Chance <strong>X2</strong> molto probabile (${probX2.toFixed(0)}%).`);
    if (prob12 > sogliaMoltoAlta) spunti.push(`Doppia Chance <strong>12</strong> (Evita X) molto probabile (${prob12.toFixed(0)}%).`);

    // 3. Gol/NoGol Forte
    const golPercentualeTot = parseFloat(document.getElementById('golTot').textContent) || 0;
    if (golProb > sogliaAlta && golPercentualeTot > 60) spunti.push(`Esito <strong>Gol</strong> (entrambe segnano) probabile (Stimato: ${golProb.toFixed(0)}%, Storico: ${golPercentualeTot.toFixed(1)}%).`);
    if (golProb < sogliaBassa && (parseFloat(document.getElementById('nogolTot').textContent) || 0) > 60) spunti.push(`Esito <strong>No Gol</strong> probabile (Stimato Gol: ${golProb.toFixed(0)}%, Storico NG: ${(parseFloat(document.getElementById('nogolTot').textContent) || 0).toFixed(1)}%).`);

    // 4. Over/Under 2.5 Forte
    const over25PercentualeTot = parseFloat(document.getElementById('over25Tot').textContent) || 0;
    if (over25Prob > sogliaAlta && over25PercentualeTot > 60) spunti.push(`Esito <strong>Over 2.5</strong> probabile (Stimato: ${over25Prob.toFixed(0)}%, Storico: ${over25PercentualeTot.toFixed(1)}%).`);
    if (over25Prob < sogliaBassa && (parseFloat(document.getElementById('under25Tot').textContent) || 0) > 60) spunti.push(`Esito <strong>Under 2.5</strong> probabile (Stimato Over: ${over25Prob.toFixed(0)}%, Storico Under: ${(parseFloat(document.getElementById('under25Tot').textContent) || 0).toFixed(1)}%).`);

    // 5. Over 1.5 Molto Forte
    const over15PercentualeTot = parseFloat(document.getElementById('over15Tot').textContent) || 0;
    if (over15PercentualeTot > sogliaMoltoAlta) spunti.push(`Esito <strong>Over 1.5</strong> molto probabile (Storico: ${over15PercentualeTot.toFixed(1)}%). Base per combo?`);

    // 6. Under 3.5 Molto Forte
    const under35PercentualeTot = parseFloat(document.getElementById('under35Tot').textContent) || 0;
    if (under35PercentualeTot > sogliaMoltoAlta) spunti.push(`Esito <strong>Under 3.5</strong> molto probabile (Storico: ${under35PercentualeTot.toFixed(1)}%). Base per combo?`);

    // 7. Squadra A Segna (Over 0.5 A)
    const over05APerc = parseFloat(document.getElementById('over05A').textContent) || 0;
    if (over05APerc >= sogliaMoltoAlta) spunti.push(`${nomeSquadraA} <strong>quasi sempre a segno</strong> (${over05APerc.toFixed(1)}% partite con gol). Valutare "Segna Gol Casa".`);
    else if (over05APerc < sogliaBassa) spunti.push(`${nomeSquadraA} con <strong>difficoltà a segnare</strong> (${(100 - over05APerc).toFixed(1)}% partite senza gol). Valutare "Non Segna Gol Casa".`);

    // 8. Squadra B Segna (Over 0.5 B)
    const over05BPerc = parseFloat(document.getElementById('over05B').textContent) || 0;
    if (over05BPerc >= sogliaMoltoAlta) spunti.push(`${nomeSquadraB} <strong>quasi sempre a segno</strong> (${over05BPerc.toFixed(1)}% partite con gol). Valutare "Segna Gol Trasferta".`);
    else if (over05BPerc < sogliaBassa) spunti.push(`${nomeSquadraB} con <strong>difficoltà a segnare</strong> (${(100 - over05BPerc).toFixed(1)}% partite senza gol). Valutare "Non Segna Gol Trasferta".`);

    // 9. Clean Sheet A (Squadra A non subisce gol)
    const cleanSheetAPerc = parseFloat(document.getElementById('cleanSheetA').textContent) || 0;
    if (cleanSheetAPerc >= sogliaMedia) spunti.push(`${nomeSquadraA} mantiene spesso la <strong>porta inviolata</strong> (${cleanSheetAPerc.toFixed(1)}%). Possibile NoGol Squadra Ospite.`);

    // 10. Clean Sheet B (Squadra B non subisce gol)
    const cleanSheetBPerc = parseFloat(document.getElementById('cleanSheetB').textContent) || 0;
    if (cleanSheetBPerc >= sogliaMedia) spunti.push(`${nomeSquadraB} mantiene spesso la <strong>porta inviolata</strong> (${cleanSheetBPerc.toFixed(1)}%). Possibile NoGol Squadra Casa.`);

    // 11. Fattore Campo/Trasferta Specifico
    const vittorieCasaAPerc = parseFloat(document.getElementById('vittorieCasaA').textContent) || 0;
    const sconfitteTrasfertaBPerc = parseFloat(document.getElementById('sconfitteTrasfertaB').textContent) || 0;
     if (vittorieCasaAPerc > 65 && sconfitteTrasfertaBPerc > 65) spunti.push(`<strong>Fattore campo</strong> marcato: ${nomeSquadraA} forte in casa (${vittorieCasaAPerc.toFixed(1)}% V), ${nomeSquadraB} debole fuori (${sconfitteTrasfertaBPerc.toFixed(1)}% S).`);
     const sconfitteCasaAPerc = parseFloat(document.getElementById('sconfitteCasaA').textContent) || 0;
     const vittorieTrasfertaBPerc = parseFloat(document.getElementById('vittorieTrasfertaB').textContent) || 0;
     if (sconfitteCasaAPerc > 65 && vittorieTrasfertaBPerc > 65) spunti.push(`<strong>Fattore campo invertito?</strong> ${nomeSquadraA} debole in casa (${sconfitteCasaAPerc.toFixed(1)}% S), ${nomeSquadraB} forte fuori (${vittorieTrasfertaBPerc.toFixed(1)}% V).`);

    // 12. Confronto Punteggi Specifici C/T
     const punteggioSpecCasaA = parseFloat(document.getElementById('punteggioCasaA').textContent) || 0;
     const punteggioSpecTrasfB = parseFloat(document.getElementById('punteggioCasaB').textContent) || 0;
     const diffPunteggioSpec = punteggioSpecCasaA - punteggioSpecTrasfB;
     if (diffPunteggioSpec > 0.25) spunti.push(`Punteggio specifico C/T nettamente a favore di <strong>${nomeSquadraA}</strong> (${punteggioSpecCasaA.toFixed(2)} vs ${punteggioSpecTrasfB.toFixed(2)}).`);
     else if (diffPunteggioSpec < -0.25) spunti.push(`Punteggio specifico C/T nettamente a favore di <strong>${nomeSquadraB}</strong> (${punteggioSpecCasaA.toFixed(2)} vs ${punteggioSpecTrasfB.toFixed(2)}).`);

    // 13. Multigol 2-4 (se probabile)
    const mg24TotPerc = parseFloat(document.getElementById('mg24Tot').textContent) || 0;
    if (mg24TotPerc > sogliaMedia) spunti.push(`Range <strong>Multigol 2-4</strong> con frequenza interessante (${mg24TotPerc.toFixed(1)}%).`);

    // Messaggio finale se pochi spunti o partita incerta
     if (spunti.length < 5 || (Math.abs(diffPunteggio) < 0.05 && probPareggio_pred > 30 && Math.abs(over25Prob - 50) < 15 && Math.abs(golProb - 50) < 15)) {
        if (spunti.length > 0 && spunti.length < 8) spunti.push("<hr>"); // Aggiungi separatore solo se ci sono pochi spunti prima
        spunti.push(`<strong>Partita potenzialmente equilibrata o incerta:</strong> Pochi segnali statistici forti o dati contrastanti. Valutare attentamente.`);
    }

    // Mostra gli spunti generati (limita a un massimo ragionevole, es. 12)
    spunti.slice(0, 12).forEach(testo => {
        const li = document.createElement('li');
        li.innerHTML = testo;
        spuntiList.appendChild(li);
    });
    // --- Fine Analisi Dettagliata Migliorata ---

    // --- Finalizzazione ---
    localStorage.setItem('ultimiDati', JSON.stringify(datiAttuali));
    togglePunteggioCoppe();
    aggiornaStoricoGiocate();
    aggiornaTabellaPartite();
    document.getElementById('moduloRisultati').open = true;
    document.getElementById('moduloPercentualiEsiti').open = true;
    document.getElementById('moduloTendenzaCasaTrasferta').open = true;
    document.getElementById('moduloAnalisiDettagliata').open = true;
}


function togglePunteggioCoppe() {
    const mostra = document.getElementById('mostraPunteggioCoppe').checked;
    document.querySelectorAll('.punteggio-coppe').forEach(row => {
        row.style.display = mostra ? '' : 'none';
    });
}

function cancellaDati() {
    document.getElementById('formAnalisi').reset();
    document.querySelectorAll('.esito').forEach(span => span.textContent = '');
    document.querySelectorAll('#risultati span, #percentualiEsiti span, #tendenzaCasaTrasfertaTable span').forEach(span => {
        span.textContent = ''; span.style.backgroundColor = ''; span.className = ''; });
    document.getElementById('sequenzaA').innerHTML = ''; document.getElementById('sequenzaB').innerHTML = '';
    document.getElementById('confrontoForma').innerHTML = ''; document.getElementById('statisticheChiave').querySelector('tbody').innerHTML = '';
    document.getElementById('golAttesiOut').textContent = 'N/D'; document.getElementById('prob1X2Out').textContent = 'N/D';
    document.getElementById('probOverGolOut').textContent = 'N/D'; document.getElementById('spuntiAnalisiList').innerHTML = '<li>Calcolare i risultati per visualizzare gli spunti...</li>';
    document.getElementById('mostraPunteggioCoppe').checked = false; togglePunteggioCoppe();
    const selectPartite = document.getElementById('selezionaPartitaPrecedente');
    if (selectPartite) selectPartite.selectedIndex = 0;
    datiAttuali = null; localStorage.removeItem('ultimiDati');
}

// --- Gestione Partite Salvate (Dropdown e Caricamento Dati) ---

function popolaDropdownPartite() {
    try { partitePrecedentiCache = JSON.parse(localStorage.getItem('partitePrecedenti')) || []; }
    catch (e) { console.error("Errore parsing partite salvate:", e); partitePrecedentiCache = []; localStorage.removeItem('partitePrecedenti'); }
    const selectPartite = document.getElementById('selezionaPartitaPrecedente');
    selectPartite.innerHTML = '<option value="" disabled selected>Carica Partita Precedente</option>';
    if (partitePrecedentiCache.length === 0) { selectPartite.disabled = true; }
    else { selectPartite.disabled = false;
        partitePrecedentiCache.sort((a, b) => { /* ... Ordinamento per data ... */ }); // Invariato
          partitePrecedentiCache.sort((a, b) => {
             const parseDate = (ts) => { if (!ts) return 0; const parts = ts.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})/); if (parts) { return new Date(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4]}:${parts[5]}:${parts[6]}`).getTime(); } const parsed = Date.parse(ts); return isNaN(parsed) ? 0 : parsed; };
             return parseDate(b.timestamp) - parseDate(a.timestamp); });

        partitePrecedentiCache.forEach((partita, index) => { /* ... Popola opzioni ... */ }); // Invariato
         partitePrecedentiCache.forEach((partita, index) => {
            const option = document.createElement('option');
            const nomePartita = `${partita.nomeSquadraA || '?'} vs ${partita.nomeSquadraB || '?'}`;
            const dataMatch = partita.timestamp ? partita.timestamp.split(',')[0].split('/').slice(0, 2).join('/') : '';
            const infoAggiuntive = partita.giocata ? `(${partita.giocata})` : dataMatch ? `(${dataMatch})` : '';
            option.value = index; option.textContent = `${index + 1}. ${nomePartita} ${infoAggiuntive}`; selectPartite.appendChild(option); }); }
}

function caricaDatiPartita(datiSalvati) {
     if (!datiSalvati) return;
     document.getElementById('moduloInserimentoDati').open = true;
     document.getElementById('nomeSquadraA').value = datiSalvati.nomeSquadraA || ''; document.getElementById('nomeSquadraB').value = datiSalvati.nomeSquadraB || '';
     for (let i = 1; i <= 6; i++) { document.getElementsByName(`golFattiA${i}`)[0].value = datiSalvati.golFattiA?.[i-1] ?? 0; document.getElementsByName(`golSubitiA${i}`)[0].value = datiSalvati.golSubitiA?.[i-1] ?? 0; document.getElementsByName(`casaTrasfertaA${i}`)[0].value = datiSalvati.casaTrasfertaA?.[i-1] ?? 'C'; document.getElementsByName(`avversarioA${i}`)[0].value = datiSalvati.avversariA?.[i-1] ?? ''; document.getElementsByName(`golFattiB${i}`)[0].value = datiSalvati.golFattiB?.[i-1] ?? 0; document.getElementsByName(`golSubitiB${i}`)[0].value = datiSalvati.golSubitiB?.[i-1] ?? 0; document.getElementsByName(`casaTrasfertaB${i}`)[0].value = datiSalvati.casaTrasfertaB?.[i-1] ?? 'T'; document.getElementsByName(`avversarioB${i}`)[0].value = datiSalvati.avversariB?.[i-1] ?? ''; }
     document.getElementsByName('posizioneA')[0].value = datiSalvati.posizioneA ?? 1; document.getElementsByName('totSquadreA')[0].value = datiSalvati.totSquadreA ?? 1; document.getElementsByName('coeffA')[0].value = datiSalvati.coeffA ?? 0;
     document.getElementsByName('posizioneB')[0].value = datiSalvati.posizioneB ?? 1; document.getElementsByName('totSquadreB')[0].value = datiSalvati.totSquadreB ?? 1; document.getElementsByName('coeffB')[0].value = datiSalvati.coeffB ?? 0;
     calcolaRisultati();
 }

// --- Gestione Tabella Partite Salvate (Modulo "Partite Salvate") ---
function aggiornaTabellaPartite() {
    const container = document.getElementById('partiteSalvatiBody'); container.innerHTML = '';
    if (partitePrecedentiCache.length === 0) { container.innerHTML = '<p>Nessuna partita salvata.</p>'; return; }
    const gruppi = {};
    partitePrecedentiCache.forEach((partita, indexOriginaleInCache) => { partita.originalIndex = indexOriginaleInCache; const gruppo = partita.gruppo || "Senza Gruppo"; if (!gruppi[gruppo]) gruppi[gruppo] = {}; const schedina = partita.schedina || 1; if (!gruppi[gruppo][schedina]) gruppi[gruppo][schedina] = []; gruppi[gruppo][schedina].push(partita); });
    let totaleVincente = 0; let totalePartiteValutate = 0;

    let nomiGruppiOrdinatiRobust = [];
    try { if (gruppi && typeof gruppi === 'object') { nomiGruppiOrdinatiRobust = Object.keys(gruppi).sort((a, b) => { const strA = String(a); const strB = String(b); if (strA === "Senza Gruppo") return 1; if (strB === "Senza Gruppo") return -1; return strA.localeCompare(strB); }); } else { console.error("L'oggetto 'gruppi' non è valido:", gruppi); } } catch (e) { console.error("Errore durante l'ordinamento dei gruppi:", e); }

    for (const gruppo of nomiGruppiOrdinatiRobust) { // Usa array ordinato robusto
        const gruppoDiv = document.createElement('div'); gruppoDiv.className = 'gruppo-partite'; const titoloGruppo = document.createElement('h3'); titoloGruppo.textContent = gruppo; gruppoDiv.appendChild(titoloGruppo);
        const partiteNelGruppo = Object.values(gruppi[gruppo]).flat(); const gruppoVincente = partiteNelGruppo.filter(p => p.esito === 'Vincente').length; const gruppoPerdente = partiteNelGruppo.filter(p => p.esito === 'Perdente').length; const gruppoTotaleValutate = gruppoVincente + gruppoPerdente; const percGruppo = gruppoTotaleValutate ? (gruppoVincente / gruppoTotaleValutate * 100) : 0; totaleVincente += gruppoVincente; totalePartiteValutate += gruppoTotaleValutate; const percSpanGruppo = document.createElement('span'); percSpanGruppo.className = 'perc-vincente'; percSpanGruppo.textContent = `Vincente: ${percGruppo.toFixed(1)}% (${gruppoVincente}/${gruppoTotaleValutate})`; titoloGruppo.appendChild(percSpanGruppo);
        const numeriSchedineOrdinate = Object.keys(gruppi[gruppo]).map(Number).sort((a, b) => a - b);
        for (const schedina of numeriSchedineOrdinate) {
            const sottogruppoDiv = document.createElement('div'); sottogruppoDiv.className = 'sottogruppo-partite'; const titoloSchedina = document.createElement('h4'); titoloSchedina.textContent = `Schedina ${schedina}`; sottogruppoDiv.appendChild(titoloSchedina);
            const partiteNellaSchedina = gruppi[gruppo][schedina]; const sottogruppoVincente = partiteNellaSchedina.filter(p => p.esito === 'Vincente').length; const sottogruppoPerdente = partiteNellaSchedina.filter(p => p.esito === 'Perdente').length; const sottogruppoTotaleValutate = sottogruppoVincente + sottogruppoPerdente; const percSottogruppo = sottogruppoTotaleValutate ? (sottogruppoVincente / sottogruppoTotaleValutate * 100) : 0; const percSpanSottogruppo = document.createElement('span'); percSpanSottogruppo.className = 'perc-vincente'; percSpanSottogruppo.textContent = `Vincente: ${percSottogruppo.toFixed(1)}% (${sottogruppoVincente}/${sottogruppoTotaleValutate})`; titoloSchedina.appendChild(percSpanSottogruppo);
            const table = document.createElement('table'); table.innerHTML = `<thead><tr><th>Squadre</th><th>Giocata</th><th>Risultato</th><th>Esito</th><th>Gruppo</th><th>Schedina</th><th>Azione</th></tr></thead><tbody></tbody>`; const tbody = table.querySelector('tbody');
            partiteNellaSchedina.sort((a, b) => new Date(a.timestamp.replace(/(\d{2})\/(\d{2})\/(\d{4}),/, '$2/$1/$3,')) - new Date(b.timestamp.replace(/(\d{2})\/(\d{2})\/(\d{4}),/, '$2/$1/$3,')));
            partiteNellaSchedina.forEach((partita) => {
                const index = partita.originalIndex; const row = document.createElement('tr');
                row.innerHTML = `<td>${partita.nomeSquadraA||'?'} vs ${partita.nomeSquadraB||'?'}</td><td><input type="text" class="gioco-input" value="${partita.giocata||''}" onchange="aggiornaGiocata(${index}, this.value)" title="Modifica Giocata"></td><td><input type="text" class="gioco-input" value="${partita.risultato||''}" onchange="aggiornaRisultato(${index}, this.value)" title="Modifica Risultato"></td><td><select class="esito-select" onchange="aggiornaEsito(${index}, this.value)" title="Modifica Esito"><option value="" ${!partita.esito?'selected':''}>Seleziona</option><option value="Vincente" ${partita.esito==='Vincente'?'selected':''}>Vincente</option><option value="Perdente" ${partita.esito==='Perdente'?'selected':''}>Perdente</option></select></td><td><input type="text" class="gruppo-input" value="${partita.gruppo||'Senza Gruppo'}" onchange="aggiornaGruppo(${index}, this.value)" title="Modifica Gruppo"></td><td><select class="schedina-select" onchange="aggiornaSchedina(${index}, this.value)" title="Modifica Schedina">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${partita.schedina===n?'selected':''}>${n}</option>`).join('')}</select></td><td><button class="elimina-btn" onclick="eliminaSingolaPartita(${index})" title="Elimina Partita">Elimina</button></td>`;
                tbody.appendChild(row); const esitoSelect = row.querySelector('.esito-select'); if(partita.esito==='Vincente')esitoSelect.classList.add('vincente'); else if(partita.esito==='Perdente')esitoSelect.classList.add('perdente'); });
            sottogruppoDiv.appendChild(table); gruppoDiv.appendChild(sottogruppoDiv); }
        container.appendChild(gruppoDiv); }
    const percTotale = totalePartiteValutate ? (totaleVincente / totalePartiteValutate * 100) : 0;
    const riepilogoDiv = document.createElement('div'); riepilogoDiv.style.marginTop = '20px';
    riepilogoDiv.innerHTML = `<h3>Riepilogo Totale</h3><span class="perc-vincente">Percentuale Vincente Globale: ${percTotale.toFixed(1)}% (${totaleVincente}/${totalePartiteValutate})</span>`;
    container.appendChild(riepilogoDiv);
}

function eliminaSingolaPartita(indexOriginale) { if (confirm("Eliminare questa partita?")) { partitePrecedentiCache.splice(indexOriginale, 1); localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache)); popolaDropdownPartite(); aggiornaTabellaPartite(); aggiornaStoricoGiocate(); } }
function eliminaPartiteSalvati() { if (confirm("Eliminare TUTTE le partite salvate?")) { localStorage.removeItem('partitePrecedenti'); localStorage.removeItem('ultimiDati'); datiAttuali = null; partitePrecedentiCache = []; popolaDropdownPartite(); aggiornaTabellaPartite(); aggiornaStoricoGiocate(); alert("Partite eliminate!"); } }
function aggiornaRisultato(indexOriginale, valore) { if (partitePrecedentiCache[indexOriginale]) { partitePrecedentiCache[indexOriginale].risultato = valore.trim(); localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache)); } }
function aggiornaEsito(indexOriginale, valore) { if (partitePrecedentiCache[indexOriginale]) { partitePrecedentiCache[indexOriginale].esito = valore; localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache)); aggiornaTabellaPartite(); aggiornaStoricoGiocate(); } }
function aggiornaGruppo(indexOriginale, valore) { if (partitePrecedentiCache[indexOriginale]) { partitePrecedentiCache[indexOriginale].gruppo = valore.trim() || "Senza Gruppo"; localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache)); aggiornaTabellaPartite(); } }
function aggiornaSchedina(indexOriginale, valore) { if (partitePrecedentiCache[indexOriginale]) { partitePrecedentiCache[indexOriginale].schedina = parseInt(valore) || 1; localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache)); aggiornaTabellaPartite(); } }
function aggiornaGiocata(indexOriginale, valore) { if (partitePrecedentiCache[indexOriginale]) { partitePrecedentiCache[indexOriginale].giocata = valore.trim(); localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache)); aggiornaStoricoGiocate(); popolaDropdownPartite(); } }

function salvaPartita() {
    if (!datiAttuali) { alert("Calcola risultati prima."); return; }
    if (!datiAttuali.nomeSquadraA || !datiAttuali.nomeSquadraB) { alert("Inserisci nomi squadre."); return; }
    const partitaDaSalvare = JSON.parse(JSON.stringify(datiAttuali));
    partitaDaSalvare.giocata = ""; partitaDaSalvare.gruppo = "Senza Gruppo"; partitaDaSalvare.schedina = 1; partitaDaSalvare.risultato = ""; partitaDaSalvare.esito = ""; partitaDaSalvare.timestamp = new Date().toLocaleString();
    partitePrecedentiCache.push(partitaDaSalvare); localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedentiCache));
    popolaDropdownPartite(); aggiornaTabellaPartite(); aggiornaStoricoGiocate();
    alert(`Partita "${partitaDaSalvare.nomeSquadraA} vs ${partitaDaSalvare.nomeSquadraB}" salvata. Modifica dettagli in tabella.`);
}

// --- Funzioni Import/Export/Generazione File ---
function esportaPartite() { if(partitePrecedentiCache.length===0){alert("Nessuna partita!");return;} const nF=prompt("Nome file:","partite_salvate"); if(!nF)return; const dS=JSON.stringify(partitePrecedentiCache,null,2),bl=new Blob([dS],{type:"application/json"}),u=URL.createObjectURL(bl),a=document.createElement("a"); a.href=u;a.download=`${nF}.json`;a.click();URL.revokeObjectURL(u);}
function importaPartite() { const i=document.createElement("input");i.type="file";i.accept=".json";i.onchange=function(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(ev){try{const d=JSON.parse(ev.target.result);if(!Array.isArray(d))throw new Error("File non è array.");const vD=d.filter(p=>p&&p.nomeSquadraA&&p.nomeSquadraB);if(vD.length!==d.length)alert("Alcune partite scartate.");partitePrecedentiCache=partitePrecedentiCache.concat(vD);localStorage.setItem('partitePrecedenti',JSON.stringify(partitePrecedentiCache));popolaDropdownPartite();aggiornaTabellaPartite();aggiornaStoricoGiocate();alert(`Importate ${vD.length} partite.`);}catch(err){alert("Errore importazione:"+err.message);}};r.readAsText(f);};i.click();}
function screenshotPartite() { const s=document.getElementById('partiteSalvati'); if(partitePrecedentiCache.length===0){alert("Nessuna partita!");return;} alert("Preparazione screenshot..."); const o={scale:window.devicePixelRatio||2,useCORS:true,backgroundColor:'#ffffff',scrollX:0,scrollY:0,windowWidth:Math.max(window.innerWidth,s.scrollWidth),windowHeight:Math.max(window.innerHeight,s.scrollHeight)}; html2canvas(s,o).then(c=>{const l=document.createElement('a');l.download='partite_salvate.png';l.href=c.toDataURL('image/png');l.click();}).catch(err=>{console.error("Errore Screenshot:",err);alert("Errore screenshot:"+err.message);});}
function generaFile(sq) { const f=document.getElementById('formAnalisi'),fd=new FormData(f),nS=sq==='A'?fd.get('nomeSquadraA'):fd.get('nomeSquadraB'); if(!nS){alert("Nome squadra?");return;} let dS={nomeSquadra:nS,partite:[]}; for(let i=1;i<=6;i++){const a=fd.get(`avversario${sq}${i}`)||'';if(a){const gF=parseInt(fd.get(`golFatti${sq}${i}`)||0),gS=parseInt(fd.get(`golSubiti${sq}${i}`)||0),cT=fd.get(`casaTrasferta${sq}${i}`).toUpperCase(),e=gF>gS?'V':(gF<gS?'S':'P'); dS.partite.push({avversario:a,golCasa:cT==='C'?gF:gS,golTrasferta:cT==='C'?gS:gF,esito:e,casaTrasferta:cT});}} if(dS.partite.length===0){alert("Nessuna partita valida.");return;} const dStr=JSON.stringify(dS,null,2),bl=new Blob([dStr],{type:"application/json"}),u=URL.createObjectURL(bl),a=document.createElement("a");a.href=u;a.download=`${nS}.json`;a.click();URL.revokeObjectURL(u);}
function importaFile(sq) { const i=document.createElement("input");i.type="file";i.accept=".json";i.onchange=function(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=function(ev){try{const dI=JSON.parse(ev.target.result);if(!dI||!dI.nomeSquadra||!Array.isArray(dI.partite))throw new Error("Formato JSON non valido.");const nC=sq==='A'?'nomeSquadraA':'nomeSquadraB';document.getElementById(nC).value=dI.nomeSquadra;for(let j=1;j<=6;j++){document.getElementsByName(`avversario${sq}${j}`)[0].value='';document.getElementsByName(`golFatti${sq}${j}`)[0].value=0;document.getElementsByName(`golSubiti${sq}${j}`)[0].value=0;document.getElementsByName(`casaTrasferta${sq}${j}`)[0].value='C';}for(let j=0;j<Math.min(6,dI.partite.length);j++){const p=dI.partite[j],iF=j+1;document.getElementsByName(`avversario${sq}${iF}`)[0].value=p.avversario;document.getElementsByName(`golFatti${sq}${iF}`)[0].value=p.casaTrasferta==='C'?p.golCasa:p.golTrasferta;document.getElementsByName(`golSubiti${sq}${iF}`)[0].value=p.casaTrasferta==='C'?p.golTrasferta:p.golCasa;document.getElementsByName(`casaTrasferta${sq}${iF}`)[0].value=p.casaTrasferta;}alert(`Dati "${dI.nomeSquadra}" importati!`);}catch(err){alert("Errore importazione:"+err.message);}};r.readAsText(f);};i.click();}
function generaFileDaTesto() { const tI=document.getElementById('textInput').value.trim();if(!tI){alert("Inserisci testo...");return;}const r=tI.split('\n').filter(l=>l.trim()!==''),rPP=7;if(r.length<rPP||r.length%rPP!==0){alert(`Formato testo errato. Righe:${r.length}`);return;}let dS={nomeSquadra:"",partite:[]};const sC={};const nP=r.length/rPP;for(let i=0;i<r.length;i+=rPP){const s1=r[i+2],s2=r[i+3];sC[s1]=(sC[s1]||0)+1;sC[s2]=(sC[s2]||0)+1;}dS.nomeSquadra=Object.keys(sC).find(s=>sC[s]===nP);if(!dS.nomeSquadra){alert("Squadra principale non trovata.");return;}for(let i=0;i<r.length;i+=rPP){const s1=r[i+2],s2=r[i+3],gC=parseInt(r[i+4])||0,gT=parseInt(r[i+5])||0,e=r[i+6].toUpperCase();const isCasa=dS.nomeSquadra===s1,cT=isCasa?'C':'T',avv=isCasa?s2:s1,avvS=avv.replace(/^(Ath\.|FC|Real|Sporting)\s+/i,'');dS.partite.push({avversario:avvS,golCasa:gC,golTrasferta:gT,esito:e,casaTrasferta:cT});}if(dS.partite.length===0){alert("Nessuna partita estratta.");return;}const dStr=JSON.stringify(dS,null,2),bl=new Blob([dStr],{type:"application/json"}),u=URL.createObjectURL(bl),a=document.createElement("a");a.href=u;a.download=`${dS.nomeSquadra}.json`;a.click();URL.revokeObjectURL(u);const gF=document.querySelector('.generatore-form');if(!document.getElementById('pulisciBtn')){const b=document.createElement('button');b.id='pulisciBtn';b.textContent='Pulisci';b.type='button';b.style.marginLeft='10px';b.onclick=pulisciGeneratore;gF.appendChild(b);}}
function pulisciGeneratore() { document.getElementById('textInput').value = ''; }

// --- Storico Giocate ---
function aggiornaStoricoGiocate() { const t=document.getElementById('storicoGiocateBody');t.innerHTML='';if(partitePrecedentiCache.length===0){t.innerHTML='<tr><td colspan="4">Nessuna giocata salvata.</td></tr>';return;}const gS={};let pV=0;partitePrecedentiCache.forEach(p=>{const g=p.giocata?p.giocata.trim():'',e=p.esito;if(g&&(e==='Vincente'||e==='Perdente')){pV++;if(!gS[g])gS[g]={count:0,vincente:0,perdente:0};gS[g].count++;if(e==='Vincente')gS[g].vincente++;else if(e==='Perdente')gS[g].perdente++;}});if(Object.keys(gS).length===0){t.innerHTML='<tr><td colspan="4">Nessuna giocata con esito definito.</td></tr>';return;}const gA=Object.entries(gS).map(([g,s])=>({giocata:g,frequenza:s.count,percVittoria:s.count?(s.vincente/s.count*100):0,percPerdita:s.count?(s.perdente/s.count*100):0}));const cA=Object.keys(sortDirection).find(k=>sortDirection[k]!=='desc')||2;const iA=sortDirection[cA]==='asc';gA.sort((a,b)=>{const vA=parseFloat(cA==2?a.percVittoria:a.percPerdita)||0,vB=parseFloat(cA==2?b.percVittoria:b.percPerdita)||0;return iA?vA-vB:vB-vA;});gA.forEach(s=>{const r=document.createElement('tr');r.innerHTML=`<td>${s.giocata}</td><td>${s.frequenza}</td><td><span class="perc"></span></td><td><span class="perc"></span></td>`;const pV=r.querySelector('td:nth-child(3) .perc'),pP=r.querySelector('td:nth-child(4) .perc');coloraPercentuale(s.percVittoria,pV);coloraPercentuale(100-s.percPerdita,pP);t.appendChild(r);});document.querySelectorAll('.sort-arrow').forEach(a=>a.className='sort-arrow');const h=document.querySelector(`#storicoGiocateTable th:nth-child(${parseInt(cA)+1}) .sort-arrow`);if(h)h.className=`sort-arrow ${iA?'asc':'desc'}`;}
function ordinaStorico(colonna) { sortDirection[colonna]=sortDirection[colonna]==='asc'?'desc':'asc'; for(let k in sortDirection)if(k!=colonna)sortDirection[k]='desc'; aggiornaStoricoGiocate(); }

// --- Funzioni Utilità ---
// MODIFICATA: Chiude TUTTI i moduli
function chiudiTuttiModuli() {
    document.querySelectorAll('.modulo').forEach(modulo => {
        modulo.removeAttribute('open');
    });
}

// --- Inizializzazione al Caricamento della Pagina ---
document.addEventListener("DOMContentLoaded", () => {
    popolaDropdownPartite(); // Carica cache e popola dropdown
    const selectPartite = document.getElementById('selezionaPartitaPrecedente');
    if (selectPartite) { selectPartite.addEventListener('change', function() { const i=this.value; if(i!==""&&partitePrecedentiCache[i]) caricaDatiPartita(partitePrecedentiCache[i]); else if(i!==""){console.warn(`Indice ${i} non valido.`);this.selectedIndex=0;} }); }
    const ultimiDatiSalvati = localStorage.getItem('ultimiDati');
    if (ultimiDatiSalvati) { try { const dR=JSON.parse(ultimiDatiSalvati); if(dR&&dR.nomeSquadraA&&dR.nomeSquadraB) caricaDatiPartita(dR); else localStorage.removeItem('ultimiDati'); } catch (e) { console.error("Errore parsing ultimi dati:",e); localStorage.removeItem('ultimiDati'); } }
    aggiornaTabellaPartite();
    aggiornaStoricoGiocate();
});