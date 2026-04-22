\<\!DOCTYPE html\>  
\<html lang="en"\>  
\<head\>  
    \<meta charset="UTF-8"\>  
    \<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"\>  
    \<title\>Dungeon of 12 Doors\</title\>  
    \<style\>  
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P\&display=swap');

        body, html {  
            margin: 0;  
            padding: 0;  
            width: 100%;  
            height: 100%;  
            background-color: \#000;  
            overflow: hidden;  
            font-family: 'Press Start 2P', monospace;  
            user-select: none;  
            \-webkit-user-select: none;  
        }

        \#game-container {  
            position: relative;  
            width: 100%;  
            height: 100%;  
            display: flex;  
            justify-content: center;  
            align-items: center;  
        }

        canvas {  
            image-rendering: \-moz-crisp-edges;  
            image-rendering: \-webkit-crisp-edges;  
            image-rendering: pixelated;  
            image-rendering: crisp-edges;  
            width: 100% \!important;  
            height: 100% \!important;  
        }

        \#crt-overlay {  
            position: absolute;  
            top: 0;  
            left: 0;  
            width: 100%;  
            height: 100%;  
            background: linear-gradient(rgba(18, 16, 16, 0\) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));  
            background-size: 100% 4px, 3px 100%;  
            pointer-events: none;  
            z-index: 10;  
        }

        \#ui-layer {  
            position: absolute;  
            top: 0;  
            left: 0;  
            width: 100%;  
            height: 100%;  
            z-index: 20;  
            pointer-events: none;  
            display: flex;  
            flex-direction: column;  
            justify-content: space-between;  
            padding: 20px;  
            box-sizing: border-box;  
            color: \#fff;  
            text-shadow: 2px 2px 0 \#000;  
        }

        \#hud {  
            display: flex;  
            justify-content: space-between;  
            font-size: 16px;  
            color: \#ffaa00;  
            width: 100%;  
            box-sizing: border-box;  
        }

        \#crosshair {  
            position: absolute;  
            top: 50%;  
            left: 50%;  
            transform: translate(-50%, \-50%);  
            color: rgba(255, 255, 255, 0.5);  
            font-size: 12px;  
            pointer-events: none;  
        }

        \#door-indicator {  
            position: absolute;  
            top: 60px;  
            left: 50%;  
            transform: translateX(-50%);  
            background-color: rgba(0, 0, 0, 0.8);  
            color: \#ffaa00;  
            border: 2px solid \#ffaa00;  
            padding: 10px 20px;  
            font-size: 14px;  
            z-index: 25;  
            transition: opacity 0.2s;  
            text-align: center;  
            white-space: nowrap;  
        }

        \#action-buttons {  
            position: absolute;  
            bottom: 20px;  
            left: 20px;  
            display: flex;  
            gap: 10px;  
            z-index: 35;  
        }

        .action-btn {  
            font-family: 'Press Start 2P', monospace;  
            background-color: \#333;  
            color: \#fff;  
            border: 4px solid \#fff;  
            padding: 10px 15px;  
            font-size: 20px;  
            cursor: pointer;  
            pointer-events: auto;  
            transition: background-color 0.2s;  
        }

        .action-btn:hover {  
            background-color: \#555;  
        }

        .screen {  
            position: absolute;  
            top: 0;  
            left: 0;  
            width: 100%;  
            height: 100%;  
            background-color: rgba(0, 0, 0, 0.9);  
            display: flex;  
            flex-direction: column;  
            justify-content: center;  
            align-items: center;  
            z-index: 45;  
            pointer-events: auto;  
            text-align: center;  
            transition: opacity 0.5s;  
            padding: 20px;  
            box-sizing: border-box;  
        }

        .hidden {  
            opacity: 0;  
            pointer-events: none \!important;  
        }

        h1 {  
            color: \#ff5555;  
            font-size: 32px;  
            margin-bottom: 20px;  
            line-height: 1.5;  
        }

        p {  
            font-size: 12px;  
            line-height: 2;  
            max-width: 600px;  
            margin-bottom: 30px;  
            color: \#aaa;  
        }

        button.main-btn {  
            font-family: 'Press Start 2P', monospace;  
            background-color: \#333;  
            color: \#fff;  
            border: 4px solid \#fff;  
            padding: 15px 30px;  
            font-size: 16px;  
            cursor: pointer;  
            transition: background-color 0.2s;  
        }

        button.main-btn:hover {  
            background-color: \#555;  
        }

        \#flash {  
            position: absolute;  
            top: 0;  
            left: 0;  
            width: 100%;  
            height: 100%;  
            background-color: \#ff0000;  
            opacity: 0;  
            z-index: 25;  
            pointer-events: none;  
            transition: opacity 0.1s;  
        }

        .modal {  
            position: absolute;  
            top: 50%;  
            left: 50%;  
            transform: translate(-50%, \-50%);  
            width: 80%;  
            max-width: 500px;  
            max-height: 90vh;  
            overflow-y: auto;  
            background-color: \#f4e8d1;  
            border: 4px solid \#4a3b2c;  
            color: \#1a0f00;  
            padding: 30px;  
            box-sizing: border-box;  
            z-index: 40;  
            text-align: center;  
            box-shadow: 10px 10px 0px rgba(0,0,0,0.7);  
            display: flex;  
            flex-direction: column;  
            gap: 20px;  
            font-family: 'Press Start 2P', monospace;  
            line-height: 1.8;  
            transition: opacity 0.3s, transform 0.3s;  
            pointer-events: auto;  
        }

        /\* Customize scrollbar for modals \*/  
        .modal::-webkit-scrollbar { width: 8px; }  
        .modal::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }  
        .modal::-webkit-scrollbar-thumb { background: \#4a3b2c; border-radius: 4px; }

        \#note-text {  
            font-size: 12px;  
        }

        .note-dual {  
            display: flex;  
            flex-direction: column;  
            gap: 15px;  
        }

        .note-half {  
            border: 2px dashed \#4a3b2c;  
            padding: 15px;  
            background-color: rgba(0,0,0,0.05);  
        }

        .rules-table {  
            width: 100%;  
            border-collapse: collapse;  
            font-size: 10px;  
            text-align: left;  
            line-height: 1.4;  
        }

        .rules-table th, .rules-table td {  
            border: 2px solid \#4a3b2c;  
            padding: 8px;  
        }

        \#card-canvas {  
            background-color: \#e8dbbc;  
            border: 2px solid \#4a3b2c;  
            width: 100%;  
            max-width: 300px;  
            height: auto;  
            aspect-ratio: 3/2;  
            margin: 0 auto;  
        }

        .card-nav {  
            display: flex;  
            justify-content: space-between;  
            align-items: center;  
            margin-top: 10px;  
        }

        .close-modal-btn {  
            background-color: \#4a3b2c;  
            color: \#f4e8d1;  
            border: 2px solid \#1a0f00;  
            font-size: 12px;  
            align-self: center;  
        }

        .close-modal-btn:hover {  
            background-color: \#6d4c41;  
        }

        /\* \--- MOBILE RESPONSIVE QUERIES \--- \*/  
        @media (max-width: 600px) {  
            h1 { font-size: 20px; margin-bottom: 10px; }  
            p { font-size: 10px; padding: 0 10px; line-height: 1.5; margin-bottom: 20px; }  
            button.main-btn { font-size: 12px; padding: 12px 20px; }  
              
            \#hud { font-size: 10px; padding: 15px 20px; top: 0; left: 0; position: absolute; }  
              
            \#action-buttons {   
                bottom: 15px;   
                left: 50%;   
                transform: translateX(-50%);   
                flex-direction: row;   
                gap: 15px;   
                justify-content: center;   
                width: max-content;   
            }  
            .action-btn { padding: 12px 15px; font-size: 18px; }  
              
            .modal { width: 95%; padding: 15px; gap: 15px; }  
            .rules-table { font-size: 8px; }  
            .rules-table th, .rules-table td { padding: 5px; }  
              
            \#door-indicator { top: 45px; font-size: 10px; padding: 8px 15px; }  
              
            .card-nav { flex-wrap: wrap; justify-content: center; gap: 10px; }  
            .close-modal-btn { padding: 10px 16px; font-size: 10px; }  
        }

        /\* \--- LANDSCAPE MOBILE FIXES \--- \*/  
        @media (max-height: 450px) {  
            h1 { font-size: 16px; margin-bottom: 10px; }  
            p { font-size: 9px; margin-bottom: 10px; }  
            button.main-btn { padding: 8px 16px; font-size: 10px; }  
              
            .modal { padding: 10px; gap: 10px; max-height: 95vh; }  
            \#card-canvas { max-width: 200px; }  
              
            .rules-table { font-size: 8px; }  
            .rules-table th, .rules-table td { padding: 3px; }  
              
            \#action-buttons { bottom: 10px; gap: 10px; }  
            .action-btn { padding: 8px 12px; font-size: 14px; }  
              
            \#hud { padding: 10px; }  
            \#door-indicator { top: 30px; font-size: 10px; }  
              
            \#note-text { font-size: 10px; }  
            .note-half { padding: 8px; }  
        }  
    \</style\>  
    \<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"\>\</script\>  
