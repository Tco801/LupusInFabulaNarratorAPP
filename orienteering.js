à// Variabili globali per la modalità orienteering
let gameState = {
    players: [],
    roles: [],
    currentNight: 0,
    currentRoleIndex: 0,
    nightRoles: [],
    gamePhase: 'setup', // setup, firstNight, night, day, ended
    witchUsedHeal: false,
    witchUsedKill: false,
    mitomaneNewRole: null,
    targetToKill: null,
    protectedPlayer: null
};

// Definizione ruoli orienteering (mappatura dai ruoli classici, senza criceto)
const orienteeringRoles = {
    'La Lanterna': { name: 'La Lanterna', team: 'village', nightAction: false, classicRole: 'Contadino' },
    'Ladro di Lanterne': { name: 'Ladro di Lanterne', team: 'wolves', nightAction: true, classicRole: 'Lupo' },
    'Gesù Cristo': { name: 'Gesù Cristo', team: 'village', nightAction: true, classicRole: 'Veggente' },
    'Lo Zio Tony': { name: 'Lo Zio Tony', team: 'village', nightAction: true, classicRole: 'Guardia' },
    'Il Galletti': { name: 'Il Galletti', team: 'village', nightAction: true, classicRole: 'Mitomane' },
    'Il Biella': { name: 'Il Biella', team: 'fool', nightAction: false, classicRole: 'Matto' },
    'Noemi': { name: 'Noemi', team: 'village', nightAction: true, classicRole: 'Strega' }
};

function setupGame() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    if (playerCount < 4) {
        alert('Servono almeno 4 partecipanti per la gara!');
        return;
    }

    const roleSetup = document.getElementById('role-setup');
    const roleSelection = document.getElementById('role-selection');
    
    roleSelection.innerHTML = '';
    
    // Ruoli base per 4 giocatori
    let baseRoles = ['Ladro di Lanterne', 'Lo Zio Tony', 'Gesù Cristo'];
    let remainingSlots = playerCount - 3;
    
    // Aggiungi lanterne per il resto
    for (let i = 0; i < remainingSlots; i++) {
        baseRoles.push('La Lanterna');
    }
    
    // Crea interfaccia per personalizzare ruoli
    roleSelection.innerHTML = `
        <p>Società base assegnate: ${baseRoles.join(', ')}</p>
        <h4>Personalizza le società (opzionale):</h4>
    `;
    
    Object.keys(orienteeringRoles).forEach(role => {
        const count = baseRoles.filter(r => r === role).length;
        roleSelection.innerHTML += `
            <div style="margin: 10px 0;">
                <label>${role}: </label>
                <input type="number" id="role-${role}" min="0" max="${playerCount}" value="${count}">
            </div>
        `;
    });
    
    roleSetup.classList.remove('hidden');
}

function startGame() {
    // Raccogli i ruoli selezionati
    const selectedRoles = [];
    Object.keys(orienteeringRoles).forEach(role => {
        const count = parseInt(document.getElementById(`role-${role}`).value) || 0;
        for (let i = 0; i < count; i++) {
            selectedRoles.push(role);
        }
    });
    
    const playerCount = parseInt(document.getElementById('player-count').value);
    if (selectedRoles.length !== playerCount) {
        alert(`Il numero di società (${selectedRoles.length}) non corrisponde al numero di partecipanti (${playerCount})!`);
        return;
    }
    
    // Inizializza il gioco
    gameState.roles = selectedRoles;
    gameState.players = selectedRoles.map((role, index) => ({
        id: index,
        name: '',
        role: role,
        originalRole: role,
        alive: true,
        protected: false
    }));
    
    // Nascondi setup e mostra gioco
    document.getElementById('setup-section').classList.add('hidden');
    document.getElementById('game-section').classList.remove('hidden');
    document.getElementById('players-section').classList.remove('hidden');
    document.getElementById('role-map-section').classList.remove('hidden');
    
    startFirstNight();
}

