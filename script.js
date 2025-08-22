class LadderGame {
    constructor() {
        this.players = [];
        this.prizes = [];
        this.gameStarted = false;
        this.selectedPlayer = null;
        this.rungs = [];
    }

    generateLadder(playerCount) {
        this.clearLadder();
        const count = playerCount;
        this.players = this.generatePlayerNames(count);
        this.prizes = this.generatePrizeNames(count);
        this.drawLadder();
        this.enableStartButton();
    }

    generatePlayerNames(count) {
        return Array.from({ length: count }, (_, i) => `참가자${i + 1}`);
    }

    generatePrizeNames(count) {
        return Array.from({ length: count }, (_, i) => `상품${i + 1}`);
    }

    drawLadder() {
        const ladderContainer = document.getElementById('ladder');
        ladderContainer.innerHTML = '';

        const containerWidth = ladderContainer.offsetWidth;
        const containerHeight = 300;
        const playerCount = this.players.length;
        const spacing = containerWidth / (playerCount + 1);
        const startX = spacing;

        for (let i = 0; i < playerCount; i++) {
            const line = document.createElement('div');
            line.className = 'ladder-line vertical';
            line.style.left = `${startX + i * spacing - 2}px`;
            line.style.top = '60px';
            line.style.height = `${containerHeight - 120}px`;
            ladderContainer.appendChild(line);
        }

        this.players.forEach((player, index) => {
            const el = document.createElement('div');
            el.className = 'player';
            el.textContent = player;
            el.style.left = `${startX + index * spacing - 30}px`;
            el.style.top = '0px';
            el.onclick = () => this.onPlayerClick(index);
            el.ondblclick = () => this.makeEditable(el, 'player', index);
            ladderContainer.appendChild(el);
        });

        this.prizes.forEach((prize, index) => {
            const el = document.createElement('div');
            el.className = 'prize';
            el.textContent = prize;
            el.style.left = `${startX + index * spacing - 30}px`;
            el.style.top = `${containerHeight - 60}px`;
            el.ondblclick = () => this.makeEditable(el, 'prize', index);
            ladderContainer.appendChild(el);
        });

        this.generateAndDrawRungs(startX, spacing, containerHeight);
    }

    generateAndDrawRungs(startX, spacing, containerHeight) {
        const playerCount = this.players.length;
        const rungCount = playerCount * 2;
        const rungs = [];
        const rungHeight = (containerHeight - 160) / (rungCount + 1);

        for (let i = 0; i < rungCount; i++) {
            const y = 80 + rungHeight * (i + 1);
            let lastRungCol = -2;
            for (let j = 0; j < playerCount - 1; j++) {
                if (j > lastRungCol && Math.random() > 0.6) {
                    rungs.push({ y, col: j });
                    lastRungCol = j + 1;
                }
            }
        }

        const gaps = Array(playerCount - 1).fill(false);
        rungs.forEach(rung => { gaps[rung.col] = true; });

        for (let i = 0; i < gaps.length; i++) {
            if (!gaps[i]) {
                let placed = false;
                for (let k = 0; k < rungCount * 2; k++) {
                    const y = 80 + rungHeight * (Math.floor(Math.random() * rungCount) + 1);
                    const collision = rungs.some(r => r.y === y && (r.col === i || r.col === i - 1 || r.col === i + 1));
                    if (!collision) {
                        rungs.push({ y, col: i });
                        placed = true;
                        break;
                    }
                }
                if (!placed) rungs.push({ y: 80 + rungHeight * (Math.floor(Math.random() * rungCount) + 1), col: i });
            }
        }
        
        this.rungs = rungs.sort((a, b) => a.y - b.y);

        this.rungs.forEach(({ y, col }) => {
            const line = document.createElement('div');
            line.className = 'ladder-line horizontal hidden';
            line.style.top = `${y}px`;
            line.style.left = `${startX + col * spacing}px`;
            line.style.width = `${spacing}px`;
            document.getElementById('ladder').appendChild(line);
        });
    }

    onPlayerClick(index) {
        if (!this.gameStarted) {
            if (this.selectedPlayer !== null) {
                document.querySelectorAll('.player')[this.selectedPlayer].classList.remove('selected');
            }
            this.selectedPlayer = index;
            document.querySelectorAll('.player')[index].classList.add('selected');
            return;
        }

        document.querySelectorAll('.path-trace').forEach(el => el.remove());
        document.querySelectorAll('.player, .prize').forEach(el => el.classList.remove('highlight'));
        this.hideResult();
        document.getElementById('showAllResults').style.display = 'none';
        document.getElementById('showAllResults').disabled = false;

        const result = this.calculateResult(index);
        this.animatePath(result);
    }

    makeEditable(element, type, index) {
        element.setAttribute('contenteditable', 'true');
        element.classList.add('editing');
        element.focus();
        const originalText = element.textContent;
        const save = () => {
            element.setAttribute('contenteditable', 'false');
            element.classList.remove('editing');
            const newText = element.textContent.trim();
            if (newText && newText !== originalText) {
                if (type === 'player') this.players[index] = newText;
                else this.prizes[index] = newText;
            } else {
                element.textContent = originalText;
            }
        };
        element.onblur = save;
        element.onkeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); element.blur(); }
            else if (e.key === 'Escape') { element.textContent = originalText; element.blur(); }
        };
    }

    startGame() {
        document.querySelectorAll('.ladder-line.horizontal.hidden').forEach(line => {
            line.classList.remove('hidden');
        });
        this.gameStarted = true;
        document.getElementById('startGame').style.display = 'none';
    }

    calculateResult(playerIndex) {
        let currentIndex = playerIndex;
        this.rungs.forEach(rung => {
            if (rung.col === currentIndex) currentIndex++;
            else if (rung.col === currentIndex - 1) currentIndex--;
        });
        return { playerIndex, prizeIndex: currentIndex, player: this.players[playerIndex], prize: this.prizes[currentIndex] };
    }

    getRealPath(playerIndex) {
        const path = [];
        let currentX = playerIndex;
        let currentY = 60;

        for (const rung of this.rungs) {
            if (rung.y <= currentY) continue;

            if (rung.col === currentX || rung.col === currentX - 1) {
                path.push({ type: 'V', x: currentX, y1: currentY, y2: rung.y });
                currentY = rung.y;

                if (rung.col === currentX) {
                    path.push({ type: 'H', y: rung.y, x1: currentX, x2: currentX + 1 });
                    currentX++;
                } else {
                    path.push({ type: 'H', y: rung.y, x1: currentX, x2: currentX - 1 });
                    currentX--;
                }
            }
        }
        path.push({ type: 'V', x: currentX, y1: currentY, y2: 300 - 60 });
        return path;
    }

    animatePath(result) {
        const ladderContainer = document.getElementById('ladder');
        const pathSegments = this.getRealPath(result.playerIndex);
        let segmentIndex = 0;

        const animateSegment = () => {
            if (segmentIndex >= pathSegments.length) {
                this.completeGame(result);
                return;
            }

            const segment = pathSegments[segmentIndex];
            const pathElement = document.createElement('div');
            pathElement.className = 'path-trace';

            const containerWidth = ladderContainer.offsetWidth;
            const playerCount = this.players.length;
            const spacing = containerWidth / (playerCount + 1);
            const startX = spacing;
            let durationMs = 0;

            if (segment.type === 'V') {
                durationMs = (segment.y2 - segment.y1) * 4;
                pathElement.style.left = `${startX + segment.x * spacing - 2}px`;
                pathElement.style.top = `${segment.y1}px`;
                pathElement.style.width = '4px';
                pathElement.style.height = '0px';
                pathElement.style.transition = `height ${durationMs / 1000}s linear`;
            } else { // 'H'
                durationMs = spacing * 4;
                pathElement.style.left = `${startX + Math.min(segment.x1, segment.x2) * spacing}px`;
                pathElement.style.top = `${segment.y - 2}px`;
                pathElement.style.width = `${spacing}px`;
                pathElement.style.height = '4px';
                pathElement.style.transition = `transform ${durationMs / 1000}s linear`;
                pathElement.style.transformOrigin = (segment.x2 > segment.x1) ? 'left' : 'right';
                pathElement.style.transform = 'scaleX(0)';
            }

            ladderContainer.appendChild(pathElement);

            requestAnimationFrame(() => {
                if (segment.type === 'V') {
                    pathElement.style.height = `${segment.y2 - segment.y1}px`;
                } else {
                    pathElement.style.transform = 'none';
                }
            });

            segmentIndex++;
            setTimeout(animateSegment, durationMs);
        };

        animateSegment();
    }
    
    completeGame(result) {
        this.showResult(result);
        this.highlightResult(result);
        document.getElementById('showAllResults').style.display = 'inline-block';
    }

    showResult(result) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<h3>🎉 게임 결과 🎉</h3><p><strong>${result.player}</strong> 님은 <strong>${result.prize}</strong>!</p>`;
        resultDiv.classList.add('show');
    }

    showAllResults() {
        const resultDiv = document.getElementById('result');
        let resultsHTML = '<h3>🎉 전체 게임 결과 🎉</h3><ul class="result-list">';

        for (let i = 0; i < this.players.length; i++) {
            const result = this.calculateResult(i);
            resultsHTML += `<li><span>${result.player}</span> ➔ <span>${result.prize}</span></li>`;
        }
        resultsHTML += '</ul>';
        resultDiv.innerHTML = resultsHTML;
        resultDiv.classList.add('show');

        document.querySelectorAll('.path-trace').forEach(el => el.remove());
        document.querySelectorAll('.player, .prize').forEach(el => el.classList.remove('highlight'));

        for (let i = 0; i < this.players.length; i++) {
            document.querySelectorAll('.player')[i].classList.add('highlight');
            const result = this.calculateResult(i);
            document.querySelectorAll('.prize')[result.prizeIndex].classList.add('highlight');
        }

        document.getElementById('showAllResults').disabled = true;
    }

    highlightResult(result) {
        document.querySelectorAll('.player')[result.playerIndex].classList.add('highlight');
        document.querySelectorAll('.prize')[result.prizeIndex].classList.add('highlight');
    }

    clearLadder() {
        const ladderContainer = document.getElementById('ladder');
        ladderContainer.innerHTML = '';
        this.gameStarted = false;
        this.selectedPlayer = null;
        this.hideResult();
        document.querySelectorAll('.player, .prize').forEach(el => el.classList.remove('highlight'));
        document.getElementById('showAllResults').style.display = 'none';
        document.getElementById('showAllResults').disabled = false;
        document.getElementById('startGame').style.display = 'inline-block';
    }

    hideResult() {
        const resultDiv = document.getElementById('result');
        resultDiv.classList.remove('show');
    }

    enableStartButton() {
        document.getElementById('startGame').disabled = false;
    }

    resetGame() {
        this.clearLadder();
        generateLadder();
    }
}

// 전역 게임 인스턴스
const game = new LadderGame();

// 전역 함수들
function generateLadder() {
    const playerCount = parseInt(document.getElementById('playerCount').value);
    
    if (playerCount < 2) {
        alert('참가자는 2명 이상이어야 합니다.');
        return;
    }
    
    game.generateLadder(playerCount);
}



function startGame() {
    game.startGame();
}

function resetGame() {
    game.resetGame();
}

// 페이지 로드 시 초기화
window.addEventListener('load', () => {
    // 기본 사다리 생성
    generateLadder();
});
