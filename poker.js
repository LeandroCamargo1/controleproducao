// Constantes do jogo
const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const RANK_VALUES = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

// Estado do jogo
let handCards = [];
let boardCards = [];
let selectionMode = 'hand'; // 'hand' ou 'board'

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderDeck();
    updateDisplay();
});

// Renderiza o deck completo
function renderDeck() {
    const deckDiv = document.getElementById('deck');
    deckDiv.innerHTML = '';

    SUITS.forEach((suit, suitIndex) => {
        const suitRow = document.createElement('div');
        suitRow.className = 'suit-row';
        
        const isRed = suit === '♥' || suit === '♦';
        const colorClass = isRed ? 'red' : 'black';
        const suitName = SUIT_NAMES[suitIndex];

        RANKS.forEach(rank => {
            const cardId = `${rank}${suit}`;
            const card = document.createElement('div');
            card.className = `card mini-card ${suitName}`;
            card.dataset.card = cardId;
            card.dataset.rank = rank;
            card.dataset.suit = suit;
            
            card.innerHTML = `
                <span class="rank ${colorClass}">${rank}</span>
                <span class="suit ${colorClass}">${suit}</span>
            `;
            
            card.addEventListener('click', () => selectCard(cardId, rank, suit));
            suitRow.appendChild(card);
        });
        
        deckDiv.appendChild(suitRow);
    });
}

// Define o modo de seleção
function setSelectionMode(mode) {
    selectionMode = mode;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    const modeText = mode === 'hand' ? 'Minha Mão' : 'Mesa (Board)';
    document.getElementById('mode-indicator').innerHTML = `Selecionando: <strong>${modeText}</strong>`;
}

// Seleciona uma carta
function selectCard(cardId, rank, suit) {
    // Verifica se a carta já está selecionada
    if (isCardSelected(cardId)) {
        return;
    }

    if (selectionMode === 'hand') {
        if (handCards.length < 2) {
            handCards.push({ id: cardId, rank, suit });
            if (handCards.length === 2) {
                // Troca para mesa automaticamente
                setSelectionMode('board');
            }
        }
    } else {
        if (boardCards.length < 5) {
            boardCards.push({ id: cardId, rank, suit });
        }
    }
    updateDisplay();
}

// Verifica se uma carta está selecionada
function isCardSelected(cardId) {
    return handCards.some(c => c.id === cardId) || boardCards.some(c => c.id === cardId);
}

// Remove uma carta
function removeCard(type, index) {
    if (type === 'hand') {
        handCards.splice(index, 1);
        // Se remover carta da mão, volta para modo mão
        setSelectionMode('hand');
    } else {
        boardCards.splice(index, 1);
    }
    updateDisplay();
}

// Atualiza a exibição
function updateDisplay() {
    // Atualiza mão
    const handDiv = document.getElementById('hand-cards');
    handDiv.innerHTML = '';
    
    for (let i = 0; i < 2; i++) {
        if (handCards[i]) {
            handDiv.appendChild(createSelectedCard(handCards[i], 'hand', i));
        } else {
            const slot = document.createElement('div');
            slot.className = 'card-slot';
            slot.textContent = `Carta ${i + 1}`;
            handDiv.appendChild(slot);
        }
    }

    // Atualiza board
    const boardDiv = document.getElementById('board-cards');
    boardDiv.innerHTML = '';
    const boardLabels = ['Flop', 'Flop', 'Flop', 'Turn', 'River'];
    
    for (let i = 0; i < 5; i++) {
        if (boardCards[i]) {
            boardDiv.appendChild(createSelectedCard(boardCards[i], 'board', i));
        } else {
            const slot = document.createElement('div');
            slot.className = 'card-slot';
            slot.textContent = boardLabels[i];
            boardDiv.appendChild(slot);
        }
    }

    // Atualiza deck (marca cartas selecionadas)
    document.querySelectorAll('.mini-card').forEach(card => {
        card.classList.toggle('selected', isCardSelected(card.dataset.card));
    });

    // Calcula automaticamente se tiver 2 cartas na mão
    if (handCards.length === 2) {
        calculateOdds();
    } else {
        document.getElementById('results-content').innerHTML = '<p class="results-placeholder">Selecione 2 cartas para sua mão</p>';
    }
}

// Cria elemento de carta selecionada
function createSelectedCard(cardData, type, index) {
    const card = document.createElement('div');
    const isRed = cardData.suit === '♥' || cardData.suit === '♦';
    const colorClass = isRed ? 'red' : 'black';
    const suitName = SUIT_NAMES[SUITS.indexOf(cardData.suit)];
    
    card.className = `card ${suitName} in-selection`;
    card.innerHTML = `
        <span class="rank ${colorClass}">${cardData.rank}</span>
        <span class="suit ${colorClass}">${cardData.suit}</span>
        <button class="remove-btn" onclick="removeCard('${type}', ${index})">×</button>
    `;
    
    return card;
}