function startFirstNight() {
    gameState.gamePhase = 'firstNight';
    document.getElementById('phase-title').textContent = 'Manche 0 - Assegnazione Società';
    
    const nameAssignment = document.getElementById('name-assignment');
    nameAssignment.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        nameAssignment.innerHTML += `
            <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <label><strong>${player.role}:</strong></label>
                <input type="text" id="player-name-${index}" placeholder="Inserisci nome partecipante" style="margin-left: 10px;">
            </div>
        `;
    });
    
    document.getElementById('first-night').classList.remove('hidden');
    updatePlayersDisplay();
    updateRoleMap();
}

function finishNameAssignment() {
    // Salva i nomi dei giocatori
    gameState.players.forEach((player, index) => {
        const nameInput = document.getElementById(`player-name-${index}`);
        if (!nameInput.value.trim()) {
            alert(`Inserisci un nome per ${player.role}!`);
            return;
        }
        player.name = nameInput.value.trim();
    });
    
    // Verifica che tutti abbiano un nome
    if (gameState.players.some(p => !p.name)) {
        return;
    }
    
    document.getElementById('first-night').classList.add('hidden');
    gameState.currentNight = 1;
    startNight();
}

function startNight() {
    gameState.gamePhase = 'night';
    gameState.currentRoleIndex = 0;
    gameState.targetToKill = null;
    gameState.protectedPlayer = null;
    
    // Reset protezioni
    gameState.players.forEach(p => p.protected = false);
    
    // Determina l'ordine dei ruoli per la notte
    gameState.nightRoles = [];
    
    // Ladro di Lanterne (Lupo)
    if (gameState.players.some(p => p.alive && p.role === 'Ladro di Lanterne')) {
        gameState.nightRoles.push('Ladro di Lanterne');
    }
    
    // Lo Zio Tony (Guardia)
    if (gameState.players.some(p => p.alive && p.role === 'Lo Zio Tony')) {
        gameState.nightRoles.push('Lo Zio Tony');
    }
    
    // Gesù Cristo (Veggente)
    if (gameState.players.some(p => p.alive && p.role === 'Gesù Cristo')) {
        gameState.nightRoles.push('Gesù Cristo');
    }
    
    // Il Galletti (Mitomane) - solo prima notte
    if (gameState.currentNight === 1 && gameState.players.some(p => p.alive && p.role === 'Il Galletti')) {
        gameState.nightRoles.push('Il Galletti');
    }
    
    // Noemi (Strega) - per ultima
    if (gameState.players.some(p => p.alive && p.role === 'Noemi')) {
        gameState.nightRoles.push('Noemi');
    }
    
    document.getElementById('phase-title').textContent = `Manche ${gameState.currentNight} - Gara di Orienteering`;
    
    // Mostra animazione notte
    showNightAnimation();
    
    setTimeout(() => {
        document.getElementById('night-phase').classList.remove('hidden');
        document.getElementById('day-phase').classList.add('hidden');
        processNextRole();
    }, 3000);
}

function showNightAnimation() {
    const animation = document.createElement('div');
    animation.className = 'night-animation';
    animation.innerHTML = '🌙 Inizia la manche notturna di orienteering... 🏃‍♂️';
    document.body.appendChild(animation);
    
    setTimeout(() => {
        document.body.removeChild(animation);
    }, 3000);
}

function processNextRole() {
    if (gameState.currentRoleIndex >= gameState.nightRoles.length) {
        startDay();
        return;
    }
    
    const currentRole = gameState.nightRoles[gameState.currentRoleIndex];
    const narratorText = document.getElementById('narrator-text');
    const roleActions = document.getElementById('role-actions');
    
    switch (currentRole) {
        case 'Ladro di Lanterne':
            processThiefTurn(narratorText, roleActions);
            break;
        case 'Lo Zio Tony':
            processGuardTurn(narratorText, roleActions);
            break;
        case 'Gesù Cristo':
            processSeerTurn(narratorText, roleActions);
            break;
        case 'Il Galletti':
            processMitomaneTurn(narratorText, roleActions);
            break;
        case 'Noemi':
            processWitchTurn(narratorText, roleActions);
            break;
    }
}

