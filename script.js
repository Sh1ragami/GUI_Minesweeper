// START GAMEボタンのクリックイベントを追加
document.getElementById('startGame').addEventListener('click', startGame);

function startGame() {
    var rows = parseInt(document.getElementById('rows').value);
    var cols = parseInt(document.getElementById('cols').value);
    var mines = parseInt(document.getElementById('mines').value);

    if (rows <= 0 || cols <= 0 || mines <= 0 || mines >= rows * cols) {
        alert('有効な数値を入力してください。');
        return;
    }

    alert('操作説明\n　左クリック：採掘\n　右クリック：フラグ');

    const navElements = document.getElementsByTagName('nav');
    if (navElements.length > 0) {
        const nav = navElements[0];

        nav.innerHTML = '';
        const reStartButton = document.createElement('button');
        reStartButton.id = 'backMenu';
        reStartButton.textContent = '戻る';

        nav.appendChild(reStartButton);

        reStartButton.addEventListener('click', () => {
            const gameContainer = document.getElementById('gameContainer');
            gameContainer.innerHTML = '';
            gameContainer.removeAttribute('style');

            createMenuBoard();

            // backMenuボタンを押した後、startGameボタンを有効にする
            document.getElementById('startGame').disabled = false;
            // backMenuボタンを押した後にクリックイベントを再度追加
            document.getElementById('startGame').addEventListener('click', startGame);
            return;
        });

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

    // START GAMEボタンのクリックイベントを削除
    document.getElementById('startGame').removeEventListener('click', startGame);
}

function createGameBoard(data) {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = '';
    gameContainer.style.gridTemplateRows = `repeat(${data.rows}, 30px)`;
    gameContainer.style.gridTemplateColumns = `repeat(${data.cols}, 30px)`;

    data.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.row = rowIndex;
            cellElement.dataset.col = colIndex;

            cellElement.addEventListener('click', () => {
                const audio = new Audio('audio/sound.mp3');
                audio.currentTime = 0;
                audio.play();
                openCell(cellElement, true);
            });
            cellElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const audio = new Audio('audio/sound.mp3');
                audio.currentTime = 0;
                audio.play();
                toggleFlag(cellElement);
            });
            gameContainer.appendChild(cellElement);
        });
    });
}

function toggleFlag(cellElement) {
    cellElement.classList.toggle('flag');
}

function openCell(cellElement, isFirstClick = false) {
    const row = cellElement.dataset.row;
    const col = cellElement.dataset.col;

    fetch('server.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'open', row, col, isFirstClick })
    })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'mine') {
                showAllMines(data.board);
                alert('GAME OVER!!');
                document.getElementById('startGame').disabled = false;
            } else if (data.result === 'clear') {
                updateCells(data.openedCells);
                alert('GAME CLEAR!');
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
        cellElement.classList.add('open', `number${cell.aroundMines}`);
        if (cell.aroundMines > 0) {
            cellElement.textContent = cell.aroundMines;
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

function createMenuBoard() {
    const nav = document.getElementsByTagName('nav')[0];
    nav.innerHTML = '';

    // div.property要素を作成
    const propertyDiv = document.createElement('div');
    propertyDiv.className = 'property';

    // 行数のラベルと入力フィールドを作成
    const rowsLabel = document.createElement('label');
    rowsLabel.setAttribute('for', 'rows');
    rowsLabel.textContent = '行数:';
    const rowsInput = document.createElement('input');
    rowsInput.type = 'number';
    rowsInput.id = 'rows';
    rowsInput.name = 'rows';
    rowsInput.min = '1';
    rowsInput.value = '10';
    rowsInput.required = true;

    // 列数のラベルと入力フィールドを作成
    const colsLabel = document.createElement('label');
    colsLabel.setAttribute('for', 'cols');
    colsLabel.textContent = '列数:';
    const colsInput = document.createElement('input');
    colsInput.type = 'number';
    colsInput.id = 'cols';
    colsInput.name = 'cols';
    colsInput.min = '1';
    colsInput.value = '10';
    colsInput.required = true;

    // 地雷数のラベルと入力フィールドを作成
    const minesLabel = document.createElement('label');
    minesLabel.setAttribute('for', 'mines');
    minesLabel.textContent = '地雷数:';
    const minesInput = document.createElement('input');
    minesInput.type = 'number';
    minesInput.id = 'mines';
    minesInput.name = 'mines';
    minesInput.min = '1';
    minesInput.value = '10';
    minesInput.required = true;

    // 各入力フィールドとラベルをdiv.propertyに追加
    propertyDiv.appendChild(rowsLabel);
    propertyDiv.appendChild(rowsInput);
    propertyDiv.appendChild(document.createElement('br'));
    propertyDiv.appendChild(colsLabel);
    propertyDiv.appendChild(colsInput);
    propertyDiv.appendChild(document.createElement('br'));
    propertyDiv.appendChild(minesLabel);
    propertyDiv.appendChild(minesInput);

    // div.propertyをnavに追加
    nav.appendChild(propertyDiv);

    // START GAMEボタンを作成してnavに追加
    const startGameButton = document.createElement('button');
    startGameButton.id = 'startGame';
    startGameButton.textContent = 'START GAME';
    nav.appendChild(document.createElement('br'));
    nav.appendChild(startGameButton);
}
