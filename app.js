const TASKS = [
  {id:'english', name:'Anglais', goal:7, detailed:true, defaults:['Vocabulaire','Grammaire','Série / film','Conversation']},
  {id:'phone', name:'-1 h de téléphone', goal:7},
  {id:'sport', name:'Sport', goal:7, detailed:true, defaults:['Basket','Course','Natation','Vélo']},
  {id:'reading', name:'Lire', goal:5, detailed:true, defaults:['Roman','BD / manga','Article','Livre scolaire']},
  {id:'guitar', name:'Guitare', goal:6},
  {id:'brand', name:'Marque', goal:3, detailed:true, defaults:['Création','Contenu','Organisation','Recherche']},
  {id:'hobbies', name:'Hobbies', goal:2, detailed:true, defaults:['Dessin','Jeux','Cuisine','Création']},
  {id:'homework', name:'Devoirs', goal:7},
  {id:'noporn', name:'No porno', goal:7}
];
const DAY_NAMES=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const TOTAL_GOAL=TASKS.reduce((sum,t)=>sum+t.goal,0);
const KEY='mon-rythme-v1';
let data=JSON.parse(localStorage.getItem(KEY)||'{"weeks":{},"customChoices":{},"dark":false}');
let activeMonday=getMonday(new Date()), activeCell=null;
function getMonday(date){const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d}
function dateKey(d){return d.toISOString().slice(0,10)}
function weekKey(d){return dateKey(getMonday(d))}
function fromKey(k){return new Date(k+'T12:00:00')}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function getWeek(key=weekKey(activeMonday)){return data.weeks[key]||(data.weeks[key]={})}
function dateFor(day){const d=new Date(activeMonday);d.setDate(d.getDate()+day);return d}
function cell(day,task){return getWeek()[`${day}-${task}`]||{done:false,details:[]}}
function setCell(day,task,value){getWeek()[`${day}-${task}`]=value;save()}
function capScore(week){return TASKS.reduce((sum,t)=>sum+Math.min(t.goal,DAY_NAMES.filter((_,day)=>week[`${day}-${t.id}`]?.done).length),0)}
function weeklyPercent(week){return Math.round((capScore(week)/TOTAL_GOAL)*100)}
function formatDate(d){return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
function renderPlanner(){
  const monday=activeMonday, sunday=dateFor(6), today=dateKey(new Date());
  document.getElementById('weekLabel').textContent=`SEMAINE DU ${formatDate(monday).toUpperCase()} AU ${formatDate(sunday).toUpperCase()}`;
  const table=document.getElementById('plannerTable'), head=table.tHead.rows[0];
  head.innerHTML='<th scope="col">Habitude</th>';
  DAY_NAMES.forEach((name,i)=>{const d=dateFor(i), th=document.createElement('th');th.className=`day-head ${dateKey(d)===today?'today-col':''}`;th.innerHTML=`<span class="day-name">${name}</span><span class="day-date">${formatDate(d)}</span>`;head.append(th)});
  const body=table.tBodies[0];body.innerHTML='';
  TASKS.forEach(task=>{const tr=document.createElement('tr');const label=document.createElement('td');label.className='task-cell';label.innerHTML=`<span class="task-name">${task.name}</span><span class="task-goal">${task.goal} jours / 7</span>`;tr.append(label);
    DAY_NAMES.forEach((_,day)=>{const c=cell(day,task.id), td=document.createElement('td');if(dateKey(dateFor(day))===today)td.className='today-col';const b=document.createElement('button');b.className=`habit-button ${c.done?'done':''} ${c.details?.length?'has-details':''}`;b.title=c.done?(c.details?.join(', ')||'Fait'):'Marquer comme fait';b.setAttribute('aria-label',`${task.name}, ${DAY_NAMES[day]}${c.done?', fait':''}`);b.textContent=c.done?'×':'';b.onclick=()=>toggleCell(day,task);td.append(b);tr.append(td)});body.append(tr)});
  const score=capScore(getWeek()), percent=weeklyPercent(getWeek());document.getElementById('weekPercent').textContent=percent+'%';document.getElementById('weekProgress').style.width=percent+'%';document.getElementById('weekCount').textContent=`${score} sur ${TOTAL_GOAL} actions réalisées`;
}
function toggleCell(day,task){const current=cell(day,task.id);if(task.detailed){activeCell={day,task};openDetails(current);return}setCell(day,task.id,{done:!current.done,details:[]});renderAll()}
function choiceList(task){return [...new Set([...(task.defaults||[]),...(data.customChoices[task.id]||[])])]} 
function openDetails(current){const {day,task}=activeCell;document.getElementById('dialogDay').textContent=DAY_NAMES[day].toUpperCase();document.getElementById('dialogTitle').textContent=task.name;document.getElementById('dialogExplain').textContent=current.done?'Modifie les détails de cette activité.':'Choisis ce que tu as fait : la croix sera ajoutée automatiquement.';renderChoices(current.details||[]);document.getElementById('customChoice').value='';document.getElementById('detailDialog').showModal()}
function renderChoices(selected=[]){const area=document.getElementById('choices');area.innerHTML='';choiceList(activeCell.task).forEach((choice,i)=>{const l=document.createElement('label');l.className='choice';l.innerHTML=`<input type="checkbox" value="${escapeHTML(choice)}" ${selected.includes(choice)?'checked':''}><span>${escapeHTML(choice)}</span>`;area.append(l)})}
function escapeHTML(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
document.getElementById('addChoiceButton').onclick=()=>{const input=document.getElementById('customChoice'),value=input.value.trim();if(!value)return;const id=activeCell.task.id;data.customChoices[id]=[...(data.customChoices[id]||[]),value];save();const selected=[...document.querySelectorAll('#choices input:checked')].map(x=>x.value);selected.push(value);renderChoices(selected);input.value=''};
document.getElementById('detailDialog').addEventListener('close',()=>{if(document.getElementById('detailDialog').returnValue!=='confirm'||!activeCell)return;const details=[...document.querySelectorAll('#choices input:checked')].map(x=>x.value);setCell(activeCell.day,activeCell.task.id,{done:true,details});renderAll();showToast('Activité enregistrée')});
document.getElementById('uncheckButton').onclick=()=>{const {day,task}=activeCell;setCell(day,task.id,{done:false,details:[]});document.getElementById('detailDialog').close('cancel');renderAll();showToast('Croix retirée')};
function allWeeks(){return Object.entries(data.weeks).sort(([a],[b])=>a.localeCompare(b))}
function renderBilan(){const weeks=allWeeks().filter(([k])=>k<=weekKey(new Date()));const scores=weeks.map(([key,w])=>({key,percent:weeklyPercent(w),score:capScore(w)}));const best=scores.reduce((a,b)=>!a||b.percent>a.percent?b:a,null);document.getElementById('bestWeek').textContent=best?best.percent+'%':'—';document.getElementById('bestWeekDate').textContent=best?`Semaine du ${formatDate(fromKey(best.key))}`:'Commence ton suivi';const now=getWeek(weekKey(new Date())), nowScore=capScore(now);document.getElementById('currentScore').textContent=weeklyPercent(now)+'%';document.getElementById('currentScoreText').textContent=`${nowScore} action${nowScore>1?'s':''} validée${nowScore>1?'s':''}`;
  renderChart(scores);const totals=DAY_NAMES.map((name,day)=>{let done=0, possible=weeks.length*TASKS.length;weeks.forEach(([,w])=>TASKS.forEach(t=>{if(w[`${day}-${t.id}`]?.done)done++}));return {name,done,possible,rate:possible?Math.round(done/possible*100):0}}).sort((a,b)=>b.rate-a.rate||b.done-a.done);const top=totals[0];document.getElementById('topDay').textContent=top?.done?top.name:'—';document.getElementById('topDayText').textContent=top?.done?`${top.rate}% de tes actions prévues`:'Après quelques jours de suivi';const rank=document.getElementById('dayRanking');rank.innerHTML=totals.map(x=>`<li><span class="rank-day">${x.name}</span><span class="rank-rate">${x.rate}%</span><span class="rank-count">${x.done} action${x.done>1?'s':''}</span></li>`).join('')
}
function renderChart(scores){const el=document.getElementById('weeklyChart');if(!scores.length){el.innerHTML='<div class="empty-chart">Ton graphique apparaîtra ici<br>dès que tu auras validé une activité.</div>';return}const w=700,h=230,p={l:36,r:10,t:20,b:35};const usableW=w-p.l-p.r,usableH=h-p.t-p.b;const pts=scores.map((s,i)=>({x:p.l+(scores.length===1?usableW/2:i*usableW/(scores.length-1)),y:p.t+usableH-(s.percent/100*usableH),...s}));let svg=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">`;[0,25,50,75,100].forEach(v=>{const y=p.t+usableH-(v/100*usableH);svg+=`<line class="axis-line" x1="${p.l}" x2="${w-p.r}" y1="${y}" y2="${y}"/><text class="chart-label" x="0" y="${y+3}">${v}%</text>`});svg+=`<path class="chart-line" d="M ${pts.map(x=>x.x+','+x.y).join(' L ')}"/>`;pts.forEach(x=>{svg+=`<circle class="chart-point" cx="${x.x}" cy="${x.y}" r="5"/><text class="chart-value" text-anchor="middle" x="${x.x}" y="${x.y-12}">${x.percent}%</text><text class="chart-label" text-anchor="middle" x="${x.x}" y="${h-8}">${formatDate(fromKey(x.key))}</text>`});el.innerHTML=svg+'</svg>'}
function renderAll(){renderPlanner();renderBilan()}
function showToast(text){const t=document.getElementById('toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
document.querySelectorAll('.nav-link').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-link,.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.view).classList.add('active')});document.getElementById('previousWeek').onclick=()=>{activeMonday.setDate(activeMonday.getDate()-7);renderPlanner()};document.getElementById('nextWeek').onclick=()=>{activeMonday.setDate(activeMonday.getDate()+7);renderPlanner()};document.getElementById('todayButton').onclick=()=>{activeMonday=getMonday(new Date());renderPlanner()};document.getElementById('themeButton').onclick=()=>{data.dark=!data.dark;document.body.classList.toggle('dark',data.dark);save()};document.body.classList.toggle('dark',data.dark);renderAll();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');

