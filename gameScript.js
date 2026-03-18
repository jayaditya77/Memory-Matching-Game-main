
var em = ["💐","🌹","🌻","🏵️","🌺","🌴","🌈","🍓","🍒","🍎","🍉","🍊","🥭","🍍","🍋","🍏","🍐","🥝","🍇","🥥","🍅","🌶️","🍄","🧅","🥦","🥑","🍔","🍕","🧁","🎂","🍬","🍩","🍫","🎈"];
(function(a){ var t,c,p=a.length; if(p) while(--p){c=Math.floor(Math.random()*(p+1));t=a[c];a[c]=a[p];a[p]=t;} })(em);

var muted=false, actx;
function getACtx(){ if(!actx) actx=new(window.AudioContext||window.webkitAudioContext)(); return actx; }
function tone(freq,dur,type,vol,delay){
    if(muted) return;
    try{
        var ctx=getACtx(),o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type=type||'sine'; o.frequency.value=freq;
        g.gain.setValueAtTime(vol||0.25,ctx.currentTime+(delay||0));
        g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+(delay||0)+dur);
        o.start(ctx.currentTime+(delay||0)); o.stop(ctx.currentTime+(delay||0)+dur);
    }catch(e){}
}
function sfxFlip()  { tone(440,0.09,'triangle',0.15); }
function sfxWrong() { tone(200,0.14,'sawtooth',0.2); tone(170,0.18,'sawtooth',0.15,0.1); }
function sfxMatch() { tone(523,0.13,'sine',0.28); tone(659,0.13,'sine',0.28,0.11); tone(784,0.22,'sine',0.28,0.22); }
function sfxCombo() { tone(880,0.08,'sine',0.22); tone(1047,0.08,'sine',0.22,0.09); tone(1319,0.12,'sine',0.22,0.18); }
function sfxWin()   { [523,587,659,698,784,880,988].forEach(function(f,i){ tone(f,0.18,'sine',0.28,i*0.1); }); }
function toggleMute(){ muted=!muted; $('#mute-btn').text(muted?'🔇 Mute':'🔊 Mute'); }

/* ── GAME VARS ──────────────────────────────────────────────────────────────── */
var pre="",pID,ppID=0,turn=0;
var tf="transform",flip="rotateY(180deg)",flipBack="rotateY(0deg)";
var gameTimer,mode;
var min=0,sec=0,moves=0,score=0,combo=0,rem=0,noItems=0;
var playerName="";

/* ── RESIZE ─────────────────────────────────────────────────────────────────── */
window.onresize=init;
function init(){ $('body').height(innerHeight+"px"); $('#ol').height(innerHeight+"px"); }

/* ── WELCOME SCREEN ─────────────────────────────────────────────────────────── */
window.onload=function(){ init(); setupConfetti(); showWelcome(); };

function showWelcome(){
    $("#ol").html(`<center><div id="inst">
        <h3>Welcome!</h3>
        <p style="font-size:16px;margin:4px 0 8px;">Enter your name to begin</p>
        <input id="name-input" type="text" placeholder="Your name..." maxlength="20" autocomplete="off"/><br/>
        Instructions For Game<br/><br/>
        <li>Make pairs of similar blocks by flipping them.</li>
        <li>To flip a block you can click on it.</li>
        <li>If two blocks you clicked are not similar, they will be flipped back.</li>
        <p style="font-size:18px;">Click one of the following mode to start the game.</p>
        </div>
        <button onclick="tryStart(3,4)">3 x 4</button>
        <button onclick="tryStart(4,4)">4 x 4</button>
        <button onclick="tryStart(4,5)">4 x 5</button>
        <button onclick="tryStart(5,6)">5 x 6</button>
        <button onclick="tryStart(6,6)">6 x 6</button>
        </center>`);
    $(document).off('keydown.name').on('keydown.name',function(e){
        if(e.key==='Enter') tryStart(4,4);
    });
}

function tryStart(r,l){
    var n=($("#name-input").val()||"").trim();
    if(!n){ $("#name-input").addClass("error").attr("placeholder","Enter a name first!").focus(); return; }
    playerName=n;
    start(r,l);
}

