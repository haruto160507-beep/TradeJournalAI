const calendar = document.getElementById("calendar");
const calendarHeader = document.getElementById("calendarHeader");

const todayEl = document.getElementById("today");
const weekEl = document.getElementById("week");
const monthEl = document.getElementById("month");
const totalEl = document.getElementById("total");

const historyBody = document.getElementById("history");

const weekNames = ["日","月","火","水","木","金","土"];

calendarHeader.innerHTML = "";

weekNames.forEach(day=>{
    calendarHeader.innerHTML += `
        <div class="weekName">${day}</div>
    `;
});

let trades = [];

// Supabaseの +00:00 を無視して、そのまま日本時間として扱う
function toJapanDate(time){
    if(!time) return new Date();

    const clean = String(time)
        .replace("Z","")
        .replace(/\+.*$/,"");

    return new Date(clean);
}

async function loadTrades(){

    const res = await fetch("/api/trades");
    trades = await res.json();

    calculateSummary();
    drawHistory();
}

function calculateSummary(){

    let todayProfit = 0;
    let weekProfit = 0;
    let monthProfit = 0;
    let totalProfit = 0;

    const now = new Date();

    const startWeek = new Date(now);
    startWeek.setDate(now.getDate() - now.getDay());
    startWeek.setHours(0,0,0,0);

    trades.forEach(t=>{

        const profit = Number(t.profit);
        totalProfit += profit;

        const d = toJapanDate(t.time);

        if(d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth()){
            monthProfit += profit;
        }

        if(d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate()){
            todayProfit += profit;
        }

        if(d >= startWeek){
            weekProfit += profit;
        }
    });

    todayEl.textContent = todayProfit.toLocaleString()+" 円";
    weekEl.textContent = weekProfit.toLocaleString()+" 円";
    monthEl.textContent = monthProfit.toLocaleString()+" 円";
    totalEl.textContent = totalProfit.toLocaleString()+" 円";
}

function drawHistory(){

    historyBody.innerHTML = "";

    const list = [...trades].reverse();

    list.forEach(t=>{

        const profit = Number(t.profit);
        const d = toJapanDate(t.time);

        historyBody.innerHTML += `
<tr>
<td>${d.toLocaleString("ja-JP")}</td>
<td>${t.symbol}</td>
<td>${t.lots ?? "-"}</td>
<td class="${profit>=0?"plus":"minus"}">
${profit.toLocaleString()} 円
</td>
</tr>
`;
    });
}

function createCalendar(){

    calendar.innerHTML = "";

    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for(let i=0; i<firstDay; i++){
        calendar.innerHTML += `<div class="day"></div>`;
    }

    for(let day=1; day<=lastDate; day++){

        let dayProfit = 0;

        trades.forEach(t=>{

            const d = toJapanDate(t.time);

            if(d.getFullYear() === year &&
               d.getMonth() === month &&
               d.getDate() === day){
                dayProfit += Number(t.profit);
            }
        });

        const today =
            now.getDate() === day &&
            now.getMonth() === month &&
            now.getFullYear() === year;

        calendar.innerHTML += `
<div class="day ${today?"today":""}">
    <div class="dayNumber">${day}</div>
    <div class="dayProfit ${dayProfit>=0?"plus":"minus"}">
        ${dayProfit.toLocaleString()} 円
    </div>
</div>
`;
    }
}

async function refresh(){
    await loadTrades();
    createCalendar();
}

refresh();

setInterval(refresh, 3000);