// Limpa tudo
function clearAll() {
    handCards = [];
    boardCards = [];
    updateDisplay();
    document.getElementById('results').style.display = 'none';
}

// =====================================================
// LÓGICA DE CÁLCULO DE PROBABILIDADES
// =====================================================

// Converte carta para formato numérico
function cardToNumber(card) {
    const suitValue = SUITS.indexOf(card.suit);
    const rankValue = RANK_VALUES[card.rank];
    return { rank: rankValue, suit: suitValue };
}

// Cria deck completo excluindo cartas conhecidas
function createRemainingDeck(knownCards) {
    const deck = [];
    const knownIds = new Set(knownCards.map(c => c.id));
    
    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            const id = `${rank}${suit}`;
            if (!knownIds.has(id)) {
                deck.push({ id, rank, suit });
            }
        });
    });
    
    return deck;
}

// Embaralha array
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Avalia a mão de poker (7 cartas -> melhor combinação de 5)
function evaluateHand(cards) {
    const numCards = cards.map(cardToNumber);
    const allCombinations = getCombinations(numCards, 5);
    
    let bestHand = null;
    let bestScore = -1;
    
    allCombinations.forEach(combo => {
        const score = getHandScore(combo);
        if (score > bestScore) {
            bestScore = score;
            bestHand = combo;
        }
    });
    
    return { score: bestScore, hand: bestHand, name: getHandName(bestScore) };
}

// Gera todas as combinações de n elementos
function getCombinations(arr, n) {
    if (n === 1) return arr.map(el => [el]);
    if (n === arr.length) return [arr];
    
    const result = [];
    
    for (let i = 0; i <= arr.length - n; i++) {
        const head = arr[i];
        const tailCombos = getCombinations(arr.slice(i + 1), n - 1);
        tailCombos.forEach(combo => {
            result.push([head, ...combo]);
        });
    }
    
    return result;
}

// Calcula pontuação da mão
function getHandScore(cards) {
    const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);
    
    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = checkStraight(ranks);
    
    const rankCounts = {};
    ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => {
        if (rankCounts[b] !== rankCounts[a]) return rankCounts[b] - rankCounts[a];
        return b - a;
    });
    
    // Royal Flush
    if (isFlush && isStraight && ranks[0] === 14 && ranks[4] === 10) {
        return 9000000 + ranks[0];
    }
    
    // Straight Flush
    if (isFlush && isStraight) {
        const highCard = isStraight === 'wheel' ? 5 : ranks[0];
        return 8000000 + highCard;
    }
    
    // Four of a Kind
    if (counts[0] === 4) {
        return 7000000 + uniqueRanks[0] * 100 + uniqueRanks[1];
    }
    
    // Full House
    if (counts[0] === 3 && counts[1] === 2) {
        return 6000000 + uniqueRanks[0] * 100 + uniqueRanks[1];
    }
    
    // Flush
    if (isFlush) {
        return 5000000 + ranks[0] * 10000 + ranks[1] * 1000 + ranks[2] * 100 + ranks[3] * 10 + ranks[4];
    }
    
    // Straight
    if (isStraight) {
        const highCard = isStraight === 'wheel' ? 5 : ranks[0];
        return 4000000 + highCard;
    }
    
    // Three of a Kind
    if (counts[0] === 3) {
        return 3000000 + uniqueRanks[0] * 10000 + uniqueRanks[1] * 100 + uniqueRanks[2];
    }
    
    // Two Pair
    if (counts[0] === 2 && counts[1] === 2) {
        return 2000000 + uniqueRanks[0] * 10000 + uniqueRanks[1] * 100 + uniqueRanks[2];
    }
    
    // One Pair
    if (counts[0] === 2) {
        return 1000000 + uniqueRanks[0] * 10000 + uniqueRanks[1] * 100 + uniqueRanks[2] * 10 + uniqueRanks[3];
    }
    
    // High Card
    return ranks[0] * 10000 + ranks[1] * 1000 + ranks[2] * 100 + ranks[3] * 10 + ranks[4];
}

// Verifica sequência
function checkStraight(ranks) {
    const sorted = [...ranks].sort((a, b) => b - a);
    
    // Sequência normal
    let isStraight = true;
    for (let i = 0; i < 4; i++) {
        if (sorted[i] - sorted[i + 1] !== 1) {
            isStraight = false;
            break;
        }
    }
    if (isStraight) return true;
    
    // Wheel (A-2-3-4-5)
    if (sorted[0] === 14 && sorted[1] === 5 && sorted[2] === 4 && sorted[3] === 3 && sorted[4] === 2) {
        return 'wheel';
    }
    
    return false;
}

