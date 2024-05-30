document.getElementById('startGame').addEventListener('click', () => {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const mines = parseInt(document.getElementById('mines').value);

    if (isNaN(rows) || isNaN(cols) || isNaN(mines) || rows <= 0 || cols <= 0 || mines <= 0) {
        alert('有効な数値を入力してください。');
        return;
    }

    fetch('server.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rows, cols, mines })
    })
        .then(response => response.json())
        .then(data => createGameBoard(data))
        .catch(error => console.error('Error:', error));
});

function createGameBoard(data) {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = '';   //毎回削除
    gameContainer.style.gridTemplateRows = `repeat(${data.rows}, 30px)`;
    gameContainer.style.gridTemplateColumns = `repeat(${data.cols}, 30px)`;

    data.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.row = rowIndex;
            cellElement.dataset.col = colIndex;
            cellElement.addEventListener('click', () => {
                openCell(cellElement);
            });
            cellElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(cellElement);
            });
            gameContainer.appendChild(cellElement);
        });
    });
}

function toggleFlag(cellElement) {
    if (cellElement.classList.contains('flag')) {
        cellElement.classList.remove('flag');
    } else {
        cellElement.classList.add('flag');
    }
}

function openCell(cellElement) {
    const row = cellElement.dataset.row;
    const col = cellElement.dataset.col;

    fetch('server.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'open', row, col })
    })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'mine') {
                showAllMines(data.board);
                alert('Game Over!!');
                document.getElementById('startGame').disabled = false;
            } else if (data.result === 'clear') {
                updateCells(data.openedCells);
                alert('Game Clear!');
                document.getElementById('startGame').disabled = false;
            } else {
                updateCells(data.openedCells);
            }
        })
        .catch(error => console.error('Error:', error));
}

function updateCells(openedCells) {
    openedCells.forEach(cell => {
        const cellElement = document.querySelector(`[data-row='${cell.row}'][data-col='${cell.col}']`);
        cellElement.classList.add('open');
        if (cell.adjacentMines > 0) {
            cellElement.classList.add('number');
            cellElement.textContent = cell.adjacentMines;
        }
    });
}

function showAllMines(board) {
    board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell === 'M') {
                const cellElement = document.querySelector(`[data-row='${rowIndex}'][data-col='${colIndex}']`);
                cellElement.classList.add('mine');
            }
        });
    });
}
