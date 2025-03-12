let giocataManuale = "";
let datiAttuali = null;

function cercaTransfermarkt() {
    const nomeSquadraA = document.getElementById('nomeSquadraA').value;
    const url = `https://www.google.com/search?q=site:transfermarkt.it+${encodeURIComponent(nomeSquadraA)}`;
    window.open(url, '_blank');
}

function calcolaRisultati() {
    const form = document.getElementById('formAnalisi');
    const formData = new FormData(form);
    const nomeSquadraA = document.getElementById('nomeSquadraA').value;
    const nomeSquadraB = document.getElementById('nomeSquadraB').value;

    document.getElementById('titoloSquadraA').textContent = `${nomeSquadraA} (Casa)`;
    document.getElementById('titoloSquadraB').textContent = `${nomeSquadraB} (Trasferta)`;
    document.getElementById('nomeRisultatiA').textContent = nomeSquadraA;
    document.getElementById('nomeRisultatiB').textContent = nomeSquadraB;
    document.getElementById('colonnaSquadraA').textContent = nomeSquadraA;
    document.getElementById('colonnaSquadraB').textContent = nomeSquadraB;

    // Squadra A
    let golFattiA = [], golSubitiA = [], casaTrasfertaA = [], avversariA = [];
    for (let i = 1; i <= 6; i++) {
        golFattiA.push(parseInt(formData.get(`golFattiA${i}`)) || 0);
        golSubitiA.push(parseInt(formData.get(`golSubitiA${i}`)) || 0);
        casaTrasfertaA.push(formData.get(`casaTrasfertaA${i}`).toUpperCase());
        avversariA.push(formData.get(`avversarioA${i}`) || '');
        const esito = golFattiA[i-1] > golSubitiA[i-1] ? 'V' : (golFattiA[i-1] < golSubitiA[i-1] ? 'S' : 'P');
        const esitoCell = document.querySelectorAll('#squadraA .esito')[i-1];
        esitoCell.textContent = esito;
        esitoCell.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta');
    }
    let mediaGolFattiA = golFattiA.reduce((a, b) => a + b, 0) / 6;
    let mediaGolSubitiA = golSubitiA.reduce((a, b) => a + b, 0) / 6;
    let vittorieA = golFattiA.filter((gf, i) => gf > golSubitiA[i]).length;
    let pareggiA = golFattiA.filter((gf, i) => gf === golSubitiA[i]).length;
    let sconfitteA = golFattiA.filter((gf, i) => gf < golSubitiA[i]).length;
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
    let sconfitteCasaA = casaGolFattiA.filter((gf, i) => gf < casaGolSubitiA[i]).length;
    let vittorieTrasfertaA = trasfertaGolFattiA.filter((gf, i) => gf > trasfertaGolSubitiA[i]).length;
    let pareggiTrasfertaA = trasfertaGolFattiA.filter((gf, i) => gf === trasfertaGolSubitiA[i]).length;
    let sconfitteTrasfertaA = trasfertaGolFattiA.filter((gf, i) => gf < trasfertaGolSubitiA[i]).length;

    let posizioneA = parseInt(formData.get('posizioneA')) || 1;
    let totSquadreA = parseInt(formData.get('totSquadreA')) || 1;
    let pesoPosizioneA = (totSquadreA - posizioneA) / 2;
    let squalificheA = parseInt(formData.get('squalificheA')) || 0;
    let coeffA = parseFloat(formData.get('coeffA')) || 1.0;
    let punteggioGeneraleA = (mediaGolFattiA * 0.15) - (mediaGolSubitiA * 0.10) + ((vittorieA / 6) * 0.25) + 
                             (pesoPosizioneA * 0.17) - (squalificheA * 0.22) + ((puntiA / 18) * 0.18);
    let punteggioCasaA = (mediaGolFattiCasaA * 0.15) - (mediaGolSubitiCasaA * 0.10) + ((vittorieCasaA / casaGolFattiA.length) * 0.25) + 
                        (pesoPosizioneA * 0.17) - (squalificheA * 0.22) + ((puntiA / 18) * 0.18) + 0.2;
    let punteggioTotaleA = (punteggioGeneraleA * 0.7) + (punteggioCasaA * 0.3);
    let punteggioCoppeA = punteggioTotaleA + coeffA;

    // Squadra B
    let golFattiB = [], golSubitiB = [], casaTrasfertaB = [], avversariB = [];
    for (let i = 1; i <= 6; i++) {
        golFattiB.push(parseInt(formData.get(`golFattiB${i}`)) || 0);
        golSubitiB.push(parseInt(formData.get(`golSubitiB${i}`)) || 0);
        casaTrasfertaB.push(formData.get(`casaTrasfertaB${i}`).toUpperCase());
        avversariB.push(formData.get(`avversarioB${i}`) || '');
        const esito = golFattiB[i-1] > golSubitiB[i-1] ? 'V' : (golFattiB[i-1] < golSubitiB[i-1] ? 'S' : 'P');
        const esitoCell = document.querySelectorAll('#squadraB .esito')[i-1];
        esitoCell.textContent = esito;
        esitoCell.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta');
    }
    let mediaGolFattiB = golFattiB.reduce((a, b) => a + b, 0) / 6;
    let mediaGolSubitiB = golSubitiB.reduce((a, b) => a + b, 0) / 6;
    let vittorieB = golFattiB.filter((gf, i) => gf > golSubitiB[i]).length;
    let pareggiB = golFattiB.filter((gf, i) => gf === golSubitiB[i]).length;
    let sconfitteB = golFattiB.filter((gf, i) => gf < golSubitiB[i]).length;
    let puntiB = (vittorieB * 3) + pareggiB;

    let casaGolFattiB = golFattiB.filter((_, i) => casaTrasfertaB[i] === 'C');
    let casaGolSubitiB = golSubitiB.filter((_, i) => casaTrasfertaB[i] === 'C');
    let trasfertaGolFattiB = golFattiB.filter((_, i) => casaTrasfertaB[i] === 'T');
    let trasfertaGolSubitiB = golSubitiB.filter((_, i) => casaTrasfertaB[i] === 'T');
    let mediaGolFattiCasaB = casaGolFattiB.length ? casaGolFattiB.reduce((a, b) => a + b, 0) / casaGolFattiB.length : 0;
    let mediaGolSubitiCasaB = casaGolSubitiB.length ? casaGolSubitiB.reduce((a, b) => a + b, 0) / casaGolSubitiB.length : 0;
    let mediaGolFattiTrasfertaB = trasfertaGolFattiB.length ? trasfertaGolFattiB.reduce((a, b) => a + b, 0) / trasfertaGolFattiB.length : 0;
    let mediaGolSubitiTrasfertaB = trasfertaGolSubitiB.length ? trasfertaGolSubitiB.reduce((a, b) => a + b, 0) / trasfertaGolSubitiB.length : 0;
    let vittorieCasaB = casaGolFattiB.filter((gf, i) => gf > casaGolSubitiB[i]).length;
    let pareggiCasaB = casaGolFattiB.filter((gf, i) => gf === casaGolSubitiB[i]).length;
    let sconfitteCasaB = casaGolFattiB.filter((gf, i) => gf < casaGolSubitiB[i]).length;
    let vittorieTrasfertaB = trasfertaGolFattiB.filter((gf, i) => gf > trasfertaGolSubitiB[i]).length;
    let pareggiTrasfertaB = trasfertaGolFattiB.filter((gf, i) => gf === trasfertaGolSubitiB[i]).length;
    let sconfitteTrasfertaB = trasfertaGolFattiB.filter((gf, i) => gf < trasfertaGolSubitiB[i]).length;

    let posizioneB = parseInt(formData.get('posizioneB')) || 1;
    let totSquadreB = parseInt(formData.get('totSquadreB')) || 1;
    let pesoPosizioneB = (totSquadreB - posizioneB) / 2;
    let squalificheB = parseInt(formData.get('squalificheB')) || 0;
    let coeffB = parseFloat(formData.get('coeffB')) || 1.0;
    let punteggioGeneraleB = (mediaGolFattiB * 0.15) - (mediaGolSubitiB * 0.10) + ((vittorieB / 6) * 0.25) + 
                             (pesoPosizioneB * 0.17) - (squalificheB * 0.22) + ((puntiB / 18) * 0.18);
    let punteggioCasaB = (mediaGolFattiTrasfertaB * 0.15) - (mediaGolSubitiTrasfertaB * 0.10) + ((vittorieTrasfertaB / trasfertaGolFattiB.length) * 0.25) + 
                         (pesoPosizioneB * 0.17) - (squalificheB * 0.22) + ((puntiB / 18) * 0.18);
    let punteggioTotaleB = (punteggioGeneraleB * 0.7) + (punteggioCasaB * 0.3);
    let punteggioCoppeB = punteggioTotaleB + coeffB;

    datiAttuali = {
        nomeSquadraA, nomeSquadraB, golFattiA, golSubitiA, casaTrasfertaA, avversariA,
        golFattiB, golSubitiB, casaTrasfertaB, avversariB, posizioneA, totSquadreA,
        squalificheA, coeffA, posizioneB, totSquadreB, squalificheB, coeffB,
        timestamp: new Date().toLocaleString(),
        risultato: "",
        esito: "",
        gruppo: "",
        schedina: 1
    };

    function coloraPercentuale(perc, elemento) {
        const r = Math.round(255 * (1 - perc / 100));
        const g = Math.round(255 * (perc / 100));
        elemento.style.backgroundColor = `rgb(${r}, ${g}, 0)`;
        elemento.textContent = perc.toFixed(1) + '%';
        elemento.className = 'perc';
    }

    // Risultati Squadra A
    document.getElementById('golFattiA').textContent = mediaGolFattiA.toFixed(2);
    document.getElementById('golSubitiA').textContent = mediaGolSubitiA.toFixed(2);
    coloraPercentuale(vittorieA / 6 * 100, document.getElementById('vittorieA'));
    coloraPercentuale(pareggiA / 6 * 100, document.getElementById('pareggiA'));
    coloraPercentuale(sconfitteA / 6 * 100, document.getElementById('sconfitteA'));
    document.getElementById('golFattiCasaA').textContent = mediaGolFattiCasaA.toFixed(2);
    document.getElementById('golSubitiCasaA').textContent = mediaGolSubitiCasaA.toFixed(2);
    coloraPercentuale(vittorieCasaA / casaGolFattiA.length * 100 || 0, document.getElementById('vittorieCasaA'));
    coloraPercentuale(pareggiCasaA / casaGolFattiA.length * 100 || 0, document.getElementById('pareggiCasaA'));
    coloraPercentuale(sconfitteCasaA / casaGolFattiA.length * 100 || 0, document.getElementById('sconfitteCasaA'));
    document.getElementById('golFattiTrasfertaA').textContent = mediaGolFattiTrasfertaA.toFixed(2);
    document.getElementById('golSubitiTrasfertaA').textContent = mediaGolSubitiTrasfertaA.toFixed(2);
    coloraPercentuale(vittorieTrasfertaA / trasfertaGolFattiA.length * 100 || 0, document.getElementById('vittorieTrasfertaA'));
    coloraPercentuale(pareggiTrasfertaA / trasfertaGolFattiA.length * 100 || 0, document.getElementById('pareggiTrasfertaA'));
    coloraPercentuale(sconfitteTrasfertaA / trasfertaGolFattiA.length * 100 || 0, document.getElementById('sconfitteTrasfertaA'));
    document.getElementById('pesoPosizioneA').textContent = pesoPosizioneA.toFixed(2);
    document.getElementById('formaA').textContent = puntiA;
    document.getElementById('punteggioA').textContent = punteggioGeneraleA.toFixed(2);
    document.getElementById('punteggioCasaA').textContent = punteggioCasaA.toFixed(2);
    document.getElementById('punteggioTotaleA').textContent = punteggioTotaleA.toFixed(2);
    document.getElementById('punteggioCoppeA').textContent = punteggioCoppeA.toFixed(2);
    document.getElementById('punteggioA').className = 'punteggio';
    document.getElementById('punteggioCasaA').className = 'punteggio';
    document.getElementById('punteggioTotaleA').className = 'punteggio';
    document.getElementById('punteggioCoppeA').className = 'punteggio';

    // Risultati Squadra B
    document.getElementById('golFattiB').textContent = mediaGolFattiB.toFixed(2);
    document.getElementById('golSubitiB').textContent = mediaGolSubitiB.toFixed(2);
    coloraPercentuale(vittorieB / 6 * 100, document.getElementById('vittorieB'));
    coloraPercentuale(pareggiB / 6 * 100, document.getElementById('pareggiB'));
    coloraPercentuale(sconfitteB / 6 * 100, document.getElementById('sconfitteB'));
    document.getElementById('golFattiCasaB').textContent = mediaGolFattiCasaB.toFixed(2);
    document.getElementById('golSubitiCasaB').textContent = mediaGolSubitiCasaB.toFixed(2);
    coloraPercentuale(vittorieCasaB / casaGolFattiB.length * 100 || 0, document.getElementById('vittorieCasaB'));
    coloraPercentuale(pareggiCasaB / casaGolFattiB.length * 100 || 0, document.getElementById('pareggiCasaB'));
    coloraPercentuale(sconfitteCasaB / casaGolFattiB.length * 100 || 0, document.getElementById('sconfitteCasaB'));
    document.getElementById('golFattiTrasfertaB').textContent = mediaGolFattiTrasfertaB.toFixed(2);
    document.getElementById('golSubitiTrasfertaB').textContent = mediaGolSubitiTrasfertaB.toFixed(2);
    coloraPercentuale(vittorieTrasfertaB / trasfertaGolFattiB.length * 100 || 0, document.getElementById('vittorieTrasfertaB'));
    coloraPercentuale(pareggiTrasfertaB / trasfertaGolFattiB.length * 100 || 0, document.getElementById('pareggiTrasfertaB'));
    coloraPercentuale(sconfitteTrasfertaB / trasfertaGolFattiB.length * 100 || 0, document.getElementById('sconfitteTrasfertaB'));
    document.getElementById('pesoPosizioneB').textContent = pesoPosizioneB.toFixed(2);
    document.getElementById('formaB').textContent = puntiB;
    document.getElementById('punteggioB').textContent = punteggioGeneraleB.toFixed(2);
    document.getElementById('punteggioCasaB').textContent = punteggioCasaB.toFixed(2);
    document.getElementById('punteggioTotaleB').textContent = punteggioTotaleB.toFixed(2);
    document.getElementById('punteggioCoppeB').textContent = punteggioCoppeB.toFixed(2);
    document.getElementById('punteggioB').className = 'punteggio';
    document.getElementById('punteggioCasaB').className = 'punteggio';
    document.getElementById('punteggioTotaleB').className = 'punteggio';
    document.getElementById('punteggioCoppeB').className = 'punteggio';

    // Percentuali Esiti
    let totaliA = golFattiA.map((gf, i) => gf + golSubitiA[i]);
    let totaliB = golFattiB.map((gf, i) => gf + golSubitiB[i]);
    let totaliTot = [...totaliA, ...totaliB];

    coloraPercentuale(golFattiA.filter((gf, i) => gf > 0 && golSubitiA[i] > 0).length / 6 * 100, document.getElementById('golA'));
    coloraPercentuale(golFattiA.filter((gf, i) => gf === 0 || golSubitiA[i] === 0).length / 6 * 100, document.getElementById('nogolA'));
    coloraPercentuale(totaliA.filter(t => t > 2).length / 6 * 100, document.getElementById('over25A'));
    coloraPercentuale(totaliA.filter(t => t <= 2).length / 6 * 100, document.getElementById('under25A'));
    coloraPercentuale(totaliA.filter(t => t > 3).length / 6 * 100, document.getElementById('over35A'));
    coloraPercentuale(totaliA.filter(t => t <= 3).length / 6 * 100, document.getElementById('under35A'));
    coloraPercentuale(totaliA.filter(t => t > 4).length / 6 * 100, document.getElementById('over45A'));
    coloraPercentuale(totaliA.filter(t => t <= 4).length / 6 * 100, document.getElementById('under45A'));
    coloraPercentuale(totaliA.filter(t => t >= 1 && t <= 3).length / 6 * 100, document.getElementById('mg13A'));
    coloraPercentuale(totaliA.filter(t => t >= 2 && t <= 4).length / 6 * 100, document.getElementById('mg24A'));
    coloraPercentuale(totaliA.filter(t => t >= 3 && t <= 5).length / 6 * 100, document.getElementById('mg35A'));

    coloraPercentuale(golFattiB.filter((gf, i) => gf > 0 && golSubitiB[i] > 0).length / 6 * 100, document.getElementById('golB'));
    coloraPercentuale(golFattiB.filter((gf, i) => gf === 0 || golSubitiB[i] === 0).length / 6 * 100, document.getElementById('nogolB'));
    coloraPercentuale(totaliB.filter(t => t > 2).length / 6 * 100, document.getElementById('over25B'));
    coloraPercentuale(totaliB.filter(t => t <= 2).length / 6 * 100, document.getElementById('under25B'));
    coloraPercentuale(totaliB.filter(t => t > 3).length / 6 * 100, document.getElementById('over35B'));
    coloraPercentuale(totaliB.filter(t => t <= 3).length / 6 * 100, document.getElementById('under35B'));
    coloraPercentuale(totaliB.filter(t => t > 4).length / 6 * 100, document.getElementById('over45B'));
    coloraPercentuale(totaliB.filter(t => t <= 4).length / 6 * 100, document.getElementById('under45B'));
    coloraPercentuale(totaliB.filter(t => t >= 1 && t <= 3).length / 6 * 100, document.getElementById('mg13B'));
    coloraPercentuale(totaliB.filter(t => t >= 2 && t <= 4).length / 6 * 100, document.getElementById('mg24B'));
    coloraPercentuale(totaliB.filter(t => t >= 3 && t <= 5).length / 6 * 100, document.getElementById('mg35B'));

    coloraPercentuale(totaliTot.filter((gf, i) => (i < 6 ? golFattiA[i] : golFattiB[i-6]) > 0 && (i < 6 ? golSubitiA[i] : golSubitiB[i-6]) > 0).length / 12 * 100, document.getElementById('golTot'));
    coloraPercentuale(totaliTot.filter((gf, i) => (i < 6 ? golFattiA[i] : golFattiB[i-6]) === 0 || (i < 6 ? golSubitiA[i] : golSubitiB[i-6]) === 0).length / 12 * 100, document.getElementById('nogolTot'));
    coloraPercentuale(totaliTot.filter(t => t > 2).length / 12 * 100, document.getElementById('over25Tot'));
    coloraPercentuale(totaliTot.filter(t => t <= 2).length / 12 * 100, document.getElementById('under25Tot'));
    coloraPercentuale(totaliTot.filter(t => t > 3).length / 12 * 100, document.getElementById('over35Tot'));
    coloraPercentuale(totaliTot.filter(t => t <= 3).length / 12 * 100, document.getElementById('under35Tot'));
    coloraPercentuale(totaliTot.filter(t => t > 4).length / 12 * 100, document.getElementById('over45Tot'));
    coloraPercentuale(totaliTot.filter(t => t <= 4).length / 12 * 100, document.getElementById('under45Tot'));
    coloraPercentuale(totaliTot.filter(t => t >= 1 && t <= 3).length / 12 * 100, document.getElementById('mg13Tot'));
    coloraPercentuale(totaliTot.filter(t => t >= 2 && t <= 4).length / 12 * 100, document.getElementById('mg24Tot'));
    coloraPercentuale(totaliTot.filter(t => t >= 3 && t <= 5).length / 12 * 100, document.getElementById('mg35Tot'));

    localStorage.setItem('ultimiDati', JSON.stringify(datiAttuali));
}