\</head\>  
\<body\>

\<div id="game-container"\>  
    \<div id="crt-overlay"\>\</div\>  
    \<div id="flash"\>\</div\>

    \<div id="ui-layer"\>  
        \<div id="hud" class="hidden"\>  
            \<span id="stage-display"\>STAGE: 0/12\</span\>  
            \<span id="timer-display"\>TIME: 00:00\</span\>  
        \</div\>  
        \<div id="crosshair" class="hidden"\>+\</div\>  
        \<div id="door-indicator" class="hidden"\>ENTERING DOOR...\</div\>  
          
        \<div id="action-buttons" class="hidden"\>  
            \<button class="action-btn" id="toggle-note-btn" title="View Note"\>📜\</button\>  
            \<button class="action-btn" id="toggle-rules-btn" title="View Rules"\>📖\</button\>  
            \<button class="action-btn" id="toggle-cards-btn" title="View Anomaly Card"\>🃏\</button\>  
        \</div\>  
    \</div\>

    \<\!-- Modals \--\>  
    \<div id="note-screen" class="modal hidden"\>  
        \<div id="note-text"\>Placeholder riddle text goes here.\</div\>  
        \<button class="action-btn close-modal-btn"\>LOWER PAPER\</button\>  
    \</div\>

    \<div id="rules-screen" class="modal hidden"\>  
        \<h2 style="font-size: 14px; margin: 0;"\>ANOMALY RULES\</h2\>  
        \<table class="rules-table"\>  
            \<tr\>\<th\>Count\</th\>\<th\>Rule Applied\</th\>\</tr\>  
            \<tr\>\<td\>0\</td\>\<td\>Trust the note.\</td\>\</tr\>  
            \<tr\>\<td\>1\</td\>\<td\>Choose the opposite door.\</td\>\</tr\>  
            \<tr\>\<td\>2\</td\>\<td\>Trust the note.\</td\>\</tr\>  
            \<tr\>\<td\>3\</td\>\<td\>Choose the opposite door.\</td\>\</tr\>  
            \<tr\>\<td\>4\</td\>\<td\>Anything BUT door 1.\</td\>\</tr\>  
            \<tr\>\<td\>5\</td\>\<td\>Choose the door you chose in stage 1.\</td\>\</tr\>  
            \<tr\>\<td\>6\</td\>\<td\>Always choose door 3.\</td\>\</tr\>  
        \</table\>  
        \<button class="action-btn close-modal-btn"\>CLOSE\</button\>  
    \</div\>

    \<div id="cards-screen" class="modal hidden"\>  
        \<h2 id="card-page-title" style="font-size: 14px; margin: 0;"\>PAGE 1/6: DOTS\</h2\>  
        \<canvas id="card-canvas" width="300" height="200"\>\</canvas\>  
        \<div class="card-nav"\>  
            \<button class="action-btn" id="card-prev-btn"\>\&lt;\</button\>  
            \<button class="action-btn close-modal-btn"\>CLOSE\</button\>  
            \<button class="action-btn" id="card-next-btn"\>\&gt;\</button\>  
        \</div\>  
    \</div\>

    \<div id="start-screen" class="screen"\>  
        \<h1\>THE 12 DOORS\</h1\>  
        \<p\>You hold a single torch in the dark.\<br\>\<br\>Before you lie doors.\<br\>Only one leads forward.\<br\>Trust the note, but verify the cards.\<br\>Choose wrong, and the dungeon resets.\</p\>  
        \<button id="start-btn" class="main-btn"\>ENTER DUNGEON\</button\>  
    \</div\>

    \<div id="win-screen" class="screen hidden"\>  
        \<h1 style="color: \#00ff00;"\>ESCAPE\!\</h1\>  
        \<p\>You have navigated the 12 doors and found the exit.\<br\>\<br\>Your answer is: AvadaKedavraMrAsylbi\</p\>  
        \<button id="play-again-btn" class="main-btn"\>PLAY AGAIN\</button\>  
    \</div\>  
\</div\>