function processThiefTurn(narratorText, roleActions) {
    const thieves = gameState.players.filter(p => p.alive && p.role === 'Ladro di Lanterne');
    const targets = gameState.players.filter(p => p.alive && p.role !== 'Ladro di Lanterne');
    
    const thiefText = thieves.length === 1 ? 'Si muove nel buio il Ladro di Lanterne' : 'Si muovono nel buio i Ladri di Lanterne';
    const actionText = thieves.length === 1 ? 'ladro, a chi vuoi rubare la lanterna?' : 'ladri, a chi volete rubare la lanterna?';
    
    narratorText.innerHTML = `<h3>"${thiefText}, ${actionText}"</h3>`;
    
    let selectHtml = '<select id="thief-target"><option value="">Seleziona vittima</option>';
    targets.forEach(player => {
        selectHtml += `<option value="${player.id}">${player.name}</option>`;
    });
    selectHtml += '</select>';
    
    roleActions.innerHTML = `
        ${selectHtml}
        <button class="btn" onclick="confirmThiefKill()">Conferma Furto</button>
    `;
}

function confirmThiefKill() {
    const targetId = document.getElementById('thief-target').value;
    if (!targetId) {
        alert('Seleziona una vittima!');
        return;
    }
    
    gameState.targetToKill = parseInt(targetId);
    document.getElementById('narrator-text').innerHTML = '<h3>"Il Ladro di Lanterne si nasconde tra i cespugli"</h3>';
    document.getElementById('role-actions').innerHTML = '';
    
    setTimeout(() => {
        nextRole();
    }, 2000);
}

function processGuardTurn(narratorText, roleActions) {
    const targets = gameState.players.filter(p => p.alive);
    
    narratorText.innerHTML = '<h3>"Lo Zio Tony pattuglia il percorso, chi vuoi accompagnare e proteggere?"</h3>';
    
    let selectHtml = '<select id="guard-target"><option value="">Seleziona chi accompagnare</option>';
    targets.forEach(player => {
        selectHtml += `<option value="${player.id}">${player.name}</option>`;
    });
    selectHtml += '</select>';
    
    roleActions.innerHTML = `
        ${selectHtml}
        <button class="btn" onclick="confirmGuardProtection()">Conferma Accompagnamento</button>
    `;
}

function confirmGuardProtection() {
    const targetId = document.getElementById('guard-target').value;
    if (targetId) {
        gameState.protectedPlayer = parseInt(targetId);
        const player = gameState.players.find(p => p.id === gameState.protectedPlayer);
        player.protected = true;
    }
    
    document.getElementById('narrator-text').innerHTML = '<h3>"Lo Zio Tony si ferma a riposare"</h3>';
    document.getElementById('role-actions').innerHTML = '';
    
    setTimeout(() => {
        nextRole();
    }, 2000);
}

function processSeerTurn(narratorText, roleActions) {
    const targets = gameState.players.filter(p => p.alive);
    
    narratorText.innerHTML = '<h3>"Gesù Cristo illumina il sentiero, di chi vuoi vedere la vera natura?"</h3>';
    
    let selectHtml = '<select id="seer-target"><option value="">Seleziona chi illuminare</option>';
    targets.forEach(player => {
        selectHtml += `<option value="${player.id}">${player.name}</option>`;
    });
    selectHtml += '</select>';
    
    roleActions.innerHTML = `
        ${selectHtml}
        <button class="btn" onclick="confirmSeerVision()">Illumina Sentiero</button>
        <div id="seer-result"></div>
    `;
}

