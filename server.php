<?php
session_start();

$request = json_decode(file_get_contents('php://input'), true);

if (isset($request['rows']) && isset($request['cols']) && isset($request['mines'])) {
    initializeGame($request['rows'], $request['cols'], $request['mines']);
} elseif (isset($request['action']) && $request['action'] === 'open') {
    openCell($request['row'], $request['col']);
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
    $rows = $_SESSION['rows'];
    $cols = $_SESSION['cols'];
    $mines = $_SESSION['mines'];
    $openedCount = &$_SESSION['openedCount'];
    $first = $_SESSION['first'];

    if ($first) {
        putMines($board, $rows, $cols, $mines, $row, $col);
        $_SESSION['first'] = false;
    }

    if ($board[$row][$col] === 'M') {
        echo json_encode(['result' => 'mine', 'board' => $board]);
        session_destroy();
        return;
    }

    $openedCells = [];
    openAroundCells($board, $opened, $row, $col, $openedCells, $openedCount, true);
    if ($openedCount === $rows * $cols - $mines) {
        echo json_encode(['result' => 'clear', 'openedCells' => $openedCells]);
        session_destroy();
    } else {
        echo json_encode(['result' => 'safe', 'openedCells' => $openedCells]);
    }
}

function openAroundCells($board, &$opened, $row, $col, &$openedCells, &$openedCount, $firstFlag)
{
    if (!isset($board[$row][$col]) || $opened[$row][$col]) {
        return;
    }
    $opened[$row][$col] = true;
    $openedCells[] = ['row' => $row, 'col' => $col, 'aroundMines' => $board[$row][$col]];
    $openedCount++;
    if ($board[$row][$col] === 0 || $board[$row][$col] == flagAroundCells() && $firstFlag) {
        for ($i = $row - 1; $i <= $row + 1; $i++) {
            for ($j = $col - 1; $j <= $col + 1; $j++) {
                if ($i === $row && $j === $col) continue;
                openAroundCells($board, $opened, $i, $j, $openedCells, $openedCount, false);
            }
        }
    }
}

function flagAroundCells()
{
}