function cancellaDati() {
    document.getElementById('formAnalisi').reset();
    document.querySelectorAll('.esito').forEach(span => span.textContent = '');
    document.querySelectorAll('#risultati span').forEach(span => {
        span.textContent = '';
        span.style.backgroundColor = '';
        span.className = '';
    });
    giocataManuale = "";
    datiAttuali = null;
}

function mostraPartitePrecedenti() {
    const partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
    if (partitePrecedenti.length === 0) {
        alert("Nessuna partita precedente salvata!");
        return;
    }

    let opzioni = "Seleziona una partita precedente:\n";
    partitePrecedenti.forEach((partita, index) => {
        opzioni += `${index + 1}. ${partita.nomeSquadraA} vs ${partita.nomeSquadraB} (${partita.timestamp}) - Giocata: ${partita.giocata} - Schedina: ${partita.schedina}\n`;
    });
    const scelta = prompt(opzioni + "\nInserisci il numero della partita:");
    const indexScelto = parseInt(scelta) - 1;

    if (isNaN(indexScelto) || indexScelto < 0 || indexScelto >= partitePrecedenti.length) {
        alert("Scelta non valida!");
        return;
    }

    const datiSalvati = partitePrecedenti[indexScelto];
    document.getElementById('nomeSquadraA').value = datiSalvati.nomeSquadraA;
    document.getElementById('nomeSquadraB').value = datiSalvati.nomeSquadraB;
    for (let i = 1; i <= 6; i++) {
        document.getElementsByName(`golFattiA${i}`)[0].value = datiSalvati.golFattiA[i-1];
        document.getElementsByName(`golSubitiA${i}`)[0].value = datiSalvati.golSubitiA[i-1];
        document.getElementsByName(`casaTrasfertaA${i}`)[0].value = datiSalvati.casaTrasfertaA[i-1];
        document.getElementsByName(`avversarioA${i}`)[0].value = datiSalvati.avversariA[i-1];
        document.getElementsByName(`golFattiB${i}`)[0].value = datiSalvati.golFattiB[i-1];
        document.getElementsByName(`golSubitiB${i}`)[0].value = datiSalvati.golSubitiB[i-1];
        document.getElementsByName(`casaTrasfertaB${i}`)[0].value = datiSalvati.casaTrasfertaB[i-1];
        document.getElementsByName(`avversarioB${i}`)[0].value = datiSalvati.avversariB[i-1];
    }
    document.getElementsByName('posizioneA')[0].value = datiSalvati.posizioneA;
    document.getElementsByName('totSquadreA')[0].value = datiSalvati.totSquadreA;
    document.getElementsByName('squalificheA')[0].value = datiSalvati.squalificheA;
    document.getElementsByName('coeffA')[0].value = datiSalvati.coeffA;
    document.getElementsByName('posizioneB')[0].value = datiSalvati.posizioneB;
    document.getElementsByName('totSquadreB')[0].value = datiSalvati.totSquadreB;
    document.getElementsByName('squalificheB')[0].value = datiSalvati.squalificheB;
    document.getElementsByName('coeffB')[0].value = datiSalvati.coeffB;

    giocataManuale = datiSalvati.giocata;
    datiAttuali = datiSalvati;
    calcolaRisultati();
}