// Nome da mão
function getHandName(score) {
    if (score >= 9000000) return 'Royal Flush';
    if (score >= 8000000) return 'Straight Flush';
    if (score >= 7000000) return 'Quadra';
    if (score >= 6000000) return 'Full House';
    if (score >= 5000000) return 'Flush';
    if (score >= 4000000) return 'Sequência';
    if (score >= 3000000) return 'Trinca';
    if (score >= 2000000) return 'Dois Pares';
    if (score >= 1000000) return 'Um Par';
    return 'Carta Alta';
}

// Simulação Monte Carlo
function calculateOdds() {
    if (handCards.length !== 2) {
        return;
    }

    const knownCards = [...handCards, ...boardCards];
    const remainingDeck = createRemainingDeck(knownCards);
    const cardsNeeded = 5 - boardCards.length;
    
    // Número de simulações
    const numSimulations = 10000;
    let wins = 0;
    let ties = 0;
    let losses = 0;

    for (let i = 0; i < numSimulations; i++) {
        const shuffled = shuffle(remainingDeck);
        
        // Completa o board
        const simulatedBoard = [...boardCards, ...shuffled.slice(0, cardsNeeded)];
        
        // Cartas do oponente (próximas 2 cartas)
        const opponentHand = shuffled.slice(cardsNeeded, cardsNeeded + 2);
        
        // Avalia as mãos
        const myFullHand = [...handCards, ...simulatedBoard];
        const oppFullHand = [...opponentHand, ...simulatedBoard];
        
        const myScore = evaluateHand(myFullHand).score;
        const oppScore = evaluateHand(oppFullHand).score;
        
        if (myScore > oppScore) wins++;
        else if (myScore === oppScore) ties++;
        else losses++;
    }

    // Calcula probabilidades
    const winProb = (wins / numSimulations * 100).toFixed(1);
    const tieProb = (ties / numSimulations * 100).toFixed(1);
    const loseProb = (losses / numSimulations * 100).toFixed(1);

    // Avalia mão atual (se tiver board)
    let currentHandName = 'Aguardando Flop...';
    if (boardCards.length >= 3) {
        const currentCards = [...handCards, ...boardCards];
        const evaluation = evaluateHand(currentCards);
        currentHandName = evaluation.name;
    }

    // Exibe resultados
    let outsHtml = '';
    if (boardCards.length >= 3 && boardCards.length < 5) {
        outsHtml = getOutsHtml();
    }

    document.getElementById('results-content').innerHTML = `
        <div class="hand-strength">Mão: ${currentHandName}</div>
        <div class="win-probability">${winProb}%</div>
        <p style="margin-bottom: 10px; color: #aaa;">Vitória</p>
        
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-label">Empate</div>
                <div class="stat-value">${tieProb}%</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Derrota</div>
                <div class="stat-value">${loseProb}%</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Simulações</div>
                <div class="stat-value">${numSimulations.toLocaleString()}</div>
            </div>
        </div>
        ${outsHtml}
    `;
}

// Retorna HTML dos outs
function getOutsHtml() {
    const currentCards = [...handCards, ...boardCards];
    const currentEval = evaluateHand(currentCards);
    const knownCards = [...handCards, ...boardCards];
    const remainingDeck = createRemainingDeck(knownCards);
    
    let outs = 0;
    const improvingCards = [];
    
    remainingDeck.forEach(card => {
        const testCards = [...currentCards, card];
        const testEval = evaluateHand(testCards);
        
        if (testEval.score > currentEval.score && getHandCategory(testEval.score) > getHandCategory(currentEval.score)) {
            outs++;
            if (improvingCards.length < 5) {
                improvingCards.push(`${card.rank}${card.suit}`);
            }
        }
    });
    
    if (outs > 0) {
        const cardsTocome = 5 - boardCards.length;
        const probability = cardsTocome === 2 
            ? (1 - Math.pow((remainingDeck.length - outs) / remainingDeck.length, 2)) * 100
            : (outs / remainingDeck.length) * 100;
        
        return `
            <div class="outs-info">
                <strong>${outs} outs</strong> · ${probability.toFixed(1)}% melhora
                <div style="font-size: 0.85em; color: #aaa; margin-top: 5px;">${improvingCards.join(' ')}</div>
            </div>
        `;
    }
    return '';
}

// Categoria da mão (para comparação de melhoria)
function getHandCategory(score) {
    if (score >= 9000000) return 9;
    if (score >= 8000000) return 8;
    if (score >= 7000000) return 7;
    if (score >= 6000000) return 6;
    if (score >= 5000000) return 5;
    if (score >= 4000000) return 4;
    if (score >= 3000000) return 3;
    if (score >= 2000000) return 2;
    if (score >= 1000000) return 1;
    return 0;
}