/* ── START GAME ─────────────────────────────────────────────────────────────── */
function start(r,l){
    clearInterval(gameTimer);
    min=0; sec=0; moves=0; score=0; combo=0; turn=0; pre=""; pID=null; ppID=0;
    $("#time").html("Time: 00:00");
    $("#moves").html("Moves: 0");
    $("#score").html("Score: 0");

    gameTimer=setInterval(function(){
        sec++;
        if(sec==60){min++;sec=0;}
        var ss=(sec<10)?"0"+sec:sec, mm=(min<10)?"0"+min:min;
        $("#time").html("Time: "+mm+":"+ss);
    },1000);

    rem=r*l/2; noItems=rem; mode=r+"x"+l;

    var items=[];
    for(var i=0;i<noItems;i++) items.push(em[i]);
    for(var i=0;i<noItems;i++) items.push(em[i]);
    var tmp,c,p=items.length;
    if(p) while(--p){c=Math.floor(Math.random()*(p+1));tmp=items[c];items[c]=items[p];items[p]=tmp;}

    $("table").html("");
    var n=1;
    for(var i=1;i<=r;i++){
        $("table").append("<tr>");
        for(var j=1;j<=l;j++){
            $("table").append(`<td id='${n}' onclick="change(${n})"><div class='inner'><div class='front'></div><div class='back'><p>${items[n-1]}</p></div></div></td>`);
            n++;
        }
        $("table").append("</tr>");
    }
    $("#ol").fadeOut(500);
}

/* ── FLIP LOGIC ─────────────────────────────────────────────────────────────── */
function change(x){
    var i="#"+x+" .inner";
    var b="#"+x+" .inner .back";

    if(turn==2 || $(i).attr("flip")=="block" || ppID==x) return;

    sfxFlip();
    $(i).css(tf,flip);

    if(turn==1){
        turn=2;
        moves++;
        $("#moves").html("Moves: "+moves);

        if(pre!=$(b).text()){
            /* wrong */
            sfxWrong();
            $(b).addClass("shake-wrong");
            $(pID+" .back").addClass("shake-wrong");
            setTimeout(function(){
                $(pID).css(tf,flipBack);
                $(i).css(tf,flipBack);
                $(b).removeClass("shake-wrong");
                $(pID+" .back").removeClass("shake-wrong");
                ppID=0; combo=0;
            },1000);
        } else {
            /* match */
            combo++;
            var pts=100+Math.max(0,30-sec);
            if(combo>=2) pts=Math.round(pts*(1+(combo-1)*0.3));
            score+=pts;
            $("#score").html("Score: "+score);
            sfxMatch();
            if(combo>=2){ sfxCombo(); showCombo(combo); }
            $(b).addClass("matched-glow");
            $(pID+" .back").addClass("matched-glow");
            miniConfetti();
            rem--;
            $(i).attr("flip","block");
            $(pID).attr("flip","block");
        }

        setTimeout(function(){turn=0;},1150);

        /* win */
        if(rem==0){
            clearInterval(gameTimer);
            sfxWin(); bigConfetti();
            var timeStr=(min==0)?sec+" seconds":min+" minute(s) and "+sec+" second(s)";
            var acc=Math.round((noItems/moves)*100);
            setTimeout(function(){
                var entry={name:playerName,mode:mode,score:score,moves:moves,timeSec:min*60+sec,acc:acc,date:Date.now()};
                saveLBEntry(entry);
                var rankMsg=getRankMsg(entry);
                $("#ol").html(`<center><div id="iol">
                    <h2>🎉 Congrats, ${playerName}!</h2>
                    <p style="font-size:20px;padding:10px;">
                        You completed the <b>${mode}</b> mode in <b>${moves}</b> moves.<br/>
                        Time: <b>${timeStr}</b><br/>
                        Score: <b>${score}</b> &nbsp;|&nbsp; Accuracy: <b>${acc}%</b>
                    </p>
                    <p style="font-size:16px;opacity:0.9;">${rankMsg}</p>
                    <p style="font-size:18px">Play Again?</p>
                    <button onclick="showWelcome()">Menu</button>
                    <button onclick="start(3,4)">3 x 4</button>
                    <button onclick="start(4,4)">4 x 4</button>
                    <button onclick="start(4,5)">4 x 5</button>
                    <button onclick="start(5,6)">5 x 6</button>
                    <button onclick="start(6,6)">6 x 6</button>
                    </div></center>`);
                $("#ol").fadeIn(750);
            },1500);
        }
    } else {
        pre=$(b).text(); ppID=x; pID="#"+x+" .inner"; turn=1;
    }
}

/* ── COMBO POPUP ────────────────────────────────────────────────────────────── */
function showCombo(n){
    var labels={2:"Double! 🔥",3:"Triple! 💥",4:"Quad! ⚡",5:"STREAK! 🌟",6:"LEGENDARY! 👑"};
    var lbl=labels[Math.min(n,6)]||n+"x Streak! 🚀";
    $('#combo-popup').html('<div class="combo-label">'+lbl+'</div>');
    setTimeout(function(){$('#combo-popup').html('');},1400);
}

