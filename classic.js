// Variabili globali per la modalità classica
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
    cricetoBecameWolf: false,
    targetToKill: null,
    protectedPlayer: null
};

// Definizione ruoli classici
const classicRoles = {
    'Contadino': { name: 'Contadino', team: 'village', nightAction: false },
    'Lupo': { name: 'Lupo', team: 'wolves', nightAction: true },
    'Veggente': { name: 'Veggente', team: 'village', nightAction: true },
    'Guardia': { name: 'Guardia', team: 'village', nightAction: true },
    'Mitomane': { name: 'Mitomane', team: 'village', nightAction: true },
    'Matto': { name: 'Matto', team: 'fool', nightAction: false },
    'Criceto Mannaro': { name: 'Criceto Mannaro', team: 'village', nightAction: true },
    'Strega': { name: 'Strega', team: 'village', nightAction: true }
};

function setupGame() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    if (playerCount < 6) {
        alert('Servono almeno 6 giocatori!');
        return;
    }

    const roleSetup = document.getElementById('role-setup');
    const roleSelection = document.getElementById('role-selection');
    
    roleSelection.innerHTML = '';
    
    // Ruoli base per 6 giocatori
    let baseRoles = ['Lupo', 'Guardia', 'Veggente'];
    let remainingSlots = playerCount - 3;
    
    // Aggiungi contadini per il resto
    for (let i = 0; i < remainingSlots; i++) {
        baseRoles.push('Contadino');
    }
    
    // Crea interfaccia per personalizzare ruoli
    roleSelection.innerHTML = `
        <p>Ruoli base assegnati: ${baseRoles.join(', ')}</p>
        <h4>Personalizza i ruoli (opzionale):</h4>
    `;
    
    Object.keys(classicRoles).forEach(role => {
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
    Object.keys(classicRoles).forEach(role => {
        const count = parseInt(document.getElementById(`role-${role}`).value) || 0;
        for (let i = 0; i < count; i++) {
            selectedRoles.push(role);
        }
    });
    
    const playerCount = parseInt(document.getElementById('player-count').value);
    if (selectedRoles.length !== playerCount) {
        alert(`Il numero di ruoli (${selectedRoles.length}) non corrisponde al numero di giocatori (${playerCount})!`);
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
    document.getElementById('phase-title').textContent = 'Notte 0 - Assegnazione Ruoli';
    
    const nameAssignment = document.getElementById('name-assignment');
    nameAssignment.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        nameAssignment.innerHTML += `
            <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <label><strong>${player.role}:</strong></label>
                <input type="text" id="player-name-${index}" placeholder="Inserisci nome giocatore" style="margin-left: 10px;">
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
            alert(`Inserisci un nome per il ${player.role}!`);
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
    
    // Lupi
    if (gameState.players.some(p => p.alive && p.role === 'Lupo')) {
        gameState.nightRoles.push('Lupo');
    }
    
    // Guardia
    if (gameState.players.some(p => p.alive && p.role === 'Guardia')) {
        gameState.nightRoles.push('Guardia');
    }
    
    // Veggente
    if (gameState.players.some(p => p.alive && p.role === 'Veggente')) {
        gameState.nightRoles.push('Veggente');
    }
    
    // Mitomane (solo prima notte)
    if (gameState.currentNight === 1 && gameState.players.some(p => p.alive && p.role === 'Mitomane')) {
        gameState.nightRoles.push('Mitomane');
    }
    
    // Criceto Mannaro
    if (gameState.players.some(p => p.alive && p.role === 'Criceto Mannaro')) {
        gameState.nightRoles.push('Criceto Mannaro');
    }
    
    // Strega (per ultima)
    if (gameState.players.some(p => p.alive && p.role === 'Strega')) {
        gameState.nightRoles.push('Strega');
    }
    
    document.getElementById('phase-title').textContent = `Notte ${gameState.currentNight}`;
    
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
    animation.innerHTML = '🌙 La notte cala sul villaggio... 🌙';
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
        case 'Lupo':
            processWolfTurn(narratorText, roleActions);
            break;
        case 'Guardia':
            processGuardTurn(narratorText, roleActions);
            break;
        case 'Veggente':
            processSeerTurn(narratorText, roleActions);
            break;
        case 'Mitomane':
            processMitomaneTurn(narratorText, roleActions);
            break;
        case 'Criceto Mannaro':
            processCricetoTurn(narratorText, roleActions);
            break;
        case 'Strega':
            processWitchTurn(narratorText, roleActions);
            break;
    }
}

function processWolfTurn(narratorText, roleActions) {
    const wolves = gameState.players.filter(p => p.alive && p.role === 'Lupo');
    const targets = gameState.players.filter(p => p.alive && p.role !== 'Lupo');
    
    const wolfText = wolves.length === 1 ? 'Si sveglia il lupo' : 'Si svegliano i lupi';
    const actionText = wolves.length === 1 ? 'lupo, chi vuoi uccidere?' : 'lupi, chi volete uccidere?';
    
    narratorText.innerHTML = `<h3>"${wolfText}, ${actionText}"</h3>`;
    
    let selectHtml = '<select id="wolf-target"><option value="">Seleziona vittima</option>';
    targets.forEach(player => {
        selectHtml += `<option value="${player.id}">${player.name}</option>`;
    });
    selectHtml += '</select>';
    
    roleActions.innerHTML = `
        ${selectHtml}
        <button class="btn" onclick="confirmWolfKill()">Conferma Scelta</button>
    `;
}

function confirmWolfKill() {
    const targetId = document.getElementById('wolf-target').value;
    if (!targetId) {
        alert('Seleziona una vittima!');
        return;
    }
    
    gameState.targetToKill = parseInt(targetId);
    document.getElementById('narrator-text').innerHTML = '<h3>"Si addormentano i lupi"</h3>';
    document.getElementById('role-actions').innerHTML = '';
    
    setTimeout(() => {
        nextRole();
    }, 2000);
}

function processGuardTurn(narratorText, roleActions) {
    const targets = gameState.players.filter(p => p.alive);
    
    narratorText.innerHTML = '<h3>"Si sveglia la guardia, chi vuoi proteggere oggi?"</h3>';
    
    let selectHtml = '<select id="guard-target"><option value="">Seleziona chi proteggere</option>';
    targets.forEach(player => {
        selectHtml += `<option value="${player.id}">${player.name}</option>`;
    });
    selectHtml += '</select>';
    
    roleActions.innerHTML = `
        ${selectHtml}
        <button class="btn" onclick="confirmGuardProtection()">Conferma Protezione</button>
    `;
}

function confirmGuardProtection() {
    const targetId = document.getElementById('guard-target').value;
    if (targetId) {
        gameState.protectedPlayer = parseInt(targetId);
        const player = gameState.players.find(p => p.id === gameState.protectedPlayer);
        player.protected = true;
    }
    
    document.getElementById('narrator-text').innerHTML = '<h3>"Si addormenta la guardia"</h3>';
    document.getElementById('role-actions').innerHTML = '';
    
    setTimeout(() => {
        nextRole();
    }, 2000);
}

function processSeerTurn(narratorText, roleActions) {
    const targets = gameState.players.filter(p => p.alive);
    
    narratorText.innerHTML = '<h3>"Si sveglia la veggente, di chi vuoi vedere il ruolo?"</h3>';
    
    let selectHtml = '<select id="seer-target"><option value="">Seleziona chi investigare</option>';
    targets.forEach(player => {
        selectHtml += `<option value="${player.id}">${player.name}</option>`;
    });
    selectHtml += '</select>';
    
    roleActions.innerHTML = `
        ${selectHtml}
        <button class="btn" onclick="confirmSeerVision()">Vedi Ruolo</button>
        <div id="seer-result"></div>
    `;
}

function confirmSeerVision() {
    const targetId = document.getElementById('seer-target').value;
    if (!targetId) {
        alert('Seleziona chi investigare!');
        return;
    }
    
    const target = gameState.players.find(p => p.id === parseInt(targetId));
    const isWolf = target.role === 'Lupo';
    
    const resultDiv = document.getElementById('seer-result');
    if (isWolf) {
        resultDiv.innerHTML = '<div class="role-result wolf">🐺 LUPO</div>';
    } else {
        resultDiv.innerHTML = '<div class="role-result good">✅ BUONO</div>';
    }
    
    setTimeout(() => {
        document.getElementById('narrator-text').innerHTML = '<h3>"Si addormenta la veggente"</h3>';
        document.getElementById('role-actions').innerHTML = '';
        
        setTimeout(() => {
            nextRole();
        }, 2000);
    }, 3000);
}

function processMitomaneTurn(narratorText, roleActions) {
    const targets = gameState.players.filter(p => p.alive && p.role !== 'Mitomane');
    
    narratorText.innerHTML = '<h3>"Si sveglia il mitomane, di chi vuoi prendere il ruolo?"</h3>';
    
    let selectHtml = '<select id="mitomane-target"><option value="">Seleziona chi imitare</option>';
    targets.forEach(player => {
        selectHtml += `<option value="${player.id}">${player.name}</option>`;
    });
    selectHtml += '</select>';
    
    roleActions.innerHTML = `
        ${selectHtml}
        <button class="btn" onclick="confirmMitomaneChoice()">Conferma Scelta</button>
    `;
}

function confirmMitomaneChoice() {
    const targetId = document.getElementById('mitomane-target').value;
    if (!targetId) {
        alert('Seleziona chi imitare!');
        return;
    }
    
    const target = gameState.players.find(p => p.id === parseInt(targetId));
    const mitomane = gameState.players.find(p => p.role === 'Mitomane');
    
    gameState.mitomaneNewRole = target.role;
    mitomane.role = target.role;
    
    document.getElementById('narrator-text').innerHTML = '<h3>"Si addormenta il mitomane"</h3>';
    document.getElementById('role-actions').innerHTML = '';
    
    setTimeout(() => {
        nextRole();
    }, 2000);
}

function processCricetoTurn(narratorText, roleActions) {
    narratorText.innerHTML = '<h3>"Si sveglia il criceto mannaro"</h3>';
    
    let statusText = '';
    if (gameState.targetToKill) {
        const target = gameState.players.find(p => p.id === gameState.targetToKill);
        if (target && target.role === 'Criceto Mannaro' && !target.protected) {
            gameState.cricetoBecameWolf = true;
            target.role = 'Lupo';
            statusText = '<p style="color: #ff6b6b; font-weight: bold;">Il criceto è stato attaccato dai lupi ed è diventato lupo!</p>';
        } else {
            statusText = '<p style="color: #51cf66;">Il criceto è al sicuro questa notte.</p>';
        }
    } else {
        statusText = '<p style="color: #51cf66;">Il criceto è al sicuro questa notte.</p>';
    }
    
    roleActions.innerHTML = statusText;
    
    setTimeout(() => {
        document.getElementById('narrator-text').innerHTML = '<h3>"Si addormenta il criceto"</h3>';
        
        setTimeout(() => {
            nextRole();
        }, 2000);
    }, 3000);
}

function processWitchTurn(narratorText, roleActions) {
    const targetToKill = gameState.players.find(p => p.id === gameState.targetToKill);
    const willDie = targetToKill && !targetToKill.protected;
    
    let deathText = willDie ? targetToKill.name : 'Nessuno';
    narratorText.innerHTML = `<h3>"Si sveglia la strega, questa notte morirà: ${deathText}"</h3>`;
    
    let actions = '<h4>Cosa vuoi fare?</h4>';
    
    // Opzione cura (se qualcuno sta per morire e non è già stata usata)
    if (willDie && !gameState.witchUsedHeal) {
        actions += '<button class="btn btn-success" onclick="witchHeal()">Cura (1 volta)</button>';
    }
    
    // Opzione uccidi (se non è già stata usata)
    if (!gameState.witchUsedKill) {
        const targets = gameState.players.filter(p => p.alive && p.role !== 'Strega');
        let selectHtml = '<select id="witch-kill-target"><option value="">Nessuno</option>';
        targets.forEach(player => {
            selectHtml += `<option value="${player.id}">${player.name}</option>`;
        });
        selectHtml += '</select>';
        
        actions += `<div style="margin: 10px 0;">${selectHtml}<button class="btn btn-danger" onclick="witchKill()">Uccidi (1 volta)</button></div>`;
    }
    
    // Opzione non fare nulla
    actions += '<button class="btn" onclick="witchDoNothing()">Non fare nulla</button>';
    
    roleActions.innerHTML = actions;
}

function witchHeal() {
    gameState.witchUsedHeal = true;
    const target = gameState.players.find(p => p.id === gameState.targetToKill);
    if (target) {
        target.protected = true;
    }
    
    document.getElementById('narrator-text').innerHTML = '<h3>"La strega ha curato la vittima"</h3>';
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
    
    document.getElementById('narrator-text').innerHTML = `<h3>"La strega ha ucciso ${target.name}"</h3>`;
    finishWitchTurn();
}

function witchDoNothing() {
    document.getElementById('narrator-text').innerHTML = '<h3>"La strega non fa nulla"</h3>';
    finishWitchTurn();
}

function finishWitchTurn() {
    document.getElementById('role-actions').innerHTML = '';
    
    setTimeout(() => {
        document.getElementById('narrator-text').innerHTML = '<h3>"Si addormenta la strega"</h3>';
        
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
    document.getElementById('phase-title').textContent = `Giorno ${gameState.currentNight}`;
    document.getElementById('night-phase').classList.add('hidden');
    document.getElementById('day-phase').classList.remove('hidden');
    
    // Processa le morti della notte
    const deaths = [];
    
    // Morte per lupi
    if (gameState.targetToKill) {
        const target = gameState.players.find(p => p.id === gameState.targetToKill);
        if (target && !target.protected) {
            target.alive = false;
            deaths.push(`${target.name} è stato ucciso dai lupi`);
        } else if (target && target.protected) {
            deaths.push(`${target.name} è stato salvato dalla guardia`);
        }
    }
    
    let dayResults = '<h3>"Si sveglia il villaggio"</h3>';
    
    if (deaths.length > 0) {
        dayResults += `<div style="background: rgba(220, 53, 69, 0.2); padding: 15px; border-radius: 8px; margin: 10px 0;">`;
        dayResults += `<h4>💀 Morti della notte:</h4>`;
        deaths.forEach(death => {
            dayResults += `<p>${death}</p>`;
        });
        dayResults += '</div>';
    } else {
        dayResults += '<p style="color: #51cf66;">Nessuno è morto questa notte!</p>';
    }
    
    // Annuncio mitomane (solo primo giorno)
    if (gameState.currentNight === 1 && gameState.mitomaneNewRole) {
        dayResults += `<div style="background: rgba(255, 193, 7, 0.2); padding: 15px; border-radius: 8px; margin: 10px 0;">`;
        dayResults += `<h4>📢 Annuncio:</h4>`;
        dayResults += `<p>"Il mitomane è diventato ${gameState.mitomaneNewRole}"</p>`;
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
    voteSelect.innerHTML = '<option value="">Seleziona chi eliminare</option>';
    voteSelect.innerHTML += '<option value="abstain">Ci asteniamo</option>';
    
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
        alert('Il villaggio si astiene. Si passa alla notte successiva.');
    } else {
        const targetId = parseInt(vote);
        const target = gameState.players.find(p => p.id === targetId);
        target.alive = false;
        
        // Controlla se il matto vince
        if (target.originalRole === 'Matto') {
            endGame('fool');
            return;
        }
        
        alert(`${target.name} è stato eliminato dal villaggio.`);
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
    const aliveWolves = alivePlayers.filter(p => p.role === 'Lupo');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'Lupo');
    
    if (aliveWolves.length === 0) {
        endGame('village');
        return true;
    }
    
    if (aliveWolves.length >= aliveVillagers.length) {
        endGame('wolves');
        return true;
    }
    
    return false;
}

function endGame(winner) {
    gameState.gamePhase = 'ended';
    let winnerText = '';
    
    switch (winner) {
        case 'village':
            winnerText = '🏆 Vittoria del Villaggio! Tutti i lupi sono stati eliminati!';
            break;
        case 'wolves':
            winnerText = '🐺 Vittoria dei Lupi! Hanno raggiunto la parità numerica!';
            break;
        case 'fool':
            winnerText = '🤡 Vittoria del Matto! È riuscito a farsi eliminare!';
            break;
    }
    
    document.getElementById('phase-title').textContent = 'Partita Terminata';
    document.getElementById('night-phase').classList.add('hidden');
    document.getElementById('day-phase').classList.add('hidden');
    
    const gameSection = document.getElementById('game-section');
    gameSection.innerHTML = `
        <h2>🎮 Partita Terminata</h2>
        <div style="background: rgba(255, 255, 255, 0.1); padding: 2rem; border-radius: 15px; text-align: center;">
            <h3 style="font-size: 2rem; margin-bottom: 1rem;">${winnerText}</h3>
            <button class="btn btn-success" onclick="location.reload()">Nuova Partita</button>
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
        
        let statusIcon = player.alive ? '✅' : '💀';
        if (player.protected) statusIcon += '🛡️';
        
        playerCard.innerHTML = `
            <h4>${player.name} ${statusIcon}</h4>
            <p><strong>Ruolo:</strong> ${player.role}</p>
            <p><strong>Stato:</strong> ${player.alive ? 'Vivo' : 'Morto'}</p>
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
            <p><strong>Ruolo Originale:</strong> ${player.originalRole}</p>
            <p><strong>Ruolo Attuale:</strong> ${player.role}</p>
            <p><strong>Team:</strong> ${classicRoles[player.role]?.team || 'unknown'}</p>
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