function confirmSeerVision() {
    const targetId = document.getElementById('seer-target').value;
    if (!targetId) {
        alert('Seleziona chi illuminare!');
        return;
    }
    
    const target = gameState.players.find(p => p.id === parseInt(targetId));
    const isThief = target.role === 'Ladro di Lanterne';
    
    const resultDiv = document.getElementById('seer-result');
    if (isThief) {
        resultDiv.innerHTML = '<div class="role-result wolf">🔦 LADRO</div>';
    } else {
        resultDiv.innerHTML = '<div class="role-result good">✅ ONESTO</div>';
    }
    
    setTimeout(() => {
        document.getElementById('narrator-text').innerHTML = '<h3>"Gesù Cristo spegne la sua luce"</h3>';
        document.getElementById('role-actions').innerHTML = '';
        
        setTimeout(() => {
            nextRole();
        }, 2000);
    }, 3000);
}

function processMitomaneTurn(narratorText, roleActions) {
    const targets = gameState.players.filter(p => p.alive && p.role !== 'Il Galletti');
    
    narratorText.innerHTML = '<h3>"Il Galletti osserva gli arrivi con eccitazione, di chi vuoi esaltare lo sprint finale?"</h3>';
    
    let selectHtml = '<select id="mitomane-target"><option value="">Seleziona chi esaltare</option>';
    targets.forEach(player => {
        selectHtml += `<option value="${player.id}">${player.name}</option>`;
    });
    selectHtml += '</select>';
    
    roleActions.innerHTML = `
        ${selectHtml}
        <button class="btn" onclick="confirmMitomaneChoice()">Conferma Esaltazione</button>
    `;
}

function confirmMitomaneChoice() {
    const targetId = document.getElementById('mitomane-target').value;
    if (!targetId) {
        alert('Seleziona chi esaltare!');
        return;
    }
    
    const target = gameState.players.find(p => p.id === parseInt(targetId));
    const mitomane = gameState.players.find(p => p.role === 'Il Galletti');
    
    gameState.mitomaneNewRole = target.role;
    mitomane.role = target.role;
    
    document.getElementById('narrator-text').innerHTML = '<h3>"Il galletti urla a scquarcia gola nel microfono che non cè conuntdown e si risiede"</h3>';
    document.getElementById('role-actions').innerHTML = '';
    
    setTimeout(() => {
        nextRole();
    }, 2000);
}

function processWitchTurn(narratorText, roleActions) {
    const targetToKill = gameState.players.find(p => p.id === gameState.targetToKill);
    const willDie = targetToKill && !targetToKill.protected;
    
    let deathText = willDie ? targetToKill.name : 'Nessuno';
    narratorText.innerHTML = `<h3>"Noemi controlla il percorso, questa notte  si perderà: ${deathText}"</h3>`;
    
    let actions = '<h4>Cosa vuoi fare?</h4>';
    
    // Opzione cura (se qualcuno sta per morire e non è già stata usata)
    if (willDie && !gameState.witchUsedHeal) {
        actions += '<button class="btn btn-success" onclick="witchHeal()">Indica la strada giusta (1 volta)</button>';
    }
    
    // Opzione uccidi (se non è già stata usata)
    if (!gameState.witchUsedKill) {
        const targets = gameState.players.filter(p => p.alive && p.role !== 'Noemi');
        let selectHtml = '<select id="witch-kill-target"><option value="">Nessuno</option>';
        targets.forEach(player => {
            selectHtml += `<option value="${player.id}">${player.name}</option>`;
        });
        selectHtml += '</select>';
        
        actions += `<div style="margin: 10px 0;">${selectHtml}<button class="btn btn-danger" onclick="witchKill()">Sabota il percorso (1 volta)</button></div>`;
    }
    
    // Opzione non fare nulla
    actions += '<button class="btn" onclick="witchDoNothing()">Non interferire</button>';
    
    roleActions.innerHTML = actions;
}

function witchHeal() {
    gameState.witchUsedHeal = true;
    const target = gameState.players.find(p => p.id === gameState.targetToKill);
    if (target) {
        target.protected = true;
    }
    
    document.getElementById('narrator-text').innerHTML = '<h3>"Noemi ha indicato la strada giusta"</h3>';
    finishWitchTurn();
}

