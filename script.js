const screen = document.getElementById("screen")
const start = document.getElementById("start")
const overlay = document.getElementById("overlay")
const overlaytext = document.getElementById("overlaytext")

const boat = document.getElementById("boat")
const gobutton = document.getElementById("gobutton");
const rules = document.getElementById("rules");
const togglerules = document.getElementById("togglerules");
const error = document.getElementById("errorb")
    
const BOAT_LEFT_X = 105;
const BOAT_RIGHT_X = 211;
const BOAT_CAPACITY = 2;
const charIds = ['m1','m2','m3','c1','c2','c3'];

let gameRunning = false;
let passengers = [];
let moving = false;
let errorTimer = null;

let gameWon = false;
let gameOver = false;
let moveCount = 0;   

function renderGame() {
    console.log("Game Loaded");
    updateMoveCounter();
}

function getCharacterCounts() {
    let leftMissionaries = 0;
    let leftCannibals = 0;
    let rightMissionaries = 0;
    let rightCannibals = 0;

    const boatSide = currentBoatSide();

    charIds.forEach(id => {
        const ch = document.getElementById(id);
        const side = ch.dataset.side || 'right'; 
        const type = ch.dataset.type;
        
        let actualSide = side;
        if (side === 'boat') {
            actualSide = boatSide;
        }
        
        if (actualSide === 'left') {
            if (type === 'M') leftMissionaries++;
            else if (type === 'C') leftCannibals++;
        } else if (actualSide === 'right') {
            if (type === 'M') rightMissionaries++;
            else if (type === 'C') rightCannibals++;
        }
    });

    return {
        left: { missionaries: leftMissionaries, cannibals: leftCannibals },
        right: { missionaries: rightMissionaries, cannibals: rightCannibals }
    };
}

function isValidMove(fromSide, toSide, missionariesMoving, cannibalsMoving) {
    const counts = getCharacterCounts();
    
    const newCounts = {
        left: { missionaries: counts.left.missionaries, cannibals: counts.left.cannibals },
        right: { missionaries: counts.right.missionaries, cannibals: counts.right.cannibals }
    };
    
    newCounts[fromSide].missionaries -= missionariesMoving;
    newCounts[fromSide].cannibals -= cannibalsMoving;
    
    newCounts[toSide].missionaries += missionariesMoving;
    newCounts[toSide].cannibals += cannibalsMoving;
    
    if (newCounts.left.missionaries > 0 && newCounts.left.cannibals > newCounts.left.missionaries) {
        return false;
    }
    
    if (newCounts.right.missionaries > 0 && newCounts.right.cannibals > newCounts.right.missionaries) {
        return false;
    }
    
    return true;
}

function checkWinCondition() {
    const counts = getCharacterCounts();
    return counts.left.missionaries === 3 && counts.left.cannibals === 3;
}

function handleGameOver() {
    gameOver = true;
    overlay.classList.remove("overlay-hidden");
    overlaytext.textContent = "Game Over! The cannibals ate the missionaries!";
    overlaytext.style.color = "#CC5555";
    overlay.style.textAlign = "center";

    setTimeout(() => {
        overlay.classList.add("overlay-hidden");
        overlaytext.style.color = "white";
        resetGame();
    }, 4000);
}

function handleVictory() {
    gameWon = true;
    overlay.classList.remove("overlay-hidden");
    overlaytext.textContent = `Victory in ${moveCount} moves!`;
    overlaytext.style.color = "#009966";
    
    setTimeout(() => {
        overlay.classList.add("overlay-hidden");
        overlaytext.style.color = "white";
        resetGame();
    }, 4000);
}

function updateMoveCounter() {
    let moveCounter = document.getElementById('moveCounter');
    if (!moveCounter) {
        moveCounter = document.createElement('div');
        moveCounter.id = 'moveCounter';
        
        moveCounter.style.position = 'absolute';
        moveCounter.style.top = '10px';
        moveCounter.style.left = '10px';
        moveCounter.style.color = 'white';
        moveCounter.style.fontFamily = 'Arial, sans-serif';
        moveCounter.style.fontSize = '12px';
        moveCounter.style.fontWeight = 'bold';
        moveCounter.style.backgroundColor = 'rgba(0,0,0,0.7)';
        moveCounter.style.padding = '4px 8px';
        moveCounter.style.borderRadius = '4px';
        moveCounter.style.zIndex = '25';
        
        screen.appendChild(moveCounter);
    }
    
    moveCounter.textContent = `Moves: ${moveCount}`;
}


