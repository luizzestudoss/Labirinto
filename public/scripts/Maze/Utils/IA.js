function aStar(grid, start, end) {
    if (!isValidCoordinate(grid, start) || !isValidCoordinate(grid, end)) {
        return [];
    }

    let openSet = [];
    let closedSet = [];
    let cameFrom = new Map();

    let startNode = grid[start.x][start.y];
    let endNode = grid[end.x][end.y];

    openSet.push(startNode);

    let gScore = new Map();
    gScore.set(startNode, 0);

    let fScore = new Map();
    fScore.set(startNode, heuristic(startNode, endNode));

    while (openSet.length > 0) {
        let current = openSet.reduce((a, b) => (fScore.get(a) < fScore.get(b) ? a : b));

        if (current === endNode) {
            return reconstructPath(cameFrom, current);
        }

        openSet = openSet.filter(node => node !== current);
        closedSet.push(current);

        for (let neighbor of current.getNeighbors(grid)) {
            if (closedSet.includes(neighbor)) continue;

            let tentativeGScore = gScore.get(current) + 1;

            if (!openSet.includes(neighbor)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= gScore.get(neighbor)) {
                continue;
            }

            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentativeGScore);
            fScore.set(neighbor, gScore.get(neighbor) + heuristic(neighbor, endNode));
        }
    }

    return [];
}

function isValidCoordinate(grid, node) {
    return node.x >= 0 && node.x < grid.length && node.y >= 0 && node.y < grid[0].length;
}

function heuristic(nodeA, nodeB) {
    if (!nodeB) {
        return 0;
    }
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
}


function reconstructPath(cameFrom, current) {
    let totalPath = [current];
    while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        totalPath.unshift(current);
    }
    return totalPath;
}