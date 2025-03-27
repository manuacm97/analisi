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
    document.getElementById('casaSquadraA').textContent = `${nomeSquadraA} (Casa)`;
    document.getElementById('trasfertaSquadraB').textContent = `${nomeSquadraB} (Trasferta)`;
    document.getElementById('nomeStatA').textContent = nomeSquadraA;
    document.getElementById('nomeStatB').textContent = nomeSquadraB;

    // Squadra A
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
    let pesoPosizioneA = (totSquadreA - posizioneA + 1) / totSquadreA;
    let squalificheA = parseInt(formData.get('squalificheA')) || 0;
    let coeffA = parseFloat(formData.get('coeffA')) || 0;
    let punteggioGeneraleA = (mediaGolFattiA * 0.15) - (mediaGolSubitiA * 0.10) + ((vittorieA / 6) * 0.25) + 
                             (pesoPosizioneA * 0.17) - (squalificheA * 0.22) + ((puntiA / 18) * 0.18);
    let punteggioCasaA = (mediaGolFattiCasaA * 0.15) - (mediaGolSubitiCasaA * 0.10) + 
                        ((casaGolFattiA.length ? vittorieCasaA / casaGolFattiA.length : 0) * 0.25) + 
                        (pesoPosizioneA * 0.17) - (squalificheA * 0.22) + ((puntiA / 18) * 0.18) + 0.2;
    let punteggioTotaleA = (punteggioGeneraleA * 0.7) + (punteggioCasaA * 0.3);
    let punteggioCoppeA = punteggioTotaleA + coeffA;

    // Squadra B
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
    let pesoPosizioneB = (totSquadreB - posizioneB + 1) / totSquadreB;
    let squalificheB = parseInt(formData.get('squalificheB')) || 0;
    let coeffB = parseFloat(formData.get('coeffB')) || 0;
    let punteggioGeneraleB = (mediaGolFattiB * 0.15) - (mediaGolSubitiB * 0.10) + ((vittorieB / 6) * 0.25) + 
                             (pesoPosizioneB * 0.17) - (squalificheB * 0.22) + ((puntiB / 18) * 0.18);
    let punteggioTrasfertaB = (mediaGolFattiTrasfertaB * 0.15) - (mediaGolSubitiTrasfertaB * 0.10) + 
                              ((trasfertaGolFattiB.length ? vittorieTrasfertaB / trasfertaGolFattiB.length : 0) * 0.25) + 
                              (pesoPosizioneB * 0.17) - (squalificheB * 0.22) + ((puntiB / 18) * 0.18);
    let punteggioTotaleB = (punteggioGeneraleB * 0.7) + (punteggioTrasfertaB * 0.3);
    let punteggioCoppeB = punteggioTotaleB + coeffB;

    datiAttuali = {
        nomeSquadraA, nomeSquadraB, golFattiA, golSubitiA, casaTrasfertaA, avversariA, esitiA,
        golFattiB, golSubitiB, casaTrasfertaB, avversariB, esitiB, posizioneA, totSquadreA,
        squalificheA, coeffA, posizioneB, totSquadreB, squalificheB, coeffB,
        timestamp: new Date().toLocaleString(),
        risultato: "",
        esito: "",
        gruppo: "",
        schedina: 1
    };

    // Sequenza Recente
    const sequenzaA = document.getElementById('sequenzaA');
    const sequenzaB = document.getElementById('sequenzaB');
    sequenzaA.innerHTML = '';
    sequenzaB.innerHTML = '';
    esitiA.forEach(esito => {
        const span = document.createElement('span');
        span.textContent = esito;
        span.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta');
        sequenzaA.appendChild(span);
    });
    esitiB.forEach(esito => {
        const span = document.createElement('span');
        span.textContent = esito;
        span.className = 'esito ' + (esito === 'V' ? 'vittoria' : esito === 'P' ? 'pareggio' : 'sconfitta');
        sequenzaB.appendChild(span);
    });

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
    document.getElementById('punteggioCasaB').textContent = punteggioTrasfertaB.toFixed(2);
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
    let casaTotaliA = casaGolFattiA.map((gf, i) => gf + casaGolSubitiA[i]);
    let trasfertaTotaliB = trasfertaGolFattiB.map((gf, i) => gf + trasfertaGolSubitiB[i]);

    coloraPercentuale(golFattiA.filter((gf, i) => gf > 0 && golSubitiA[i] > 0).length / 6 * 100, document.getElementById('golA'));
    coloraPercentuale(golFattiA.filter((gf, i) => gf === 0 || golSubitiA[i] === 0).length / 6 * 100, document.getElementById('nogolA'));
    coloraPercentuale(golSubitiA.filter(g => g === 0).length / 6 * 100, document.getElementById('cleanSheetA'));
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
    coloraPercentuale(golSubitiB.filter(g => g === 0).length / 6 * 100, document.getElementById('cleanSheetB'));
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
    coloraPercentuale([...golSubitiA, ...golSubitiB].filter(g => g === 0).length / 12 * 100, document.getElementById('cleanSheetTot'));
    coloraPercentuale(totaliTot.filter(t => t > 2).length / 12 * 100, document.getElementById('over25Tot'));
    coloraPercentuale(totaliTot.filter(t => t <= 2).length / 12 * 100, document.getElementById('under25Tot'));
    coloraPercentuale(totaliTot.filter(t => t > 3).length / 12 * 100, document.getElementById('over35Tot'));
    coloraPercentuale(totaliTot.filter(t => t <= 3).length / 12 * 100, document.getElementById('under35Tot'));
    coloraPercentuale(totaliTot.filter(t => t > 4).length / 12 * 100, document.getElementById('over45Tot'));
    coloraPercentuale(totaliTot.filter(t => t <= 4).length / 12 * 100, document.getElementById('under45Tot'));
    coloraPercentuale(totaliTot.filter(t => t >= 1 && t <= 3).length / 12 * 100, document.getElementById('mg13Tot'));
    coloraPercentuale(totaliTot.filter(t => t >= 2 && t <= 4).length / 12 * 100, document.getElementById('mg24Tot'));
    coloraPercentuale(totaliTot.filter(t => t >= 3 && t <= 5).length / 12 * 100, document.getElementById('mg35Tot'));

    // Tendenza Casa/Trasferta
    coloraPercentuale(casaGolFattiA.filter((gf, i) => gf > 0 && casaGolSubitiA[i] > 0).length / casaGolFattiA.length * 100 || 0, document.getElementById('golCasaA'));
    coloraPercentuale(casaGolFattiA.filter((gf, i) => gf === 0 || casaGolSubitiA[i] === 0).length / casaGolFattiA.length * 100 || 0, document.getElementById('nogolCasaA'));
    coloraPercentuale(casaGolSubitiA.filter(g => g === 0).length / casaGolFattiA.length * 100 || 0, document.getElementById('cleanSheetCasaA'));
    coloraPercentuale(casaTotaliA.filter(t => t > 2).length / casaGolFattiA.length * 100 || 0, document.getElementById('over25CasaA'));
    coloraPercentuale(casaTotaliA.filter(t => t <= 2).length / casaGolFattiA.length * 100 || 0, document.getElementById('under25CasaA'));
    coloraPercentuale(casaTotaliA.filter(t => t > 3).length / casaGolFattiA.length * 100 || 0, document.getElementById('over35CasaA'));
    coloraPercentuale(casaTotaliA.filter(t => t <= 3).length / casaGolFattiA.length * 100 || 0, document.getElementById('under35CasaA'));
    coloraPercentuale(casaTotaliA.filter(t => t > 4).length / casaGolFattiA.length * 100 || 0, document.getElementById('over45CasaA'));
    coloraPercentuale(casaTotaliA.filter(t => t <= 4).length / casaGolFattiA.length * 100 || 0, document.getElementById('under45CasaA'));
    coloraPercentuale(casaTotaliA.filter(t => t >= 1 && t <= 3).length / casaGolFattiA.length * 100 || 0, document.getElementById('mg13CasaA'));
    coloraPercentuale(casaTotaliA.filter(t => t >= 2 && t <= 4).length / casaGolFattiA.length * 100 || 0, document.getElementById('mg24CasaA'));
    coloraPercentuale(casaTotaliA.filter(t => t >= 3 && t <= 5).length / casaGolFattiA.length * 100 || 0, document.getElementById('mg35CasaA'));

    coloraPercentuale(trasfertaGolFattiB.filter((gf, i) => gf > 0 && trasfertaGolSubitiB[i] > 0).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('golTrasfertaB'));
    coloraPercentuale(trasfertaGolFattiB.filter((gf, i) => gf === 0 || trasfertaGolSubitiB[i] === 0).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('nogolTrasfertaB'));
    coloraPercentuale(trasfertaGolSubitiB.filter(g => g === 0).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('cleanSheetTrasfertaB'));
    coloraPercentuale(trasfertaTotaliB.filter(t => t > 2).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('over25TrasfertaB'));
    coloraPercentuale(trasfertaTotaliB.filter(t => t <= 2).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('under25TrasfertaB'));
    coloraPercentuale(trasfertaTotaliB.filter(t => t > 3).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('over35TrasfertaB'));
    coloraPercentuale(trasfertaTotaliB.filter(t => t <= 3).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('under35TrasfertaB'));
    coloraPercentuale(trasfertaTotaliB.filter(t => t > 4).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('over45TrasfertaB'));
    coloraPercentuale(trasfertaTotaliB.filter(t => t <= 4).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('under45TrasfertaB'));
    coloraPercentuale(trasfertaTotaliB.filter(t => t >= 1 && t <= 3).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('mg13TrasfertaB'));
    coloraPercentuale(trasfertaTotaliB.filter(t => t >= 2 && t <= 4).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('mg24TrasfertaB'));
    coloraPercentuale(trasfertaTotaliB.filter(t => t >= 3 && t <= 5).length / trasfertaGolFattiB.length * 100 || 0, document.getElementById('mg35TrasfertaB'));

    // Analisi Dettagliata
    const analisiBody = document.getElementById('analisiDettagliataBody');

    // Confronto Forma
    const confrontoForma = document.getElementById('confrontoForma');
    confrontoForma.innerHTML = '';
    confrontoForma.innerHTML += `<p><strong>Punti nelle ultime 6:</strong> ${nomeSquadraA} (${puntiA}) vs ${nomeSquadraB} (${puntiB}).</p>`;
    const formaDiff = puntiA - puntiB;
    confrontoForma.innerHTML += `<p><strong>Differenza:</strong> ${formaDiff > 0 ? `${nomeSquadraA} +${formaDiff}` : formaDiff < 0 ? `${nomeSquadraB} +${Math.abs(formaDiff)}` : 'Parità'}.</p>`;
    confrontoForma.innerHTML += `<p><strong>Trend:</strong> ${formaDiff > 3 ? `${nomeSquadraA} in forte crescita` : formaDiff < -3 ? `${nomeSquadraB} in forte crescita` : 'Forma simile'}.</p>`;

    // Statistiche Chiave (Complessive)
    const statisticheChiave = document.getElementById('statisticheChiave').querySelector('tbody');
    statisticheChiave.innerHTML = '';
    const statistiche = [
        { nome: 'Media Gol Fatti', valA: mediaGolFattiA, valB: mediaGolFattiB },
        { nome: 'Media Gol Subiti', valA: mediaGolSubitiA, valB: mediaGolSubitiB },
        { nome: 'Vittorie %', valA: vittorieA / 6 * 100, valB: vittorieB / 6 * 100 },
        { nome: 'Clean Sheet %', valA: golSubitiA.filter(g => g === 0).length / 6 * 100, valB: golSubitiB.filter(g => g === 0).length / 6 * 100 },
        { nome: 'Over 2.5 %', valA: totaliA.filter(t => t > 2).length / 6 * 100, valB: totaliB.filter(t => t > 2).length / 6 * 100 }
    ];
    statistiche.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${stat.nome}</td><td>${stat.valA.toFixed(1)}${stat.nome.includes('%') ? '%' : ''}</td><td>${stat.valB.toFixed(1)}${stat.nome.includes('%') ? '%' : ''}</td>`;
        statisticheChiave.appendChild(row);
    });

    // Predizione Esito
    const predizioneEsito = document.getElementById('predizioneEsito');
    predizioneEsito.innerHTML = '';
    // Nuova formula per gol attesi più realistica
    const golAttesiA = (mediaGolFattiA * 0.6 + mediaGolSubitiB * 0.4) * 1.1; // Bonus casa
    const golAttesiB = (mediaGolFattiB * 0.6 + mediaGolSubitiA * 0.4) * 0.9; // Malus trasferta
    predizioneEsito.innerHTML += `<p><strong>Gol Attesi:</strong> ${nomeSquadraA} ${golAttesiA.toFixed(1)} - ${nomeSquadraB} ${golAttesiB.toFixed(1)}</p>`;

    const probVittoriaA = (golAttesiA - golAttesiB > 0.5) ? 60 + (golAttesiA - golAttesiB) * 10 : 40;
    const probPareggio = 30 - Math.abs(golAttesiA - golAttesiB) * 5;
    const probVittoriaB = 100 - probVittoriaA - probPareggio;
    predizioneEsito.innerHTML += `<p><strong>Probabilità:</strong> 1 (<span class="highlight">${probVittoriaA.toFixed(0)}%</span>) - X (${probPareggio.toFixed(0)}%) - 2 (${probVittoriaB.toFixed(0)}%)</p>`;

    const totalGolAttesi = golAttesiA + golAttesiB;
    const over25FreqA = totaliA.filter(t => t > 2).length / 6 * 100;
    const over25FreqB = totaliB.filter(t => t > 2).length / 6 * 100;
    const over25Prob = Math.min(90, Math.max(10, (over25FreqA + over25FreqB) / 2 + (totalGolAttesi > 2.5 ? 10 : -10)));
    const golFreqA = golFattiA.filter((gf, i) => gf > 0 && golSubitiA[i] > 0).length / 6 * 100;
    const golFreqB = golFattiB.filter((gf, i) => gf > 0 && golSubitiB[i] > 0).length / 6 * 100;
    const golProb = Math.min(90, Math.max(10, (golFreqA + golFreqB) / 2 + (golAttesiA > 0.5 && golAttesiB > 0.5 ? 15 : -15)));
    predizioneEsito.innerHTML += `<p><strong>Over 2.5:</strong> <span class="highlight">${over25Prob.toFixed(0)}%</span> - Gol: <span class="highlight">${golProb.toFixed(0)}%</span></p>`;

    const esitoConsigliato = probVittoriaA > 60 ? '1' : probVittoriaB > 60 ? '2' : over25Prob > 65 ? 'Over 2.5' : golProb > 65 ? 'Gol' : 'X';
    predizioneEsito.innerHTML += `<p><strong>Consiglio Scommessa:</strong> <span class="highlight">${esitoConsigliato}</span></p>`;

    localStorage.setItem('ultimiDati', JSON.stringify(datiAttuali));
    togglePunteggioCoppe();
    aggiornaStoricoGiocate();
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
        span.textContent = '';
        span.style.backgroundColor = '';
        span.className = '';
    });
    document.getElementById('sequenzaA').innerHTML = '';
    document.getElementById('sequenzaB').innerHTML = '';
    document.getElementById('confrontoForma').innerHTML = '';
    document.getElementById('statisticheChiave').querySelector('tbody').innerHTML = '';
    document.getElementById('predizioneEsito').innerHTML = '';
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
        opzioni += `${index + 1}. ${partita.nomeSquadraA} vs ${partita.nomeSquadraB} - Giocata: ${partita.giocata} - Schedina: ${partita.schedina}\n`;
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
        aggiornaStoricoGiocate();
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
        aggiornaStoricoGiocate();
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
        if (!gruppi[gruppo]) gruppi[gruppo] = {};
        const schedina = partita.schedina || 1;
        if (!gruppi[gruppo][schedina]) gruppi[gruppo][schedina] = [];
        gruppi[gruppo][schedina].push(partita);
    });

    let totaleVincente = 0;
    let totalePartite = partitePrecedenti.length;

    for (const gruppo in gruppi) {
        const gruppoDiv = document.createElement('div');
        gruppoDiv.className = 'gruppo-partite';
        gruppoDiv.innerHTML = `<h3>${gruppo}</h3>`;
        
        const gruppoVincente = Object.values(gruppi[gruppo]).flat().filter(p => p.esito === 'Vincente').length;
        const gruppoTotale = Object.values(gruppi[gruppo]).flat().length;
        const percGruppo = gruppoTotale ? (gruppoVincente / gruppoTotale * 100).toFixed(1) : 0;
        totaleVincente += gruppoVincente;

        const percSpanGruppo = document.createElement('span');
        percSpanGruppo.className = 'perc-vincente';
        percSpanGruppo.textContent = `Vincente: ${percGruppo}%`;
        gruppoDiv.appendChild(percSpanGruppo);

        for (const schedina in gruppi[gruppo]) {
            const sottogruppoDiv = document.createElement('div');
            sottogruppoDiv.className = 'sottogruppo-partite';
            sottogruppoDiv.innerHTML = `<h4>Schedina ${schedina}</h4>`;

            const sottogruppoVincente = gruppi[gruppo][schedina].filter(p => p.esito === 'Vincente').length;
            const sottogruppoTotale = gruppi[gruppo][schedina].length;
            const percSottogruppo = sottogruppoTotale ? (sottogruppoVincente / sottogruppoTotale * 100).toFixed(1) : 0;

            const percSpanSottogruppo = document.createElement('span');
            percSpanSottogruppo.className = 'perc-vincente';
            percSpanSottogruppo.textContent = `Vincente: ${percSottogruppo}%`;
            sottogruppoDiv.appendChild(percSpanSottogruppo);

            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Squadre</th>
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

            gruppi[gruppo][schedina].sort((a, b) => a.timestamp - b.timestamp);

            gruppi[gruppo][schedina].forEach((partita, indexGlobal) => {
                const index = partitePrecedenti.indexOf(partita);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${partita.nomeSquadraA} vs ${partita.nomeSquadraB}</td>
                    <td><input type="text" class="gioco-input" value="${partita.giocata}" onchange="aggiornaGiocata(${index}, this.value)"></td>
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

            sottogruppoDiv.appendChild(table);
            gruppoDiv.appendChild(sottogruppoDiv);
        }

        container.appendChild(gruppoDiv);
    }

    const percTotale = totalePartite ? (totaleVincente / totalePartite * 100).toFixed(1) : 0;
    const percTotaleDiv = document.createElement('div');
    percTotaleDiv.innerHTML = `<h3>Totale</h3><span class="perc-vincente">Vincente: ${percTotale}%</span>`;
    container.appendChild(percTotaleDiv);

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
        aggiornaStoricoGiocate();
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
    aggiornaStoricoGiocate();
}

function aggiornaSchedina(index, valore) {
    let partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
    partitePrecedenti[index].schedina = parseInt(valore);
    localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedenti));
    aggiornaTabellaPartite();
}

function aggiornaGiocata(index, valore) {
    let partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
    partitePrecedenti[index].giocata = valore;
    localStorage.setItem('partitePrecedenti', JSON.stringify(partitePrecedenti));
    aggiornaStoricoGiocate();
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
                aggiornaStoricoGiocate();
                alert("Lista importata e aggiunta con successo!");
            } catch (err) {
                alert("Errore durante l'importazione: file non valido!");
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function screenshotPartite() {
    const section = document.getElementById('partiteSalvati');
    html2canvas(section).then(canvas => {
        const link = document.createElement('a');
        link.download = 'partite_salvate.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        alert("Errore durante la creazione dello screenshot: " + err.message);
    });
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

    for (let i = 0; i < righe.length; i += 7) {
        if (i + 6 >= righe.length) break;

        const squadra1 = righe[i + 2];
        const squadra2 = righe[i + 3];

        squadre[squadra1] = (squadre[squadra1] || 0) + 1;
        squadre[squadra2] = (squadre[squadra2] || 0) + 1;
    }

    const numeroPartite = Math.floor(righe.length / 7);
    datiSquadra.nomeSquadra = Object.keys(squadre).find(squadra => squadre[squadra] === numeroPartite);
    if (!datiSquadra.nomeSquadra) {
        alert("Non è stata trovata una squadra che si ripete in tutte le partite!");
        return;
    }

    for (let i = 0; i < righe.length; i += 7) {
        if (i + 6 >= righe.length) break;

        const data = righe[i];
        const competizione = righe[i + 1];
        const squadra1 = righe[i + 2];
        const squadra2 = righe[i + 3];
        const golCasa = parseInt(righe[i + 4]) || 0;
        const golTrasferta = parseInt(righe[i + 5]) || 0;
        const esito = righe[i + 6].toUpperCase();

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

function aggiornaStoricoGiocate() {
    const partitePrecedenti = JSON.parse(localStorage.getItem('partitePrecedenti')) || [];
    const tbody = document.getElementById('storicoGiocateBody');
    tbody.innerHTML = '';

    if (partitePrecedenti.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Nessuna giocata salvata.</td></tr>';
        return;
    }

    const giocateStats = {};
    partitePrecedenti.forEach(partita => {
        const giocata = partita.giocata;
        if (!giocateStats[giocata]) {
            giocateStats[giocata] = { count: 0, vincente: 0, perdente: 0 };
        }
        giocateStats[giocata].count++;
        if (partita.esito === 'Vincente') giocateStats[giocata].vincente++;
        if (partita.esito === 'Perdente') giocateStats[giocata].perdente++;
    });

    const giocateArray = Object.entries(giocateStats).map(([giocata, stats]) => ({
        giocata,
        frequenza: stats.count,
        percVittoria: stats.count ? (stats.vincente / stats.count * 100).toFixed(1) : 0,
        percPerdita: stats.count ? (stats.perdente / stats.count * 100).toFixed(1) : 0
    }));

    giocateArray.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stat.giocata}</td>
            <td>${stat.frequenza}</td>
            <td><span class="perc">${stat.percVittoria}%</span></td>
            <td><span class="perc">${stat.percPerdita}%</span></td>
        `;
        const percVittoriaSpan = row.querySelector('td:nth-child(3) .perc');
        const percPerditaSpan = row.querySelector('td:nth-child(4) .perc');
        const rV = Math.round(255 * (1 - stat.percVittoria / 100));
        const gV = Math.round(255 * (stat.percVittoria / 100));
        const rP = Math.round(255 * (1 - stat.percPerdita / 100));
        const gP = Math.round(255 * (stat.percPerdita / 100));
        percVittoriaSpan.style.backgroundColor = `rgb(${rV}, ${gV}, 0)`;
        percPerditaSpan.style.backgroundColor = `rgb(${rP}, ${gP}, 0)`;
        tbody.appendChild(row);
    });
}

let sortDirection = { 2: 'desc', 3: 'desc' };

function ordinaStorico(colonna) {
    const tbody = document.getElementById('storicoGiocateBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    sortDirection[colonna] = sortDirection[colonna] === 'asc' ? 'desc' : 'asc';
    const isAsc = sortDirection[colonna] === 'asc';

    rows.sort((a, b) => {
        const valA = parseFloat(a.cells[colonna].textContent) || 0;
        const valB = parseFloat(b.cells[colonna].textContent) || 0;
        return isAsc ? valA - valB : valB - valA;
    });

    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));

    document.querySelectorAll('.sort-arrow').forEach(arrow => arrow.className = 'sort-arrow');
    const header = document.querySelector(`#storicoGiocateTable th:nth-child(${colonna + 1}) .sort-arrow`);
    header.className = `sort-arrow ${isAsc ? 'asc' : 'desc'}`;
}

function chiudiTuttiModuli() {
    document.querySelectorAll('.modulo').forEach(modulo => {
        modulo.removeAttribute('open');
    });
}

document.addEventListener("DOMContentLoaded", () => {
    aggiornaTabellaPartite();
    aggiornaStoricoGiocate();
});