<?php
session_start();

$request = json_decode(file_get_contents('php://input'), true);

if (isset($request['rows']) && isset($request['cols']) && isset($request['mines'])) {
    initializeGame($request['rows'], $request['cols'], $request['mines']);
} elseif (isset($request['action']) && $request['action'] === 'open') {
    openCell($request['row'], $request['col']);
} elseif (isset($request['action']) && $request['action'] === 'flag') {
    toggleFlag($request['row'], $request['col'], $request['isFlagged']);
}

function initializeGame($rows, $cols, $mines)
{
    $board = createEmptyBoard($rows, $cols);
    $_SESSION['board'] = $board;
    $_SESSION['rows'] = $rows;
    $_SESSION['cols'] = $cols;
    $_SESSION['mines'] = $mines;
    $_SESSION['opened'] = createEmptyBoard($rows, $cols);
    $_SESSION['openedCount'] = 0;
    $_SESSION['first'] = true;
    $_SESSION['flagged'] = createEmptyBoard($rows, $cols);
    echo json_encode(['board' => $board, 'rows' => $rows, 'cols' => $cols]);
}

function createEmptyBoard($rows, $cols)
{
    return array_fill(0, $rows, array_fill(0, $cols, 0));
}

function putMines(&$board, $rows, $cols, $mines, $safeRow, $safeCol)
{
    $minePositions = [];

    while (count($minePositions) < $mines) {
        $position = [rand(0, $rows - 1), rand(0, $cols - 1)];
        if (!in_array($position, $minePositions) && !($position[0] == $safeRow && $position[1] == $safeCol)) {
            $minePositions[] = $position;
            $board[$position[0]][$position[1]] = 'M';
        }
    }

    foreach ($minePositions as $position) {
        calculatorMines($board, $position[0], $position[1]);
    }

    $_SESSION['board'] = $board;
}

function calculatorMines(&$board, $row, $col)
{
    for ($i = $row - 1; $i <= $row + 1; $i++) {
        for ($j = $col - 1; $j <= $col + 1; $j++) {
            if (isset($board[$i][$j]) && $board[$i][$j] !== 'M') {
                $board[$i][$j]++;
            }
        }
    }
}

function openCell($row, $col)
{
    $board = $_SESSION['board'];
    $opened = &$_SESSION['opened'];
    $flagged = &$_SESSION['flagged'];
    $rows = $_SESSION['rows'];
    $cols = $_SESSION['cols'];
    $mines = $_SESSION['mines'];
    $openedCount = &$_SESSION['openedCount'];
    $first = $_SESSION['first'];

    if ($first) {
        putMines($board, $rows, $cols, $mines, $row, $col);
        $_SESSION['first'] = false;
    }

    // フラグが立っている場合、セルを開かない
    // if ($flagged[$row][$col]) {
    //     echo json_encode(['result' => 'flagged', 'flagged' => $flagged]);
    //     return;
    // }

    if ($board[$row][$col] === 'M') {
        echo json_encode(['result' => 'mine', 'board' => $board]);
        session_destroy();
        return;
    }

    // 自動採掘の初回処理
    if ($opened[$row][$col] && flagAroundCells($board, $row, $col) == $board[$row][$col]) {
        $openedCells = [];
        for ($i = max(0, $row - 1); $i <= min($rows - 1, $row + 1); $i++) {
            for ($j = max(0, $col - 1); $j <= min($cols - 1, $col + 1); $j++) {
                if ($i === $row && $j === $col || $flagged[$i][$j]) {
                    continue;
                } else if ($board[$i][$j] === 'M') {
                    echo json_encode(['result' => 'mine', 'board' => $board]);
                    session_destroy();
                    return;
                } else {
                    $opened[$i][$j] = true;
                    $openedCells[] = ['row' => $i, 'col' => $j, 'aroundMines' => $board[$i][$j]];
                    $openedCount++;
                    openAroundCells($board, $opened, $i, $j, $openedCells, $openedCount);
                }
            }
        }
        echo json_encode(['result' => 'safe', 'openedCells' => $openedCells]);
        return;
    }

    $openedCells = [];
    openAroundCells($board, $opened, $row, $col, $openedCells, $openedCount);
    if ($openedCount === $rows * $cols - $mines) {
        echo json_encode(['result' => 'clear', 'openedCells' => $openedCells]);
        session_destroy();
    } else {
        echo json_encode(['result' => 'safe', 'openedCells' => $openedCells]);
    }
}




function openAroundCells($board, &$opened, $row, $col, &$openedCells, &$openedCount)
{
    if (!isset($board[$row][$col]) || $opened[$row][$col]) {
        return;
    }

    // セルがまだ開かれていない場合のみカウントを増やす
    $opened[$row][$col] = true;
    $openedCells[] = ['row' => $row, 'col' => $col, 'aroundMines' => $board[$row][$col]];
    $openedCount++;

    if ($board[$row][$col] === 0) {
        for ($i = $row - 1; $i <= $row + 1; $i++) {
            for ($j = $col - 1; $j <= $col + 1; $j++) {
                if ($i === $row && $j === $col) continue;
                openAroundCells($board, $opened, $i, $j, $openedCells, $openedCount);
            }
        }
    }
}

function flagAroundCells($board, $row, $col)
{
    $flagged = &$_SESSION['flagged'];
    $rows = $_SESSION['rows'];
    $cols = $_SESSION['cols'];
    $count = 0;

    for ($i = $row - 1; $i <= $row + 1; $i++) {
        for ($j = $col - 1; $j <= $col + 1; $j++) {
            if (isset($board[$i][$j]) && $flagged[$i][$j]) {
                $count++;
            }
        }
    }
    return $count;
}

function toggleFlag($row, $col, $isFlagged)
{
    $flagged = &$_SESSION['flagged'];
    $flagged[$row][$col] = $isFlagged;
    if ($isFlagged) {
        echo json_encode(['result' => 'flagged', 'flagged' => $flagged]);
    } else {
        echo json_encode(['result' => 'unflagged', 'flagged' => $flagged]);
    }
}