/* ── LEADERBOARD ────────────────────────────────────────────────────────────── */
var lbFilter='all';
function getLB(){try{return JSON.parse(localStorage.getItem('mmg_lb')||'[]');}catch(e){return[];}}
function saveLBEntry(entry){
    var lb=getLB(); lb.push(entry);
    lb.sort(function(a,b){return b.score-a.score;});
    if(lb.length>100) lb.splice(100);
    try{localStorage.setItem('mmg_lb',JSON.stringify(lb));}catch(e){}
}
function getRankMsg(entry){
    var lb=getLB().filter(function(e){return e.mode===entry.mode;});
    var idx=lb.findIndex(function(e){return e.name===entry.name&&e.score===entry.score&&e.date===entry.date;});
    if(idx===0) return "🥇 #1 on "+entry.mode+" leaderboard!";
    if(idx===1) return "🥈 #2 on "+entry.mode+" leaderboard!";
    if(idx===2) return "🥉 #3 on "+entry.mode+" leaderboard!";
    return "Rank #"+(idx+1)+" on "+entry.mode;
}
function filterLB(f){
    lbFilter=f;
    $('.lb-filter').removeClass('active');
    $('.lb-filter').each(function(){
        if($(this).text().replace('×','x')===f||(f==='all'&&$(this).text()==='All'))
            $(this).addClass('active');
    });
    renderLB();
}
function renderLB(){
    var lb=getLB();
    var rows=lbFilter==='all'?lb:lb.filter(function(e){return e.mode===lbFilter;});
    if(!rows.length){$('#lb-list').html('<div class="lb-empty">No scores yet!</div>');return;}
    var medals=['🥇','🥈','🥉'];
    var html=rows.slice(0,20).map(function(e,i){
        var ts=e.timeSec<60?e.timeSec+'s':Math.floor(e.timeSec/60)+'m '+(e.timeSec%60)+'s';
        return '<div class="lb-row">'
            +'<div class="lb-rank">'+(medals[i]||'#'+(i+1))+'</div>'
            +'<div><div class="lb-name">'+esc(e.name)+'</div>'
            +'<div class="lb-meta">'+e.mode+' · '+e.moves+' moves · '+ts+' · '+e.acc+'% acc</div></div>'
            +'<div class="lb-pts">⭐ '+e.score+'</div></div>';
    }).join('');
    $('#lb-list').html(html);
}
function esc(s){return s.replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function showLB(){renderLB();$('#lb-overlay').addClass('show');}
function closeLB(){$('#lb-overlay').removeClass('show');}
function clearLB(){if(confirm('Clear all scores?')){try{localStorage.removeItem('mmg_lb');}catch(e){}renderLB();}}
$('#lb-overlay').on('click',function(e){if(e.target===this)closeLB();});

/* ── CONFETTI ────────────────────────────────────────────────────────────────── */
var cCanvas,cCtx,cParts=[];
function setupConfetti(){
    cCanvas=document.getElementById('confetti-canvas');
    cCtx=cCanvas.getContext('2d');
    function resize(){cCanvas.width=innerWidth;cCanvas.height=innerHeight;}
    resize(); window.addEventListener('resize',resize);
    (function loop(){
        cCtx.clearRect(0,0,cCanvas.width,cCanvas.height);
        cParts=cParts.filter(function(p){return p.life>0.01;});
        cParts.forEach(function(p){
            p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.rot+=p.rotV; p.life-=0.013;
            cCtx.save(); cCtx.globalAlpha=p.life;
            cCtx.translate(p.x,p.y); cCtx.rotate(p.rot*Math.PI/180);
            cCtx.fillStyle=p.color; cCtx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
            cCtx.restore();
        });
        requestAnimationFrame(loop);
    })();
}
var COLS=['#ffd700','#ff6b6b','#4ecdc4','#a8e6cf','#ff8b94','#dda0dd','#fff','#87ceeb'];
function spawn(n,fromTop){
    for(var i=0;i<n;i++) cParts.push({
        x:Math.random()*cCanvas.width,
        y:fromTop?-10:cCanvas.height*0.35,
        vx:(Math.random()-0.5)*(fromTop?5:7),
        vy:fromTop?Math.random()*3+2:Math.random()*-9-2,
        color:COLS[Math.floor(Math.random()*COLS.length)],
        w:Math.random()*10+5,h:Math.random()*6+3,
        rot:Math.random()*360,rotV:(Math.random()-0.5)*10,life:1
    });
}
function miniConfetti(){spawn(20,false);}
function bigConfetti(){spawn(100,true);setTimeout(function(){spawn(80,true);},400);}