function resetGame() {
    gameWon = false;
    gameOver = false;
    moveCount = 0;
    resetPositions();
    updateMoveCounter();
}

function startGame() {
    gameRunning = true;
    start.textContent = "Stop";

    overlay.classList.remove("overlay-hidden");
    overlaytext.textContent="Loading...";

    setTimeout(() => {
        overlay.classList.add("overlay-hidden");
        renderGame();
    }, 2500);   
}

function stopGame() {
    gameRunning = false;
    start.textContent ="Start";

    overlay.classList.remove("overlay-hidden");
    overlaytext.textContent="Shutting Down...";

    setTimeout(() => {
        overlaytext.textContent = "";
        resetPositions();
    }, 2500);
}

start.addEventListener("click", () => {
    if (!gameRunning) startGame();
    else stopGame();
});

function showError (msg,duration = 2500) {
    if (!error) return; 
    error.textContent = msg;
    error.classList.add('errorb-show');

    if(errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
        error.classList.remove('errorb-show');
        errorTimer = null;
    }, duration);

}


function currentBoatSide() {
    const ds = boat.dataset.side;
    if (ds && ds !== "moving") return ds;
    const leftPx = parseInt(window.getComputedStyle(boat).left,10) || 0;
    return Math.abs(leftPx - BOAT_RIGHT_X) < 20 ? "right" : "left";
}



function moveElementSmooth(el, newParent, finalLeftPx, finalTopPx, cb) {
    const startRect = el.getBoundingClientRect();

    el.style.transition = '';
    el.style.willChange = 'transform, left, top';

    newParent.appendChild(el);

    el.style.position = 'absolute';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = finalLeftPx + 'px';
    el.style.top = finalTopPx + 'px';

    const endRect = el.getBoundingClientRect();
    const dx = startRect.left - endRect.left;
    const dy = startRect.top - endRect.top;

    const isFlipped = el.classList.contains("flipped");
    el.style.transform = `translate(${dx}px, ${dy}px)${isFlipped ? " scaleX(-1)" : ""}`;

    void el.offsetWidth;

    el.style.transition = 'transform 300ms ease';
    requestAnimationFrame(() => (el.style.transform = ""));

    el.addEventListener('transitionend', function handler() {
        el.style.transition = "";
        el.style.transform = "";
        el.removeEventListener('transitionend', handler);
        if (cb) cb();
    }, 
    { once: true });
}

function getcharID(id) {
    return document.getElementById(id);
}

function getSeatforPassengerindex(i) {
    if (i === 0) return {left: 10,  top: -20};
    if (i === 1) return {left: 35,  top: -20};
    return {left:15 , top: -20};
}

const SLOTS = 6;
const TOTAL_SLOTS = 6;
const LEFT_OFFSET = -3;
const RIGHT_OFFSET = -27;
const GAP_X = 15;
const GAP_Y = 10;
const BASE = 100;

function SlotCords(side , slotIndex, elementWidth = 25) {
    const col = slotIndex;
    const row = 0;
    const finalTop = screen.clientHeight - (BASE + row * GAP_Y);
    if (side === "left") {
        const finalLeft = LEFT_OFFSET + col * GAP_X;
        return { left: finalLeft, top: finalTop};
    } else {
        const colRight = (SLOTS - 1) - col;
        const finalLeft = screen.clientWidth - (RIGHT_OFFSET + colRight * GAP_X) - elementWidth;
        return { left: finalLeft, top: finalTop};
    }
}

const STATIC_SLOT_INDEX = {
    left: { m1: 0, m2: 1, m3: 2, c1: 3, c2: 4, c3: 5},
    right: { m1: 0, m2: 1, m3: 2, c1: 3, c2: 4, c3: 5},
};

function getStaticSlotIndexfor(ch, side) {
    const map = STATIC_SLOT_INDEX[side] || {};
    return map[ch.id] ?? 0;
}


function boardCharacter(ch) {
    if (moving) return;
    if (gameOver || gameWon) return;
    
    if(passengers.length >= BOAT_CAPACITY) {
        showError("Boat is full" , 2000);
        return;
    }

    const chSide = ch.dataset.side || 'right';
    if(chSide !== currentBoatSide()) {
        showError("Boat is on the other bank", 2000);
        return;
    }

    const seatIndex = passengers.length;
    const seat = getSeatforPassengerindex(seatIndex);
    
    passengers.push(ch);
    
    moveElementSmooth(ch, boat, seat.left, seat.top,() => {
        ch.dataset.side = 'boat';
        delete ch.dataset.slot;
    });
}