function eliminaPartiteSalvati() {
    if (confirm("Sei sicuro di voler eliminare tutte le partite salvate?")) {
        localStorage.removeItem('partitePrecedenti');
        localStorage.removeItem('ultimiDati');
        datiAttuali = null;
        giocataManuale = "";
        aggiornaTabellaPartite();
        alert("Partite salvate eliminate!");
    }
}

function salvaPartita() {
    if (!datiAttuali) {
        alert("Calcola i risultati prima di salvare la partita!");
        return;
    }
    const giocata = prompt("Inserisci la tua giocata (es. Over 2.5, 1X, Gol):");
    const gruppo = prompt("Inserisci il nome del gruppo (opzionale):");
    if (giocata) {
        giocataManuale = giocata;
        datiAttuali.giocata = giocataManuale;
        datiAttuali.gruppo = gruppo || "Senza Gruppo";
        let partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
        partitePrecedenti.push(datiAttuali);
        localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedenti));
        alert(`Partita salvata: ${giocataManuale} nel gruppo ${datiAttuali.gruppo}`);
        aggiornaTabellaPartite();
    } else {
        alert("Nessuna giocata inserita!");
    }
}

function aggiornaTabellaPartite() {
    const partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
    const container = document.getElementById('partiteSalvatiBody');
    container.innerHTML = '';

    if (partitePrecedenti.length === 0) {
        container.innerHTML = '<p>Nessuna partita salvata.</p>';
        return;
    }

    const gruppi = {};
    partitePrecedenti.forEach(partita => {
        const gruppo = partita.gruppo || "Senza Gruppo";
        if (!gruppi[gruppo]) gruppi[gruppo] = [];
        gruppi[gruppo].push(partita);
    });

    for (const gruppo in gruppi) {
        const gruppoDiv = document.createElement('div');
        gruppoDiv.className = 'gruppo-partite';
        gruppoDiv.innerHTML = `<h3>${gruppo}</h3>`;
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Squadre</th>
                    <th>Data</th>
                    <th>Giocata</th>
                    <th>Risultato</th>
                    <th>Esito</th>
                    <th>Schedina</th>
                    <th>Azione</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        gruppi[gruppo].sort((a, b) => a.schedina - b.schedina);

        gruppi[gruppo].forEach((partita, indexGlobal) => {
            const index = partitePrecedenti.indexOf(partita);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${partita.nomeSquadraA} vs ${partita.nomeSquadraB}</td>
                <td>${partita.timestamp}</td>
                <td>${partita.giocata}</td>
                <td><input type="text" value="${partita.risultato || ''}" onchange="aggiornaRisultato(${index}, this.value)"></td>
                <td>
                    <select class="esito-select" onchange="aggiornaEsito(${index}, this.value)">
                        <option value="" ${!partita.esito ? 'selected' : ''}>Seleziona</option>
                        <option value="Vincente" ${partita.esito === 'Vincente' ? 'selected' : ''}>Vincente</option>
                        <option value="Perdente" ${partita.esito === 'Perdente' ? 'selected' : ''}>Perdente</option>
                    </select>
                </td>
                <td>
                    <select class="schedina-select" onchange="aggiornaSchedina(${index}, this.value)">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => 
                            `<option value="${num}" ${partita.schedina === num ? 'selected' : ''}>${num}</option>`
                        ).join('')}
                    </select>
                </td>
                <td><button class="elimina-btn" onclick="eliminaPartita(${index})">Elimina</button></td>
            `;
            tbody.appendChild(row);
        });

        gruppoDiv.appendChild(table);
        container.appendChild(gruppoDiv);
    }

    document.querySelectorAll('.esito-select').forEach(select => {
        if (select.value === 'Vincente') select.classList.add('vincente');
        else if (select.value === 'Perdente') select.classList.add('perdente');
        else select.classList.remove('vincente', 'perdente');
    });
}

function eliminaPartita(index) {
    if (confirm("Sei sicuro di voler eliminare questa partita?")) {
        let partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
        partitePrecedenti.splice(index, 1);
        localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedenti));
        aggiornaTabellaPartite();
    }
}

function aggiornaRisultato(index, valore) {
    let partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
    partitePrecedenti[index].risultato = valore;
    localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedenti));
}

function aggiornaEsito(index, valore) {
    let partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
    partitePrecedenti[index].esito = valore;
    localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedenti));
    aggiornaTabellaPartite();
}

function aggiornaSchedina(index, valore) {
    let partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
    partitePrecedenti[index].schedina = parseInt(valore);
    localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedenti));
    aggiornaTabellaPartite();
}

function esportaPartite() {
    const partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
    if (partitePrecedenti.length === 0) {
        alert("Nessuna partita da esportare!");
        return;
    }
    const nomeFile = prompt("Inserisci il nome del file (senza estensione):", "partite_salvate");
    if (!nomeFile) return;

    const dataStr = JSON.stringify(partitePrecedenti, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
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
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                let partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
                partitePrecedenti = partitePrecedenti.concat(importedData);
                localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedenti));
                aggiornaTabellaPartite();
                alert("Lista importata e aggiunta con successo!");
            } catch (err) {
                alert("Errore durante l'importazione: file non valido!");
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function generaFile(squadra) {
    const form = document.getElementById('formAnalisi');
    const formData = new FormData(form);
    const nomeSquadra = squadra === 'A' ? document.getElementById('nomeSquadraA').value : document.getElementById('nomeSquadraB').value;
    if (!nomeSquadra) {
        alert("Inserisci il nome della squadra prima di generare il file!");
        return;
    }

    let datiSquadra = {
        nomeSquadra,
        partite: []
    };

    for (let i = 1; i <= 6; i++) {
        const avversario = formData.get(`avversario${squadra}${i}`) || '';
        const golFatti = parseInt(formData.get(`golFatti${squadra}${i}`)) || 0;
        const golSubiti = parseInt(formData.get(`golSubiti${squadra}${i}`)) || 0;
        const casaTrasferta = formData.get(`casaTrasferta${squadra}${i}`).toUpperCase();
        const esito = golFatti > golSubiti ? 'V' : (golFatti < golSubiti ? 'S' : 'P');
        if (avversario) {
            datiSquadra.partite.push({
                avversario,
                golCasa: casaTrasferta === 'C' ? golFatti : golSubiti,
                golTrasferta: casaTrasferta === 'C' ? golSubiti : golFatti,
                esito,
                casaTrasferta
            });
        }
    }

    const dataStr = JSON.stringify(datiSquadra, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
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
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const datiImportati = JSON.parse(e.target.result);
                const nomeCampo = squadra === 'A' ? 'nomeSquadraA' : 'nomeSquadraB';
                document.getElementById(nomeCampo).value = datiImportati.nomeSquadra;
                for (let i = 0; i < Math.min(6, datiImportati.partite.length); i++) {
                    const partita = datiImportati.partite[i];
                    document.getElementsByName(`avversario${squadra}${i+1}`)[0].value = partita.avversario;
                    document.getElementsByName(`golFatti${squadra}${i+1}`)[0].value = partita.casaTrasferta === 'C' ? partita.golCasa : partita.golTrasferta;
                    document.getElementsByName(`golSubiti${squadra}${i+1}`)[0].value = partita.casaTrasferta === 'C' ? partita.golTrasferta : partita.golCasa;
                    document.getElementsByName(`casaTrasferta${squadra}${i+1}`)[0].value = partita.casaTrasferta;
                }
                alert(`Dati della squadra ${datiImportati.nomeSquadra} importati con successo!`);
            } catch (err) {
                alert("Errore durante l'importazione: file non valido!");
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function generaFileDaTesto() {
    const testoInput = document.getElementById('textInput').value.trim();
    if (!testoInput) {
        alert("Inserisci il testo con i dati della squadra prima di generare il file!");
        return;
    }

    const righe = testoInput.split('\n').filter(riga => riga.trim() !== '');
    if (righe.length < 5) {
        alert("Il testo inserito non è sufficiente per generare un file!");
        return;
    }

    let datiSquadra = {
        nomeSquadra: "",
        partite: []
    };
    const squadre = {};

    // Prima scansione per determinare la squadra principale
    for (let i = 0; i < righe.length; i += 7) {
        if (i + 6 >= righe.length) break;

        const squadra1 = righe[i + 2]; // es. "Empoli"
        const squadra2 = righe[i + 3]; // es. "Roma"

        squadre[squadra1] = (squadre[squadra1] || 0) + 1;
        squadre[squadra2] = (squadre[squadra2] || 0) + 1;
    }

    // Trova la squadra che si ripete in tutte le partite
    const numeroPartite = Math.floor(righe.length / 7);
    datiSquadra.nomeSquadra = Object.keys(squadre).find(squadra => squadre[squadra] === numeroPartite);
    if (!datiSquadra.nomeSquadra) {
        alert("Non è stata trovata una squadra che si ripete in tutte le partite!");
        return;
    }

    // Seconda scansione per popolare le partite
    for (let i = 0; i < righe.length; i += 7) {
        if (i + 6 >= righe.length) break;

        const data = righe[i]; // es. "09.03.25"
        const competizione = righe[i + 1]; // es. "SA"
        const squadra1 = righe[i + 2]; // es. "Empoli"
        const squadra2 = righe[i + 3]; // es. "Roma"
        const golCasa = parseInt(righe[i + 4]) || 0; // es. "0"
        const golTrasferta = parseInt(righe[i + 5]) || 0; // es. "1"
        const esito = righe[i + 6].toUpperCase(); // es. "V"

        const casaTrasferta = datiSquadra.nomeSquadra === squadra1 ? 'C' : 'T';
        const avversario = casaTrasferta === 'C' ? squadra2 : squadra1;
        const avversarioSemplificato = avversario.replace(/^(Ath\.|FC)\s+/, '');

        datiSquadra.partite.push({
            avversario: avversarioSemplificato,
            golCasa,
            golTrasferta,
            esito,
            casaTrasferta
        });
    }

    const dataStr = JSON.stringify(datiSquadra, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${datiSquadra.nomeSquadra}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Aggiungi il tasto "Pulisci" dopo aver generato il file
    const generatoreForm = document.querySelector('.generatore-form');
    if (!document.getElementById('pulisciBtn')) {
        const pulisciBtn = document.createElement('button');
        pulisciBtn.id = 'pulisciBtn';
        pulisciBtn.textContent = 'Pulisci';
        pulisciBtn.type = 'button';
        pulisciBtn.onclick = pulisciGeneratore;
        generatoreForm.appendChild(pulisciBtn);
    }
}

function pulisciGeneratore() {
    document.getElementById('textInput').value = '';
}

// Inizializza la tabella delle partite salvate al caricamento della pagina
document.addEventListener("DOMContentLoaded", () => {
    aggiornaTabellaPartite();
});