\<script\>  
    const AudioSys \= {  
        ctx: null,  
        init: function() {  
            window.AudioContext \= window.AudioContext || window.webkitAudioContext;  
            this.ctx \= new AudioContext();  
        },  
        playTone: function(freq, type, duration, vol=0.1) {  
            if(\!this.ctx) return;  
            const osc \= this.ctx.createOscillator();  
            const gain \= this.ctx.createGain();  
            osc.type \= type;  
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);  
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);  
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime \+ duration);  
            osc.connect(gain);  
            gain.connect(this.ctx.destination);  
            osc.start();  
            osc.stop(this.ctx.currentTime \+ duration);  
        },  
        playNoise: function(duration, vol=0.2) {  
            if(\!this.ctx) return;  
            const bufferSize \= this.ctx.sampleRate \* duration;  
            const buffer \= this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);  
            const data \= buffer.getChannelData(0);  
            for (let i \= 0; i \< bufferSize; i++) { data\[i\] \= Math.random() \* 2 \- 1; }  
            const noise \= this.ctx.createBufferSource();  
            noise.buffer \= buffer;  
            const gain \= this.ctx.createGain();  
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);  
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime \+ duration);  
            const filter \= this.ctx.createBiquadFilter();  
            filter.type \= 'lowpass';  
            filter.frequency.value \= 1000;  
            noise.connect(filter);  
            filter.connect(gain);  
            gain.connect(this.ctx.destination);  
            noise.start();  
        },  
        soundStart: function() {  
            this.playTone(440, 'square', 0.1);  
            setTimeout(() \=\> this.playTone(660, 'square', 0.2), 100);  
        },  
        soundCorrect: function() {  
            this.playTone(523.25, 'square', 0.1, 0.05);   
            setTimeout(() \=\> this.playTone(659.25, 'square', 0.1, 0.05), 100);   
            setTimeout(() \=\> this.playTone(783.99, 'square', 0.2, 0.05), 200);   
        },  
        soundWrong: function() {  
            this.playNoise(0.5, 0.5);  
            this.playTone(150, 'sawtooth', 0.5, 0.2);  
            setTimeout(() \=\> this.playTone(100, 'sawtooth', 0.5, 0.2), 100);  
        },  
        soundStep: function() {  
            this.playNoise(0.1, 0.05);  
        }  
    };

    function createPixelTexture(width, height, baseColor, type='noise') {  
        const canvas \= document.createElement('canvas');  
        canvas.width \= width; canvas.height \= height;  
        const ctx \= canvas.getContext('2d');  
        ctx.fillStyle \= baseColor; ctx.fillRect(0, 0, width, height);  
          
        if (type \=== 'brick') {  
            const brickWidth \= width / 4; const brickHeight \= height / 8;  
            ctx.fillStyle \= 'rgba(0,0,0,0.5)';  
            for(let y=0; y\<height; y+=brickHeight) {  
                const offset \= (y/brickHeight)%2 \=== 0 ? 0 : brickWidth/2;  
                ctx.fillRect(0, y, width, 1);   
                for(let x=-offset; x\<width; x+=brickWidth) { ctx.fillRect(x, y, 1, brickHeight); }  
            }  
            for(let i=0; i\<width\*height; i++) {  
                if(Math.random() \< 0.3) {  
                    ctx.fillStyle \= Math.random() \> 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';  
                    ctx.fillRect(i % width, Math.floor(i / width), 1, 1);  
                }  
            }  
        } else if (type \=== 'wood') {  
            for(let x=0; x\<width; x++) {  
                ctx.fillStyle \= \`rgba(0,0,0,${Math.random() \* 0.2})\`;  
                ctx.fillRect(x, 0, 1, height);  
            }  
            ctx.fillStyle \= '\#1a0f00';  
            ctx.fillRect(0, 0, width, 4); ctx.fillRect(0, height-4, width, 4);  
            ctx.fillRect(0, 0, 4, height); ctx.fillRect(width-4, 0, 4, height);  
            ctx.fillStyle \= '\#ffd700'; ctx.fillRect(width \- 10, height / 2, 4, 8);  
        } else {  
            for(let i=0; i\<width\*height; i++) {  
                if(Math.random() \< 0.5) {  
                    ctx.fillStyle \= 'rgba(0,0,0,0.2)';  
                    ctx.fillRect(i % width, Math.floor(i / width), 1, 1);  
                }  
            }  
        }

        const tex \= new THREE.CanvasTexture(canvas);  
        tex.magFilter \= THREE.NearestFilter;  
        tex.minFilter \= THREE.NearestFilter;  
        tex.wrapS \= THREE.RepeatWrapping; tex.wrapT \= THREE.RepeatWrapping;  
        return tex;  
    }

    let scene, camera, renderer, torchLight, torchFlickerLight, torchModel;  
    let doors \= \[\], wallsGroup;  
    let raycaster, mouse \= new THREE.Vector2(), hoveredDoor \= null;  
      
    // State Tracking  
    let currentStage \= 0;  
    const TOTAL\_STAGES \= 13; // Stage 0 (tutorial) \+ 12 stages \= 13 total levels.  
    let isTransitioning \= false;  
    let isTurning \= false;  
    let currentModal \= null;  
    let gameState \= 'menu';  
    let baseRotationY \= 0;  
    let isFacingBack \= false;  
    let gameStartTime \= 0;  
    let isTimerRunning \= false;  
    let lastTimerSeconds \= \-1;  
    let actualCorrectDoors \= \[\];  
    let currentAnomalies \= {};  
    let currentCardPage \= 1;  
    let activeRunRiddles \= {};  
    let firstStageChoice \= 1; // Tracks the door chosen in stage 1

    // Special Events Tracking  
    let specialStage \= \-1;  
    let specialType \= \-1;  
    let specialTimerTimeout \= null;

    const PIXEL\_SCALE \= 4;

    // \--- RIDDLE TIERS FROM JSON \---  
    const tier1Riddles \= \[  
        { id: "T1\_01", note: "The heart beats on one side. You already know which.", answer: 1 },  
        { id: "T1\_02", note: "Every story has a beginning. You're standing in front of it.", answer: 1 },  
        { id: "T1\_03", note: "A river flows to the sea. But it starts at the source. Be the source.", answer: 1 },  
        { id: "T1\_04", note: "The first breath. The first cry. The first step. Always the first.", answer: 1 },  
        { id: "T1\_05", note: "The book opens. Where does the first word live?", answer: 1 },  
        { id: "T1\_06", note: "You read this note from left to right. You already chose a direction.", answer: 1 },  
        { id: "T1\_07", note: "The archer draws his bow. The arrow always starts from the same side. The bow hand.", answer: 1 },  
        { id: "T1\_08", note: "Before the middle, before the end. There was only me.", answer: 1 },  
        { id: "T1\_09", note: "Sinister. Look up what it means in Latin. That's your answer.", answer: 1 },  
        { id: "T1\_10", note: "The clock strikes nine. Picture where the hand points.", answer: 1 },  
        { id: "T1\_11", note: "Two wolves flank a sheep. You are the sheep. Stand where they can't reach you.", answer: 2 },  
        { id: "T1\_12", note: "The tightrope walker never looks down. He also never drifts to the sides.", answer: 2 },  
        { id: "T1\_13", note: "Kings sit between their guards. Not in front. Not behind. Between.", answer: 2 },  
        { id: "T1\_14", note: "I touch both walls but belong to neither.", answer: 2 },  
        { id: "T1\_15", note: "A bridge connects two cliffs. You don't stand on the cliffs. You stand on the bridge.", answer: 2 },  
        { id: "T1\_16", note: "Remove the first. Remove the last. I'm still here.", answer: 2 },  
        { id: "T1\_17", note: "The eye of the storm. Chaos on both sides. Peace in one place.", answer: 2 },  
        { id: "T1\_18", note: "Two magnets repel. You're the space between them.", answer: 2 },  
        { id: "T1\_19", note: "The spine of a book holds every page together. Find the spine.", answer: 2 },  
        { id: "T1\_20", note: "A sandwich is only as good as what's between the bread.", answer: 2 },  
        { id: "T1\_21", note: "Every race has a finish line. Nobody remembers the start.", answer: 3 },  
        { id: "T1\_22", note: "A sentence ends with a period. Find the period.", answer: 3 },  
        { id: "T1\_23", note: "The final word in an argument is the only one that matters.", answer: 3 },  
        { id: "T1\_24", note: "The curtain falls last. Be the curtain.", answer: 3 },  
        { id: "T1\_25", note: "The clock strikes three. Picture where the hand points.", answer: 3 },  
        { id: "T1\_26", note: "The last domino falls the hardest. Be the last domino.", answer: 3 },  
        { id: "T1\_27", note: "A story has a beginning and a middle. Nobody cares. They want the ending.", answer: 3 },  
        { id: "T1\_28", note: "The period at the end of this sentence is your answer.", answer: 3 },  
        { id: "T1\_29", note: "The anchor drops at the end of the chain. Find the anchor.", answer: 3 },  
        { id: "T1\_30", note: "What comes after second? Stand there.", answer: 3 }  
    \];

    const tier2Riddles \= \[  
        { id: "T2\_01", note: "I said RIGHT three times in this note. Right here. Right now. Right? Count the letters in the answer instead. It has four.", answer: 1 },  
        { id: "T2\_02", note: "The mirror swapped everything. What was right is now wrong. What was wrong is now the answer.", answer: 1 },  
        { id: "T2\_03", note: "Port side. If you don't know, you drown.", answer: 1 },  
        { id: "T2\_04", note: "I'll say it plainly: the answer is on the right side of this note. By right I mean correct. The correct side is the first.", answer: 1 },  
        { id: "T2\_05", note: "I speak in opposites. Always have. The answer is the third door.", answer: 1 },  
        { id: "T2\_06", note: "What's left when everything else is taken away? Read that again slowly.", answer: 1 },  
        { id: "T2\_07", note: "The sun sets somewhere. If you're facing north, you know which side.", answer: 1 },  
        { id: "T2\_08", note: "I'll count down: three, two, one. I stopped. Your door.", answer: 1 },  
        { id: "T2\_09", note: "The shield arm. The one that keeps you alive. Not the one that kills.", answer: 1 },  
        { id: "T2\_10", note: "Unscramble: T-E-F-L. You have five seconds.", answer: 1 },  
        { id: "T2\_11", note: "I tell you to go left. Then I tell you to go right. When I contradict myself, the truth is in neither.", answer: 2 },  
        { id: "T2\_12", note: "The first shall be last. The last shall be first. But the second? The second never moves.", answer: 2 },  
        { id: "T2\_13", note: "Two liars sit on either side of an honest man. The liars say door one. The liars also say door three. The honest man says nothing. He doesn't need to.", answer: 2 },  
        { id: "T2\_14", note: "You're looking for the answer. Stop looking. You're standing on it.", answer: 2 },  
        { id: "T2\_15", note: "The oldest trick: make you look left, make you look right. While you're distracted, the real answer sits untouched.", answer: 2 },  
        { id: "T2\_16", note: "This note is the bridge. One side is wrong. The other side is also wrong. Walk the bridge.", answer: 2 },  
        { id: "T2\_17", note: "Three prisoners in a row. The warden walks past the first. Walks past the last. Stops at one.", answer: 2 },  
        { id: "T2\_18", note: "The answer is hiding between two walls in this room. Not against them. Between them.", answer: 2 },  
        { id: "T2\_19", note: "One door screams. One door whispers. One door says nothing. Trust the silent one.", answer: 2 },  
        { id: "T2\_20", note: "A coin has two sides. You are neither. You are the edge.", answer: 2 },  
        { id: "T2\_21", note: "What is the opposite of wrong? Now stop thinking about directions.", answer: 3 },  
        { id: "T2\_22", note: "I wrote LEFT on the wall. Then I crossed it out. Then I crossed out the crossing. Then I crossed out everything. What's left is nothing. Pick what's RIGHT.", answer: 3 },  
        { id: "T2\_23", note: "The final act. The closing scene. The credits roll. You know where endings live.", answer: 3 },  
        { id: "T2\_24", note: "First is fool's gold. Second is fool's silver. Only the third is real.", answer: 3 },  
        { id: "T2\_25", note: "What comes after second? Don't overthink it.", answer: 3 },  
        { id: "T2\_26", note: "Everyone picks the middle. That's why the middle is where I put the trap.", answer: 3 },  
        { id: "T2\_27", note: "Every queue has someone at the back. No one is behind them. Be that person.", answer: 3 },  
        { id: "T2\_28", note: "Podium. Bronze. You know where third place stands.", answer: 3 },  
        { id: "T2\_29", note: "I put the poison on the left. I put the poison in the middle. Draw your own conclusion.", answer: 3 },  
        { id: "T2\_30", note: "The punchline always comes at the end. This riddle is a joke. Find the punchline.", answer: 3 }  
    \];

    const tier3Riddles \= \[  
        { id: "T3\_01", note: "RIGHT. RIGHT. RIGHT. I can't stop saying it. But the answer has four letters, not five.", answer: 1 },  
        { id: "T3\_02", note: "You've been walking forward this whole time. The answer has always been at the start. Go back to the beginning.", answer: 1 },  
        { id: "T3\_03", note: "The note you're reading right now — which direction did your eyes start from?", answer: 1 },  
        { id: "T3\_04", note: "Sinister means evil now. It didn't always. Ask the Romans what it used to mean.", answer: 1 },  
        { id: "T3\_05", note: "I'll be honest for once. The answer is the third door. And that was a lie.", answer: 1 },  
        { id: "T3\_06", note: "I crossed out the answer. Then I crossed out the crossing. The original still stands. It was the first door.", answer: 1 },  
        { id: "T3\_07", note: "Three cups, one ball. Ball starts in the middle. I swap middle and right. I swap right and left. Where's the ball?", answer: 1 },  
        { id: "T3\_08", note: "Face south. The sun rises in the east. Point to it.", answer: 1 },  
        { id: "T3\_09", note: "The word WRONG and the word RIGHT both have five letters. The answer does not have five letters.", answer: 1 },  
        { id: "T3\_10", note: "Every instinct tells you to move forward. Your instincts are why you're still in this dungeon. The answer was behind every door you've already passed.", answer: 1 },  
        { id: "T3\_11", note: "I put the trap on the left. Then I put a trap on the right. I ran out of traps.", answer: 2 },  
        { id: "T3\_12", note: "The pendulum has swung both ways. It stopped. Where does a pendulum stop?", answer: 2 },  
        { id: "T3\_13", note: "You think you need to pick a side. That's exactly what I want you to think.", answer: 2 },  
        { id: "T3\_14", note: "Neither the hero nor the villain. You're the narrator. You stand outside the story. You stand between.", answer: 2 },  
        { id: "T3\_15", note: "Everyone rushes to the extremes. The answer has been watching from the center this entire time.", answer: 2 },  
        { id: "T3\_16", note: "Two notes hang on the wall. One says door one. The other says door three. Both are mine. I never help you.", answer: 2 },  
        { id: "T3\_17", note: "A bullet passes through the first. Passes through the last. Lodges in one. Find the bullet.", answer: 2 },  
        { id: "T3\_18", note: "You've been choosing edges this whole time. The center has been watching. Patiently.", answer: 2 },  
        { id: "T3\_19", note: "The river splits around a rock. The water goes left. The water goes right. The rock goes nowhere. Be the rock.", answer: 2 },  
        { id: "T3\_20", note: "The question isn't which door. The question is which door I DIDN'T mention. I said left. I said right. What did I not say?", answer: 2 },  
        { id: "T3\_21", note: "What is the opposite of wrong? Now forget that word is also a direction. Too late. You already thought of it.", answer: 3 },  
        { id: "T3\_22", note: "This dungeon has twelve stages. Twelve divided by four. Your door.", answer: 3 },  
        { id: "T3\_23", note: "The executioner always stands at the end of the line. Today you are the executioner.", answer: 3 },  
        { id: "T3\_24", note: "You started on the left. You passed through the middle. There's only one place you haven't been.", answer: 3 },  
        { id: "T3\_25", note: "The last word of this sentence is everything.", answer: 3 },  
        { id: "T3\_26", note: "Two doors have already been kind to you in this dungeon. The third hasn't had its turn.", answer: 3 },  
        { id: "T3\_27", note: "I counted the letters in LEFT. Four. I counted the letters in MIDDLE. Six. I added them together. Ten. Then I subtracted seven. Your door.", answer: 3 },  
        { id: "T3\_28", note: "The curtain call. The final bow. The audience has already left. Only the stage remains.", answer: 3 },  
        { id: "T3\_29", note: "Every prisoner knows: the exit is at the end of the hallway. Always the end.", answer: 3 },  
        { id: "T3\_30", note: "This is the last riddle I'll ever write for you. Fitting that the answer is the last door.", answer: 3 }  
    \];

    const special1Notes \= \[  
        "Choose the door you chose in Stage 0.",  
        "Choose the door the previous player chose.",  
        "Choose the fourth door.",  
        "Choose the door that was never built."  
    \];

    const special3Notes \= \[  
        { a: "The answer is the first door.\\nI am certain.", b: "Ignore him. The answer is the last door.", ans: 1 }, // Door 2  
        { a: "Only the middle leads to safety.", b: "The middle is death. Choose the first.", ans: 2 }, // Door 3  
        { a: "Walk through the last door.", b: "Walk through the middle door.", ans: 0 }, // Door 1  
        { a: "I built the trap behind door one.", b: "I built the trap behind door two.", ans: 2 }, // Door 3  
        { a: "The second door has\\nalways been safe.", b: "The second door has never been\\nsafe. Choose the third.", ans: 0 }, // Door 1  
        { a: "The first and only answer is door three.", b: "Door three is a grave. Door one is the way.", ans: 1 } // Door 2  
    \];

    let matWall, matFloor, matCeil, matDoor;

    function init() {  
        const container \= document.getElementById('game-container');

        scene \= new THREE.Scene();  
        scene.background \= new THREE.Color(0x050505);  
        scene.fog \= new THREE.Fog(0x000000, 2, 22);

        camera \= new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);  
        camera.position.set(0, 1.6, 0);

        renderer \= new THREE.WebGLRenderer({ antialias: false });  
        renderer.setSize(window.innerWidth / PIXEL\_SCALE, window.innerHeight / PIXEL\_SCALE, false);   
        container.insertBefore(renderer.domElement, container.firstChild);

        raycaster \= new THREE.Raycaster();

        const texWall \= createPixelTexture(32, 32, '\#2a2a2a', 'brick');  
        texWall.repeat.set(4, 2);  
        matWall \= new THREE.MeshPhongMaterial({ map: texWall, shininess: 0 });

        const texFloor \= createPixelTexture(32, 32, '\#1a1a1a', 'noise');  
        texFloor.repeat.set(4, 4);  
        matFloor \= new THREE.MeshPhongMaterial({ map: texFloor, shininess: 0 });

        const texCeil \= createPixelTexture(32, 32, '\#0a0a0a', 'noise');  
        texCeil.repeat.set(4, 4);  
        matCeil \= new THREE.MeshPhongMaterial({ map: texCeil, shininess: 0 });

        const texDoor \= createPixelTexture(32, 64, '\#6d4c41', 'wood');  
        matDoor \= new THREE.MeshPhongMaterial({ map: texDoor, shininess: 15, emissive: 0x1a0f05 });

        setupTorch();  
        scene.add(new THREE.AmbientLight(0x333333));  
        buildRoomStructure();

        window.addEventListener('resize', onWindowResize, false);  
        document.addEventListener('mousemove', onMouseMove, false);

        document.addEventListener('mousedown', (e) \=\> {  
            if(shouldIgnoreEvent(e)) return;  
            handleInputDown(e.clientX, e.clientY);  
        });  
        document.addEventListener('mouseup', (e) \=\> {  
            if(shouldIgnoreEvent(e)) return;  
            handleInputUp(e.clientX, e.clientY);  
        });  
        document.addEventListener('touchstart', (e) \=\> {  
            if(shouldIgnoreEvent(e)) return;  
            handleInputDown(e.touches\[0\].clientX, e.touches\[0\].clientY);  
        }, {passive: false});  
        document.addEventListener('touchend', (e) \=\> {  
            if(shouldIgnoreEvent(e)) return;  
            handleInputUp(e.changedTouches\[0\].clientX, e.changedTouches\[0\].clientY);  
            e.preventDefault();  
        }, {passive: false});

        document.getElementById('start-btn').addEventListener('click', startGame);  
        document.getElementById('play-again-btn').addEventListener('click', startGame);  
          
        // Modals Toggles  
        document.getElementById('toggle-note-btn').addEventListener('click', (e) \=\> { e.stopPropagation(); toggleModal('note-screen'); });  
        document.getElementById('toggle-rules-btn').addEventListener('click', (e) \=\> { e.stopPropagation(); toggleModal('rules-screen'); });  
        document.getElementById('toggle-cards-btn').addEventListener('click', (e) \=\> { e.stopPropagation(); toggleModal('cards-screen'); });

        document.querySelectorAll('.close-modal-btn').forEach(btn \=\> {  
            btn.addEventListener('click', (e) \=\> {  
                e.stopPropagation();  
                closeAllModals();  
            });  
        });

        // Cards Pagination  
        document.getElementById('card-prev-btn').addEventListener('click', (e) \=\> {  
            e.stopPropagation();  
            if(currentCardPage \> 1\) { currentCardPage--; renderCardPage(); }  
        });  
        document.getElementById('card-next-btn').addEventListener('click', (e) \=\> {  
            e.stopPropagation();  
            if(currentCardPage \< 6\) { currentCardPage++; renderCardPage(); }  
        });

        animate();  
    }

    function setupTorch() {  
        torchLight \= new THREE.PointLight(0xffaa33, 1.5, 18);  
        torchLight.position.set(0, 0, \-1);  
        camera.add(torchLight);

        torchFlickerLight \= new THREE.PointLight(0xffdd66, 0.5, 5);  
        torchFlickerLight.position.set(0, 0, \-1);  
        camera.add(torchFlickerLight);

        torchModel \= new THREE.Group();  
        const handle \= new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0x4a3b2c }));  
        handle.position.y \= \-0.3;  
        torchModel.add(handle);

        const fire \= new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.8 }));  
        fire.position.y \= 0.1;  
        fire.name \= "fire";  
        torchModel.add(fire);

        torchModel.position.set(0.8, \-0.6, \-1.2);  
        torchModel.rotation.z \= \-0.2;  
        torchModel.rotation.x \= 0.2;  
        camera.add(torchModel);

        scene.add(camera);  
    }

    function buildRoomStructure() {  
        wallsGroup \= new THREE.Group();  
          
        const floorGeo \= new THREE.PlaneGeometry(24, 24);  
        const floor \= new THREE.Mesh(floorGeo, matFloor);  
        floor.rotation.x \= \-Math.PI / 2;  
        wallsGroup.add(floor);

        const ceilGeo \= new THREE.PlaneGeometry(24, 24);  
        const ceiling \= new THREE.Mesh(ceilGeo, matCeil);  
        ceiling.rotation.x \= Math.PI / 2;  
        ceiling.position.y \= 3;  
        wallsGroup.add(ceiling);

        const leftWall \= new THREE.Mesh(new THREE.PlaneGeometry(24, 3), matWall);  
        leftWall.rotation.y \= Math.PI / 2; leftWall.position.set(-6, 1.5, 0);  
        wallsGroup.add(leftWall);

        const rightWall \= new THREE.Mesh(new THREE.PlaneGeometry(24, 3), matWall);  
        rightWall.rotation.y \= \-Math.PI / 2; rightWall.position.set(6, 1.5, 0);  
        wallsGroup.add(rightWall);

        const backWall \= new THREE.Mesh(new THREE.PlaneGeometry(12, 3), matWall);  
        backWall.rotation.y \= Math.PI;   
        backWall.position.set(0, 1.5, 6.1);   
        wallsGroup.add(backWall);

        const frontWall \= new THREE.Mesh(new THREE.PlaneGeometry(12, 3), matWall);  
        frontWall.rotation.y \= 0;   
        frontWall.position.set(0, 1.5, \-6.1);   
        wallsGroup.add(frontWall);

        scene.add(wallsGroup);  
    }

    function getRandomVariant(pageNum) {  
        let prefix \= '';  
        if(pageNum===1) prefix='D'; if(pageNum===2) prefix='Di'; if(pageNum===3) prefix='C';  
        if(pageNum===4) prefix='P'; if(pageNum===5) prefix='S';  if(pageNum===6) prefix='Cl';  
        return prefix \+ (Math.floor(Math.random() \* 6\) \+ 1);  
    }

    function generateStage() {  
        doors.forEach(d \=\> scene.remove(d));  
        doors \= \[\];  
        if (specialTimerTimeout) clearTimeout(specialTimerTimeout);

        let riddleHTML \= "The paper is blank...";  
        currentAnomalies \= {}; // Defaults to 0 anomalies

        if (currentStage \=== 0\) {  
            actualCorrectDoors \= \[1\];  
            riddleHTML \= "STAGE 0\<br\>\<br\>Welcome to the dungeon.\<br\>Before you lie three doors.\<br\>Only one leads forward.\<br\>\<br\>For your first test, simply choose the center door.";  
        } else if (currentStage \=== specialStage) {  
            // \--- SPECIAL EVENT INITIATION \---  
            if (specialType \=== 1\) {  
                // Special 1: The Impossible Reference  
                let msg \= special1Notes\[Math.floor(Math.random() \* special1Notes.length)\];  
                riddleHTML \= \`STAGE ${currentStage}\<br\>\<br\>\` \+ msg;  
                actualCorrectDoors \= \[\]; // No doors are correct  
                specialTimerTimeout \= setTimeout(triggerSpecial1Win, 180000); // 3-minute hidden timer  
            } else if (specialType \=== 2\) {  
                // Special 2: The Reverse  
                riddleHTML \= \`STAGE ${currentStage}\<br\>\<br\>Three doors face you.\<br\>But you face them too.\<br\>Who is really in front?\`;  
                actualCorrectDoors \= \[3\]; // The 4th door behind  
            } else if (specialType \=== 3\) {  
                // Special 3: The Swap  
                let pair \= special3Notes\[Math.floor(Math.random() \* special3Notes.length)\];  
                riddleHTML \= \`\<div style="margin-bottom:10px;"\>STAGE ${currentStage}\</div\>  
                              \<div class="note-dual"\>  
                                  \<div class="note-half"\>${pair.a.replace(/\\n/g, '\<br\>')}\</div\>  
                                  \<div class="note-half"\>${pair.b.replace(/\\n/g, '\<br\>')}\</div\>  
                              \</div\>\`;  
                actualCorrectDoors \= \[pair.ans\];  
            }  
        } else {  
            // \--- STANDARD NORMAL EVENT \---  
            let riddle \= activeRunRiddles\[currentStage\];  
            // JSON sets answers to 1, 2, or 3\. Code uses 0, 1, or 2 index.  
            let intendedDoor \= riddle.answer \- 1;   
            riddleHTML \= \`STAGE ${currentStage}\<br\>\<br\>\` \+ riddle.note.replace(/\\n/g, '\<br\>');

            let anomalyCount \= 0;  
            if (currentStage \>= 2 && currentStage \<= 3\) anomalyCount \= Math.floor(Math.random() \* 2); // 0 or 1  
            else if (currentStage \>= 4 && currentStage \<= 6\) anomalyCount \= Math.floor(Math.random() \* 3\) \+ 1; // 1, 2, or 3  
            else if (currentStage \>= 7 && currentStage \<= 9\) anomalyCount \= Math.floor(Math.random() \* 3\) \+ 2; // 2, 3, or 4  
            else if (currentStage \>= 10\) anomalyCount \= Math.floor(Math.random() \* 3\) \+ 4; // 4, 5, or 6

            let pages \= \[1,2,3,4,5,6\].sort(() \=\> Math.random() \- 0.5);  
            for (let i=0; i\<anomalyCount; i++) {  
                currentAnomalies\[pages\[i\]\] \= getRandomVariant(pages\[i\]);  
            }

            if (anomalyCount \=== 0 || anomalyCount \=== 2\) {  
                actualCorrectDoors \= \[intendedDoor\];  
            } else if (anomalyCount \=== 1 || anomalyCount \=== 3\) {  
                if (intendedDoor \=== 0\) actualCorrectDoors \= \[2\];  
                else if (intendedDoor \=== 2\) actualCorrectDoors \= \[0\];  
                else actualCorrectDoors \= \[1\];  
            } else if (anomalyCount \=== 4\) {  
                actualCorrectDoors \= \[1, 2\];  
            } else if (anomalyCount \=== 5\) {  
                actualCorrectDoors \= \[firstStageChoice\];  
            } else if (anomalyCount \=== 6\) {  
                actualCorrectDoors \= \[2\];  
            }  
        }

        document.getElementById('note-text').innerHTML \= riddleHTML;

        let numDoors \= 3;  
        // The 4th door is strictly part of the environment ONLY for Special 2  
        if (currentStage \=== specialStage && specialType \=== 2\) {  
            numDoors \= 4;  
        }

        const doorPositions \= \[-3, 0, 3\]; 

        for(let i=0; i\<numDoors; i++) {  
            const door \= new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.2), matDoor.clone());  
              
            if (i \< 3\) {  
                door.position.set(doorPositions\[i\], 1.25, \-6);  
            } else {  
                door.position.set(0, 1.25, 6);  
                door.rotation.y \= Math.PI;  
            }  
              
            door.userData \= { isCorrect: actualCorrectDoors.includes(i), index: i };  
            scene.add(door);  
            doors.push(door);  
        }

        camera.position.set(0, 1.6, 0);  
        camera.rotation.set(0, 0, 0);  
        baseRotationY \= 0;  
        isFacingBack \= false;  
          
        // Show Stage 12 correctly before winning  
        document.getElementById('stage-display').innerText \= \`STAGE: ${currentStage}/12\`;  
    }

    function toggleModal(modalId) {  
        if (isTransitioning) return;  
          
        if (currentModal \=== modalId) {  
            closeAllModals();  
        } else {  
            closeAllModals();  
            document.getElementById(modalId).classList.remove('hidden');  
            currentModal \= modalId;  
              
            if (modalId \=== 'cards-screen') {  
                currentCardPage \= 1;  
                renderCardPage();  
            }  
        }  
    }

    function closeAllModals() {  
        document.getElementById('note-screen').classList.add('hidden');  
        document.getElementById('rules-screen').classList.add('hidden');  
        document.getElementById('cards-screen').classList.add('hidden');  
        currentModal \= null;  
    }

    // \--- CARDS RENDERING LOGIC \---  
    function renderCardPage() {  
        const titles \= \["DOTS", "DICE", "COMPASS", "PLAYING CARDS", "SYMBOLS", "CLOCK"\];  
        document.getElementById('card-page-title').innerText \= \`PAGE ${currentCardPage}/6: ${titles\[currentCardPage-1\]}\`;  
        const canvas \= document.getElementById('card-canvas');  
        const ctx \= canvas.getContext('2d');  
          
        ctx.fillStyle \= '\#e8dbbc';  
        ctx.fillRect(0, 0, canvas.width, canvas.height);  
          
        let variant \= currentAnomalies\[currentCardPage\] || 'default';  
          
        if (currentCardPage \=== 1\) drawDots(ctx, canvas, variant);  
        else if (currentCardPage \=== 2\) drawDice(ctx, canvas, variant);  
        else if (currentCardPage \=== 3\) drawCompass(ctx, canvas, variant);  
        else if (currentCardPage \=== 4\) drawPlayingCards(ctx, canvas, variant);  
        else if (currentCardPage \=== 5\) drawSymbols(ctx, canvas, variant);  
        else if (currentCardPage \=== 6\) drawClock(ctx, canvas, variant);  
    }

    function drawDots(ctx, canvas, variant) {  
        let colors \= \['\#22cc22', '\#cc2222', '\#2222cc', '\#aa22aa', '\#000000'\];  
        if(variant \=== 'D1') colors \= \['\#22cc22', '\#cc2222', '\#2222cc', '\#aa22aa', '\#22cc22'\];  
        else if(variant \=== 'D2') colors \= \['\#22cc22', '\#cc2222', '\#2222cc', '\#aa22aa'\];  
        else if(variant \=== 'D3') colors \= \['\#22cc22', '\#cc2222', '\#2222cc', '\#aa22aa', '\#000000', '\#cccc22'\];  
        else if(variant \=== 'D4') colors \= \['\#cc2222', '\#22cc22', '\#2222cc', '\#aa22aa', '\#000000'\];  
        else if(variant \=== 'D5') colors \= \['\#22cc22', '\#cc2222', '\#cc2222', '\#aa22aa', '\#000000'\];  
        else if(variant \=== 'D6') colors \= \['\#22cc22', '\#ffffff', '\#2222cc', '\#aa22aa', '\#000000'\];

        let spacing \= 40;  
        let startX \= canvas.width/2 \- ((colors.length-1)\*spacing)/2;  
        colors.forEach((c, i) \=\> {  
            ctx.fillStyle \= c;  
            ctx.beginPath();  
            ctx.arc(startX \+ i\*spacing, canvas.height/2, 12, 0, Math.PI\*2);  
            ctx.fill();  
            ctx.strokeStyle \= '\#000'; ctx.lineWidth \= 2; ctx.stroke();  
        });  
    }

    function drawDice(ctx, canvas, variant) {  
        let values \= \[2, 5, 1\];  
        if(variant \=== 'Di1') values \= \[2, 5, 7\];  
        if(variant \=== 'Di2') values \= \[2, 5, 5\];  
        if(variant \=== 'Di3') values \= \[2, 0, 1\];  
        if(variant \=== 'Di4') values \= \[2, 5, 1, 3\];  
        if(variant \=== 'Di5') values \= \[5, 2, 1\];  
        if(variant \=== 'Di6') values \= \[2, 5, 0\];

        let spacing \= 60;  
        let startX \= canvas.width/2 \- ((values.length-1)\*spacing)/2;  
        values.forEach((v, i) \=\> {  
            let cx \= startX \+ i\*spacing;  
            let cy \= canvas.height/2;  
              
            ctx.fillStyle \= '\#fff';  
            ctx.fillRect(cx-20, cy-20, 40, 40);  
            ctx.strokeStyle \= '\#000'; ctx.lineWidth \= 2; ctx.strokeRect(cx-20, cy-20, 40, 40);  
              
            ctx.fillStyle \= '\#000';  
            let dots \= \[\];  
            if(v===1) dots=\[\[0,0\]\];  
            if(v===2) dots=\[\[-10,-10\], \[10,10\]\];  
            if(v===3) dots=\[\[-10,-10\], \[0,0\], \[10,10\]\];  
            if(v===5) dots=\[\[-10,-10\], \[10,-10\], \[0,0\], \[-10,10\], \[10,10\]\];  
            if(v===7) dots=\[\[-10,-10\], \[10,-10\], \[0,-12\], \[0,0\], \[-10,10\], \[10,10\], \[0,12\]\]; // Distinct 7  
              
            dots.forEach(d \=\> {  
                ctx.beginPath(); ctx.arc(cx+d\[0\], cy+d\[1\], 3, 0, Math.PI\*2); ctx.fill();  
            });  
        });  
    }

    function drawCompass(ctx, canvas, variant) {  
        let labels \= {top:'N', bot:'S', right:'E', left:'W'};  
        let needleAngle \= \-Math.PI/2;   
        if(variant \=== 'C1') needleAngle \= 0;   
        if(variant \=== 'C2') needleAngle \= Math.PI/2;   
        if(variant \=== 'C3') labels.left \= 'E';  
        if(variant \=== 'C4') labels.right \= '';  
        if(variant \=== 'C5') needleAngle \= Math.PI;   
        if(variant \=== 'C6') labels.bot \= 'N';

        let cx \= canvas.width/2, cy \= canvas.height/2;  
        ctx.strokeStyle \= '\#000'; ctx.lineWidth \= 3;  
        ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI\*2); ctx.stroke();  
          
        ctx.fillStyle \= '\#000'; ctx.font \= '20px monospace'; ctx.textAlign \= 'center'; ctx.textBaseline \= 'middle';  
        ctx.fillText(labels.top, cx, cy \- 75);  
        ctx.fillText(labels.bot, cx, cy \+ 75);  
        ctx.fillText(labels.right, cx \+ 75, cy);  
        ctx.fillText(labels.left, cx \- 75, cy);

        // Needle  
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx \+ Math.cos(needleAngle)\*50, cy \+ Math.sin(needleAngle)\*50);  
        ctx.strokeStyle \= '\#cc2222'; ctx.lineWidth \= 4; ctx.stroke();  
        // Back of needle  
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx \- Math.cos(needleAngle)\*20, cy \- Math.sin(needleAngle)\*20);  
        ctx.strokeStyle \= '\#333'; ctx.lineWidth \= 4; ctx.stroke();  
    }

    function drawPlayingCards(ctx, canvas, variant) {  
        let cards \= \[ {val:'A', suit:'♠', c:'\#000'}, {val:'7', suit:'♥', c:'\#cc2222'}, {val:'K', suit:'♦', c:'\#cc2222'} \];  
        if(variant \=== 'P1') cards\[0\] \= {val:'A', suit:'♥', c:'\#cc2222'};  
        if(variant \=== 'P2') cards\[2\] \= {val:'A', suit:'♠', c:'\#000'};  
        if(variant \=== 'P3') cards\[1\] \= {val:'14', suit:'♥', c:'\#cc2222'};  
        if(variant \=== 'P4') cards\[1\] \= {val:'7', suit:'♠', c:'\#000'};  
        if(variant \=== 'P5') cards\[0\] \= 'down';  
        if(variant \=== 'P6') cards.push({val:'Q', suit:'♣', c:'\#000'});

        let spacing \= 60;  
        let startX \= canvas.width/2 \- ((cards.length-1)\*spacing)/2;  
        cards.forEach((card, i) \=\> {  
            let cx \= startX \+ i\*spacing;  
            let cy \= canvas.height/2;  
              
            ctx.fillStyle \= '\#fff'; ctx.fillRect(cx-25, cy-35, 50, 70);  
            ctx.strokeStyle \= '\#000'; ctx.lineWidth \= 2; ctx.strokeRect(cx-25, cy-35, 50, 70);

            if (card \=== 'down') {  
                ctx.fillStyle \= '\#55a'; ctx.fillRect(cx-20, cy-30, 40, 60);  
            } else {  
                ctx.fillStyle \= card.c;  
                ctx.font \= '16px monospace'; ctx.textAlign \= 'center'; ctx.textBaseline \= 'middle';  
                ctx.fillText(card.val, cx, cy \- 10);  
                ctx.font \= '24px Arial';   
                ctx.fillText(card.suit, cx, cy \+ 15);  
            }  
        });  
    }

    function drawSymbols(ctx, canvas, variant) {  
        let syms \= \['⬤', '▲', '■', '★'\];  
        if(variant \=== 'S1') syms \= \['⬤', '▲', '⬤', '★'\];  
        if(variant \=== 'S2') syms \= \['⬤', '▲', '★'\];  
        if(variant \=== 'S3') syms \= \['⬤', '▲', '■', '★', '◆'\];  
        if(variant \=== 'S4') syms \= \['▲', '⬤', '■', '★'\];  
        if(variant \=== 'S5') syms \= \['⬤', '▲', '■', '⬢'\];  
        if(variant \=== 'S6') syms \= \['⬤', '▲', '■', '■'\];

        let spacing \= 50;  
        let startX \= canvas.width/2 \- ((syms.length-1)\*spacing)/2;  
        syms.forEach((sym, i) \=\> {  
            let cx \= startX \+ i\*spacing;  
            let cy \= canvas.height/2;  
            ctx.fillStyle \= '\#000';  
            ctx.font \= '30px Arial'; ctx.textAlign \= 'center'; ctx.textBaseline \= 'middle';  
            ctx.fillText(sym, cx, cy);  
        });  
    }

    function drawClock(ctx, canvas, variant) {  
        let time \= 6;  
        let marks \= 12;  
        let hands \= 2;   
        if(variant \=== 'Cl1') time \= 9;  
        if(variant \=== 'Cl2') marks \= 10;  
        if(variant \=== 'Cl3') hands \= 3;  
        if(variant \=== 'Cl4') hands \= 1;  
        if(variant \=== 'Cl5') time \= 3;  
        if(variant \=== 'Cl6') marks \= 14;

        let cx \= canvas.width/2, cy \= canvas.height/2;  
        ctx.strokeStyle \= '\#000'; ctx.lineWidth \= 3;  
        ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI\*2); ctx.stroke();  
          
        ctx.lineWidth \= 2;  
        for(let i=0; i\<marks; i++) {  
            let angle \= (i \* Math.PI \* 2\) / marks;  
            ctx.beginPath();  
            ctx.moveTo(cx \+ Math.cos(angle)\*50, cy \+ Math.sin(angle)\*50);  
            ctx.lineTo(cx \+ Math.cos(angle)\*60, cy \+ Math.sin(angle)\*60);  
            ctx.stroke();  
        }  
          
        let hAngle \= (time / 12\) \* Math.PI \* 2 \- Math.PI/2;  
        if(hands \>= 1 || hands \=== 3\) {  
            ctx.lineWidth \= 4; ctx.beginPath();  
            ctx.moveTo(cx, cy); ctx.lineTo(cx \+ Math.cos(hAngle)\*35, cy \+ Math.sin(hAngle)\*35);  
            ctx.stroke();  
        }  
        if(hands \>= 2\) {  
            let mAngle \= \-Math.PI/2;   
            ctx.lineWidth \= 3; ctx.beginPath();  
            ctx.moveTo(cx, cy); ctx.lineTo(cx \+ Math.cos(mAngle)\*50, cy \+ Math.sin(mAngle)\*50);  
            ctx.stroke();  
        }  
        if(hands \=== 3\) {  
            let sAngle \= 0;   
            ctx.strokeStyle \= '\#cc2222'; ctx.lineWidth \= 1.5; ctx.beginPath();  
            ctx.moveTo(cx, cy); ctx.lineTo(cx \+ Math.cos(sAngle)\*55, cy \+ Math.sin(sAngle)\*55);  
            ctx.stroke();  
        }  
    }  
    // \----------------------------

    function startGame() {  
        if(\!AudioSys.ctx) AudioSys.init();  
        AudioSys.soundStart();

        if (specialTimerTimeout) clearTimeout(specialTimerTimeout);

        currentStage \= 0;  
          
        // Pick special event rules  
        specialStage \= Math.floor(Math.random() \* 4\) \+ 7; // Random stage between 7 and 10  
        specialType \= Math.floor(Math.random() \* 3\) \+ 1;  // Random type between 1 and 3  
          
        gameState \= 'playing';  
        isTransitioning \= false;  
        closeAllModals();  
        gameStartTime \= Date.now();  
        isTimerRunning \= true;  
        lastTimerSeconds \= \-1;  
        firstStageChoice \= 1; // Reset memory tracker

        // Initialize active run riddles logic as specified in JSON  
        activeRunRiddles \= {};  
        const t1 \= \[...tier1Riddles\].sort(() \=\> Math.random() \- 0.5).slice(0, 4);  
        const t2 \= \[...tier2Riddles\].sort(() \=\> Math.random() \- 0.5).slice(0, 4);  
        const t3 \= \[...tier3Riddles\].sort(() \=\> Math.random() \- 0.5).slice(0, 4);

        for(let i \= 1; i \<= 4; i++) activeRunRiddles\[i\] \= t1\[i \- 1\];  
        for(let i \= 5; i \<= 8; i++) activeRunRiddles\[i\] \= t2\[i \- 5\];  
        for(let i \= 9; i \<= 12; i++) activeRunRiddles\[i\] \= t3\[i \- 9\];

        document.querySelectorAll('.screen').forEach(s \=\> s.classList.add('hidden'));  
        document.getElementById('hud').classList.remove('hidden');  
        document.getElementById('crosshair').classList.remove('hidden');  
        document.getElementById('action-buttons').classList.remove('hidden');

        generateStage();  
    }

    // Called when the 3 minute hidden timer expires in Special 1  
    function triggerSpecial1Win() {  
        if (gameState \!== 'playing' || isTransitioning) return;  
        isTransitioning \= true;  
        closeAllModals();

        const indicator \= document.getElementById('door-indicator');  
        indicator.innerText \= \`THE PATH OPENS...\`;  
        indicator.classList.remove('hidden');

        AudioSys.soundCorrect();  
        currentStage++;  
        // Plunge forward into the void  
        animateMovement(camera.position.x, camera.position.z, 0, \-7, 800, () \=\> {  
            if (currentStage \>= TOTAL\_STAGES) {  
                triggerWin();  
                indicator.classList.add('hidden');  
            } else {  
                const flash \= document.getElementById('flash');  
                flash.style.backgroundColor \= '\#000'; flash.style.opacity \= '1';  
                setTimeout(() \=\> {  
                    generateStage();  
                    flash.style.opacity \= '0';  
                    indicator.classList.add('hidden');  
                    isTransitioning \= false;  
                }, 200);  
            }  
        });  
    }

    function handleDoorChoice(doorMesh) {  
        if (isTransitioning || isTurning || currentModal || gameState \!== 'playing') return;  
        isTransitioning \= true;  
        if (specialTimerTimeout) clearTimeout(specialTimerTimeout);

        const isBackDoor \= doorMesh.userData.index \=== 3;  
        const indicator \= document.getElementById('door-indicator');  
          
        if (isBackDoor) {  
            indicator.innerText \= \`ENTERING DOOR BEHIND...\`;  
        } else {  
            indicator.innerText \= \`ENTERING DOOR ${doorMesh.userData.index \+ 1}...\`;  
        }  
        indicator.classList.remove('hidden');

        const targetX \= doorMesh.position.x;  
        const targetZ \= isBackDoor ? 7 : \-7; 

        if (doorMesh.userData.isCorrect) {  
            if (currentStage \=== 1\) {  
                firstStageChoice \= doorMesh.userData.index; // Remember door choice from stage 1  
            }  
              
            AudioSys.soundCorrect();  
            currentStage++;  
            animateMovement(camera.position.x, camera.position.z, targetX, targetZ, 800, () \=\> {  
                if (currentStage \>= TOTAL\_STAGES) {  
                    triggerWin();  
                    indicator.classList.add('hidden');  
                } else {  
                    const flash \= document.getElementById('flash');  
                    flash.style.backgroundColor \= '\#000'; flash.style.opacity \= '1';  
                    setTimeout(() \=\> {  
                        generateStage();  
                        flash.style.opacity \= '0';  
                        indicator.classList.add('hidden');  
                        isTransitioning \= false;  
                    }, 200);  
                }  
            });  
        } else {  
            AudioSys.soundWrong();  
            animateMovement(camera.position.x, camera.position.z, targetX, targetZ, 800, () \=\> {  
                const flash \= document.getElementById('flash');  
                flash.style.backgroundColor \= '\#000'; flash.style.opacity \= '1';  
                setTimeout(() \=\> {  
                    startGame(); // Restarts the run securely with fresh puzzles and variables  
                    flash.style.opacity \= '0';  
                    indicator.classList.add('hidden');  
                }, 200);  
            });  
        }  
    }

    function triggerWin() {  
        gameState \= 'win';  
        isTimerRunning \= false;  
        if (specialTimerTimeout) clearTimeout(specialTimerTimeout);  
        document.getElementById('hud').classList.add('hidden');  
        document.getElementById('crosshair').classList.add('hidden');  
        document.getElementById('action-buttons').classList.add('hidden');  
        document.getElementById('win-screen').classList.remove('hidden');  
    }

    function animateMovement(startX, startZ, endX, endZ, duration, callback) {  
        const startTime \= performance.now();  
        function update(currentTime) {  
            const elapsed \= currentTime \- startTime;  
            const progress \= Math.min(elapsed / duration, 1);  
            const ease \= progress \< 0.5 ? 2 \* progress \* progress : \-1 \+ (4 \- 2 \* progress) \* progress;  
              
            camera.position.x \= startX \+ (endX \- startX) \* ease;  
            camera.position.z \= startZ \+ (endZ \- startZ) \* ease;  
            camera.position.y \= 1.6 \+ Math.sin(progress \* Math.PI \* 4\) \* 0.1;

            if (progress % 0.25 \< 0.05) AudioSys.soundStep(); 

            if (progress \< 1\) requestAnimationFrame(update);  
            else { camera.position.set(endX, 1.6, endZ); if(callback) callback(); }  
        }  
        requestAnimationFrame(update);  
    }

    function animateRotation(startRot, endRot, duration, callback) {  
        const startTime \= performance.now();  
        function update(currentTime) {  
            const elapsed \= currentTime \- startTime;  
            const progress \= Math.min(elapsed / duration, 1);  
            const ease \= progress \< 0.5 ? 2 \* progress \* progress : \-1 \+ (4 \- 2 \* progress) \* progress;  
              
            baseRotationY \= startRot \+ (endRot \- startRot) \* ease;  
              
            if (progress \< 1\) requestAnimationFrame(update);  
            else { baseRotationY \= endRot; if(callback) callback(); }  
        }  
        requestAnimationFrame(update);  
    }

    let mouseX \= 0, mouseY \= 0;  
    let touchStartX \= 0, touchStartY \= 0;  
    let isDragging \= false;  
    const windowHalfX \= window.innerWidth / 2;  
    const windowHalfY \= window.innerHeight / 2;

    function shouldIgnoreEvent(e) {  
        if (e.target.tagName \=== 'BUTTON') return true;  
        if (e.target.closest && (e.target.closest('.screen') || e.target.closest('.modal') || e.target.closest('\#action-buttons'))) return true;  
        return false;  
    }

    function handleInputDown(x, y) {  
        if (gameState \!== 'playing' || isTransitioning || isTurning || currentModal) return;  
        isDragging \= true;  
        touchStartX \= x; touchStartY \= y;  
    }

    function handleInputUp(x, y) {  
        if (\!isDragging || currentModal) return;  
        isDragging \= false;  
          
        const deltaX \= x \- touchStartX;  
        const deltaY \= y \- touchStartY;  
          
        if (Math.abs(deltaX) \> 50 && Math.abs(deltaX) \> Math.abs(deltaY)) {  
            triggerTurn();  
        } else if (Math.abs(deltaX) \< 10 && Math.abs(deltaY) \< 10\) {  
            mouse.x \= (x / window.innerWidth) \* 2 \- 1;  
            mouse.y \= \-(y / window.innerHeight) \* 2 \+ 1;  
              
            raycaster.setFromCamera(mouse, camera);  
            const intersects \= raycaster.intersectObjects(doors);  
            if (intersects.length \> 0\) handleDoorChoice(intersects\[0\].object);  
        }  
    }

    function triggerTurn() {  
        if (isTransitioning || isTurning || currentModal) return;  
        isTurning \= true;  
        isFacingBack \= \!isFacingBack;  
          
        const startRot \= baseRotationY;  
        const endRot \= isFacingBack ? Math.PI : 0;  
          
        animateRotation(startRot, endRot, 400, () \=\> {  
            isTurning \= false;  
        });  
    }

    function onMouseMove(event) {  
        if (gameState \!== 'playing' || isTransitioning || isTurning || currentModal) return;  
        mouse.x \= (event.clientX / window.innerWidth) \* 2 \- 1;  
        mouse.y \= \-(event.clientY / window.innerHeight) \* 2 \+ 1;  
        mouseX \= (event.clientX \- windowHalfX);  
        mouseY \= (event.clientY \- windowHalfY);  
    }

    function onWindowResize() {  
        camera.aspect \= window.innerWidth / window.innerHeight;  
        camera.updateProjectionMatrix();  
        renderer.setSize(window.innerWidth / PIXEL\_SCALE, window.innerHeight / PIXEL\_SCALE, false);  
    }

    const clock \= new THREE.Clock();

    function animate() {  
        requestAnimationFrame(animate);  
        const time \= clock.getElapsedTime();

        if (gameState \=== 'playing') {  
            if (isTimerRunning) {  
                const elapsed \= Math.floor((Date.now() \- gameStartTime) / 1000);  
                if (elapsed \!== lastTimerSeconds) {  
                    lastTimerSeconds \= elapsed;  
                    const mins \= String(Math.floor(elapsed / 60)).padStart(2, '0');  
                    const secs \= String(elapsed % 60).padStart(2, '0');  
                    document.getElementById('timer-display').innerText \= \`TIME: ${mins}:${secs}\`;  
                }  
            }

            const dir \= isFacingBack ? \-1 : 1;  
            const targetRotY \= baseRotationY \+ (mouseX \* \-0.0005 \* dir);  
            const targetRotX \= mouseY \* \-0.0005;

            if (\!isTurning && \!isTransitioning && \!currentModal) {  
                camera.rotation.y \+= (targetRotY \- camera.rotation.y) \* 0.1;  
                camera.rotation.x \+= (targetRotX \- camera.rotation.x) \* 0.1;  
                camera.position.y \= 1.6 \+ Math.sin(time \* 2\) \* 0.05;   
            } else if (isTurning) {  
                camera.rotation.y \= baseRotationY;  
                camera.rotation.x \+= (0 \- camera.rotation.x) \* 0.2;   
            } else if (isTransitioning || currentModal) {  
                camera.rotation.y \+= (baseRotationY \- camera.rotation.y) \* 0.1;  
                camera.rotation.x \+= (0 \- camera.rotation.x) \* 0.1;  
            }

            if (\!isTurning && \!isTransitioning && \!currentModal) {  
                raycaster.setFromCamera(mouse, camera);  
                const intersects \= raycaster.intersectObjects(doors);  
                  
                if (hoveredDoor) {  
                    hoveredDoor.material.emissive.setHex(0x1a0f05);  
                    hoveredDoor \= null;  
                    document.body.style.cursor \= 'default';  
                }  
                if (intersects.length \> 0\) {  
                    hoveredDoor \= intersects\[0\].object;  
                    hoveredDoor.material.emissive.setHex(0x665533);   
                    document.body.style.cursor \= 'pointer';  
                }  
            }  
        }

        if (torchModel) {  
            const fire \= torchModel.getObjectByName("fire");  
            if (fire) {  
                const scale \= 1 \+ Math.random() \* 0.2;  
                fire.scale.set(scale, scale \+ Math.random()\*0.3, scale);  
                fire.rotation.y \= time \* 5;  
            }  
        }  
        if (torchLight && torchFlickerLight) {  
            torchLight.intensity \= 1.2 \+ Math.random() \* 0.4;  
            torchFlickerLight.intensity \= 0.3 \+ Math.random() \* 0.3;  
            torchLight.position.x \= Math.sin(time \* 10\) \* 0.05;  
            torchLight.position.y \= Math.cos(time \* 15\) \* 0.05;  
        }

        renderer.render(scene, camera);  
    }

    window.onload \= init;  
\</script\>  
\</body\>  
\</html\>  