function witchKill() {
    const targetId = document.getElementById('witch-kill-target').value;
    if (!targetId) {
        witchDoNothing();
        return;
    }
    
    gameState.witchUsedKill = true;
    const target = gameState.players.find(p => p.id === parseInt(targetId));
    target.alive = false;
    
    document.getElementById('narrator-text').innerHTML = `<h3>"Noemi ha sabotato il percorso di ${target.name}"</h3>`;
    finishWitchTurn();
}

function witchDoNothing() {
    document.getElementById('narrator-text').innerHTML = '<h3>"Noemi non interferisce"</h3>';
    finishWitchTurn();
}

function finishWitchTurn() {
    document.getElementById('role-actions').innerHTML = '';
    
    setTimeout(() => {
        document.getElementById('narrator-text').innerHTML = '<h3>"Noemi torna al ritrovo."</h3>';
        
        setTimeout(() => {
            nextRole();
        }, 2000);
    }, 2000);
}

function nextRole() {
    gameState.currentRoleIndex++;
    processNextRole();
}

function startDay() {
    gameState.gamePhase = 'day';
    document.getElementById('phase-title').textContent = `Giorno ${gameState.currentNight} - Risultati della Gara`;
    document.getElementById('night-phase').classList.add('hidden');
    document.getElementById('day-phase').classList.remove('hidden');
    
    // Processa le morti della notte
    const deaths = [];
    
    // Morte per ladro di lanterne
    if (gameState.targetToKill) {
        const target = gameState.players.find(p => p.id === gameState.targetToKill);
        if (target && !target.protected) {
            target.alive = false;
            deaths.push(`${target.name} si è perso nel buio e si è ritirato`);
        } else if (target && target.protected) {
            deaths.push(`${target.name} è stato guidato da Lo Zio Tony e ha ritrovato la strada`);
        }
    }
    
    let dayResults = '<h3>"Spunta l\'alba, i partecipanti si radunano al ritrovo"</h3>';
    
    if (deaths.length > 0) {
        dayResults += `<div style="background: rgba(220, 53, 69, 0.2); padding: 15px; border-radius: 8px; margin: 10px 0;">`;
        dayResults += `<h4>📢 Risultati della gara notturna:</h4>`;
        deaths.forEach(death => {
            dayResults += `<p>${death}</p>`;
        });
        dayResults += '</div>';
    } else {
        dayResults += '<p style="color: #51cf66;">Tutti i partecipanti hanno completato il percorso notturno!</p>';
    }
    
    // Annuncio galletti (solo primo giorno)
    if (gameState.currentNight === 1 && gameState.mitomaneNewRole) {
        dayResults += `<div style="background: rgba(255, 193, 7, 0.2); padding: 15px; border-radius: 8px; margin: 10px 0;">`;
        dayResults += `<h4>📢 Annuncio dell'organizzazione:</h4>`;
        dayResults += `<p>"Il Galletti ha cambiato società ed è diventato ${gameState.mitomaneNewRole}"</p>`;
        dayResults += '</div>';
    }
    
    document.getElementById('day-results').innerHTML = dayResults;
    
    // Aggiorna lista votazione
    updateVoteSelect();
    updatePlayersDisplay();
    
    // Controlla condizioni di vittoria
    if (checkWinConditions()) {
        return;
    }
}

function updateVoteSelect() {
    const voteSelect = document.getElementById('vote-select');
    voteSelect.innerHTML = '<option value="">Seleziona chi squalificare dalla gara</option>';
    voteSelect.innerHTML += '<option value="abstain">Non squalifichiamo nessuno</option>';
    
    gameState.players.filter(p => p.alive).forEach(player => {
        voteSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
    });
}