function disembarkCharacter(ch) {
    if (moving) return;
    if (gameOver || gameWon) return;
    
    const targetSide = currentBoatSide();

    const slotIndex = getStaticSlotIndexfor(ch, targetSide);
    const elementWidth = ch.getBoundingClientRect().width || 25;
    const cords = SlotCords(targetSide, slotIndex, elementWidth);

    moveElementSmooth(ch, screen, cords.left, cords.top, () => {
        ch.dataset.side = targetSide;
        ch.dataset.slot = String(slotIndex);
        if (ch.dataset.type === "C") {
            if (targetSide === "left") ch.classList.add("flipped");
            else ch.classList.remove("flipped");
        }
        const i = passengers.indexOf(ch);
        if (i >= 0) passengers.splice(i,1);
    });
}


function makeCharClickable(id) {
    const ch = getcharID(id);
    ch.addEventListener('click', () => {
        if (moving) return;
        const side = ch.dataset.side || 'right';
        if (side === 'boat') {
            disembarkCharacter(ch);
        } else {
            boardCharacter(ch);
        }
    });
}

function sailBoat() {
    if (moving) return;
    if (gameOver || gameWon) return;
    
    if (passengers.length < 1) {
        showError("Minimum one person to cross", 2500);
        return;
    }

    const currentSide = currentBoatSide();
    const targetSide = currentSide === 'left' ? 'right' : 'left';
    const targetX = targetSide === 'left' ? BOAT_LEFT_X : BOAT_RIGHT_X;

    moving = true;
    boat.style.left = targetX + "px";
    boat.dataset.side = 'moving';
    moveCount++;
    updateMoveCounter();

    const onArrive = () => {
        boat.dataset.side = targetSide;
        moving = false;
        boat.removeEventListener('transitionend', onArrive);
        
        setTimeout(() => {
            if (checkWinCondition()) {
                handleVictory();
            } else {
                const counts = getCharacterCounts();
                const leftInvalid = counts.left.missionaries > 0 && counts.left.cannibals > counts.left.missionaries;
                const rightInvalid = counts.right.missionaries > 0 && counts.right.cannibals > counts.right.missionaries;
              
                if (leftInvalid || rightInvalid) {
                    handleGameOver();
                }
            }
        }, 100);
    };
    boat.addEventListener('transitionend', onArrive);
}

gobutton.addEventListener('click', sailBoat);

function resetPositions() {
    boat.style.left = BOAT_RIGHT_X + "px";
    boat.dataset.side = 'right';
    
    passengers = [];
    moving = false;
    gameWon = false;
    gameOver = false;
    moveCount = 0;

    charIds.forEach(id => {
        const ch = getcharID(id);
        const screenW = screen.clientWidth;
        const elW = ch.getBoundingClientRect().width || 25;
        const slotIndex = getStaticSlotIndexfor(ch, "right");
        const cords = SlotCords("right", slotIndex, elW);

        screen.appendChild(ch);
        ch.style.position = 'absolute';
        ch.style.right = 'auto';
        ch.style.bottom = 'auto';
        ch.style.left = cords.left + 'px';
        ch.style.top = cords.top + 'px';
        

        ch.dataset.side = 'right';
        ch.dataset.slot = String(slotIndex);
        
        if (ch.dataset.type === "C") ch.classList.remove("flipped");
    });
    
    updateMoveCounter();
}

charIds.forEach(makeCharClickable);

document.addEventListener("DOMContentLoaded", () =>  {
    resetPositions();

    gobutton.addEventListener("click" , () => {
        rules.style.display ="none";
        togglerules.style.display ="inline";
        togglerules.setAttribute("title","Show Rules");
    });

    togglerules.addEventListener("click", () => {
        if(rules.style.display === "none") {
            rules.style.display = "block";
            togglerules.setAttribute("title","Hide Rules");
        } else {
            rules.style.display = "none";
            togglerules.setAttribute("title","Show Rules");
        }
    });


    const restart = document.querySelector(".restart");
    restart.addEventListener("click", () => {
        overlay.classList.add("overlay-hidden");
        overlaytext.style.color = "white";
        resetPositions();
    });
});