function executeVote() {
    const vote = document.getElementById('vote-select').value;
    
    if (!vote) {
        alert('Seleziona un\'opzione di voto!');
        return;
    }
    
    if (vote === 'abstain') {
        alert('L\'organizzazione decide di non squalificare nessuno. Si passa alla prossima gara notturna.');
    } else {
        const targetId = parseInt(vote);
        const target = gameState.players.find(p => p.id === targetId);
        target.alive = false;
        
        // Controlla se Il Biella vince
        if (target.originalRole === 'Il Biella') {
            endGame('fool');
            return;
        }
        
        alert(`${target.name} è stato eliminato dalla gara di orienteering.`);
    }
    
    updatePlayersDisplay();
    
    // Controlla condizioni di vittoria
    if (checkWinConditions()) {
        return;
    }
    
    // Passa alla notte successiva
    gameState.currentNight++;
    startNight();
}

function checkWinConditions() {
    const alivePlayers = gameState.players.filter(p => p.alive);
    const aliveThieves = alivePlayers.filter(p => p.role === 'Ladro di Lanterne');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'Ladro di Lanterne');
    
    if (aliveThieves.length === 0) {
        endGame('village');
        return true;
    }
    
    if (aliveThieves.length >= aliveVillagers.length) {
        endGame('thieves');
        return true;
    }
    
    return false;
}

function endGame(winner) {
    gameState.gamePhase = 'ended';
    let winnerText = '';
    
    switch (winner) {
        case 'village':
            winnerText = '🏆 Vittoria dei concorrenti! Il Ladro di Lanterne è stato catturato!';
            break;
        case 'thieves':
            winnerText = '🔦 Vittoria del Ladro di Lanterne! Ha rubato tutte le lanterne della gara!';
            break;
        case 'fool':
            winnerText = '🤡 Vittoria del Biella! È riuscito a farsi eliminare dalla gara!';
            break;
    }
    
    document.getElementById('phase-title').textContent = 'Gara Terminata';
    document.getElementById('night-phase').classList.add('hidden');
    document.getElementById('day-phase').classList.add('hidden');
    
    const gameSection = document.getElementById('game-section');
    gameSection.innerHTML = `
        <h2>🎮 Gara di Orienteering Terminata</h2>
        <div style="background: rgba(255, 255, 255, 0.1); padding: 2rem; border-radius: 15px; text-align: center;">
            <h3 style="font-size: 2rem; margin-bottom: 1rem;">${winnerText}</h3>
            <button class="btn btn-success" onclick="location.reload()">Nuova Gara</button>
            <a href="index.html" class="btn" style="margin-left: 1rem;">Torna al Menu</a>
        </div>
    `;
}

function updatePlayersDisplay() {
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';
    
    gameState.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = `player-card ${!player.alive ? 'dead' : ''}`;
        
        let statusIcon = player.alive ? '🏃‍♂️' : '❌';
        if (player.protected) statusIcon += '🛡️';
        
        playerCard.innerHTML = `
            <h4>${player.name} ${statusIcon}</h4>
            <p><strong>Squadra:</strong> ${player.role}</p>
            <p><strong>Stato:</strong> ${player.alive ? 'In gara' : 'Eliminato'}</p>
        `;
        
        playersList.appendChild(playerCard);
    });
}

function updateRoleMap() {
    const roleMap = document.getElementById('role-map');
    roleMap.innerHTML = '';
    
    gameState.players.forEach(player => {
        const roleCard = document.createElement('div');
        roleCard.className = `player-card ${!player.alive ? 'dead' : ''}`;
        
        roleCard.innerHTML = `
            <h4>${player.name}</h4>
            <p><strong>Squadra Originale:</strong> ${player.originalRole}</p>
            <p><strong>Squadra Attuale:</strong> ${player.role}</p>
            <p><strong>Tipo:</strong> ${orienteeringRoles[player.role]?.team || 'unknown'}</p>
        `;
        
        roleMap.appendChild(roleCard);
    });
}

function toggleRules() {
    const rulesContent = document.getElementById('rules-content');
    rulesContent.classList.toggle('hidden');
}

function toggleRoleMap() {
    const roleMap = document.getElementById('role-map');
    roleMap.classList.toggle('hidden');

}

