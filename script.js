const $ = (id) => document.getElementById(id);
const sampleActivities = [
  {name:"Built dashboard overview",category:"coding",time:"09:15 AM",duration:75,status:"Completed"},
  {name:"Pushed dashboard UI update",category:"commit",time:"10:45 AM",duration:10,status:"Completed"},
  {name:"Reviewed project requirements",category:"meeting",time:"11:30 AM",duration:25,status:"Completed"},
  {name:"Worked on flow analytics page",category:"coding",time:"01:10 PM",duration:90,status:"Completed"},
  {name:"Fixed responsive layout",category:"coding",time:"03:20 PM",duration:40,status:"Completed"}
];
let activities = [...sampleActivities];
try { const saved = JSON.parse(localStorage.getItem("cognistreamActivities") || "null"); if (Array.isArray(saved)) activities = saved; } catch {}
const icons = {coding:"⌨",commit:"⌘",meeting:"◷"};
function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function navigate(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("page-"+page).classList.add("active-page");
  const titles={dashboard:"Developer Dashboard",flow:"Flow Analytics",activity:"Developer Activity",interruptions:"Interruptions"};
  $("pageTitle").textContent=titles[page];$("crumb").textContent=page.toUpperCase();
  $("sidebar").classList.remove("open");
  if(page==="flow") drawChart("flowChart",[62,74,68,82,75,79,75],["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"line");
  if(page==="interruptions") drawChart("interruptChart",[5,3,2,2],["Messages","Meetings","Calls","Other"],"bar");
}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
$("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("light");showToast("Theme updated")});
$("periodSelect").addEventListener("change",e=>{
  const v=e.target.value, data={today:["18","2.1h","82%","2"],week:["128","6.5h","75%","12"],month:["486","31.2h","78%","43"]}[v];
  ["commitsKpi","hoursKpi","flowKpi","interruptKpi"].forEach((id,i)=>$(id).textContent=data[i]);
  $("scoreText").textContent=data[2];showToast("Showing "+e.target.options[e.target.selectedIndex].text+" sample data");
  drawChart("productivityChart",v==="today"?[1,2,1.5,2.1,1.8,2.4,1.6]:v==="month"?[4,5,6,4,7,6,8]:[3,5,4,6,5,7,6],["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"bar");
});
function drawChart(id,values,labels,type){
  const canvas=$(id);if(!canvas)return;const rect=canvas.getBoundingClientRect();const dpr=window.devicePixelRatio||1;
  const w=Math.max(rect.width,300),h=canvas.clientHeight||230;canvas.width=w*dpr;canvas.height=h*dpr;
  const c=canvas.getContext("2d");c.scale(dpr,dpr);const pad={l:35,r:12,t:15,b:30};const cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  c.font="11px DM Sans, sans-serif";c.fillStyle="#8191aa";c.strokeStyle="#293750";c.lineWidth=1;
  for(let i=0;i<=4;i++){const y=pad.t+ch*i/4;c.beginPath();c.moveTo(pad.l,y);c.lineTo(w-pad.r,y);c.stroke();c.fillText(String(100-i*25),3,y+4)}
  const max=type==="line"?100:Math.max(...values)*1.25;
  if(type==="bar"){
    const slot=cw/values.length,barW=Math.min(32,slot*.48);
    values.forEach((v,i)=>{const bh=v/max*ch,x=pad.l+i*slot+(slot-barW)/2,y=pad.t+ch-bh;const g=c.createLinearGradient(0,y,0,pad.t+ch);g.addColorStop(0,"#28d7ee");g.addColorStop(1,"#4775bd");c.fillStyle=g;c.beginPath();c.roundRect(x,y,barW,bh,5);c.fill();c.fillStyle="#8191aa";c.textAlign="center";c.fillText(labels[i],x+barW/2,h-8)});
  }else{
    const pts=values.map((v,i)=>({x:pad.l+i*cw/(values.length-1),y:pad.t+ch-v/100*ch}));
    c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle="#28d7ee";c.lineWidth=3;c.stroke();
    pts.forEach((p,i)=>{c.beginPath();c.arc(p.x,p.y,4,0,Math.PI*2);c.fillStyle="#28d7ee";c.fill();c.fillStyle="#8191aa";c.textAlign="center";c.fillText(labels[i],p.x,h-8)});
  }
}
function renderActivity(){
  const tbody=$("activityTable"),query=$("activitySearch").value.toLowerCase(),filter=$("activityFilter").value;
  const filtered=activities.filter(a=>(filter==="all"||a.category===filter)&&a.name.toLowerCase().includes(query));
  tbody.innerHTML=filtered.map(a=>`<tr><td>${escapeHtml(a.name)}</td><td>${a.category[0].toUpperCase()+a.category.slice(1)}</td><td>${a.time}</td><td>${a.duration} min</td><td><span class="status">${a.status}</span></td></tr>`).join("")||'<tr><td colspan="5">No matching activity found.</td></tr>';
  $("recentActivity").innerHTML=activities.slice(-3).reverse().map(a=>`<div class="activity-item"><span class="activity-symbol">${icons[a.category]||"•"}</span><div><b>${escapeHtml(a.name)}</b><p>${a.time} · ${a.duration} minutes</p></div></div>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
$("activitySearch").addEventListener("input",renderActivity);$("activityFilter").addEventListener("change",renderActivity);
$("addActivityBtn").addEventListener("click",()=>$("activityDialog").showModal());
$("activityForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("newActivityName").value.trim(),category=$("newActivityCategory").value,duration=Number($("newActivityDuration").value);
  if(!name||!Number.isFinite(duration)||duration<1)return;
  activities.push({name,category,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),duration,status:"Completed"});
  localStorage.setItem("cognistreamActivities",JSON.stringify(activities));$("activityDialog").close();e.target.reset();renderActivity();showToast("Activity saved successfully");
});
$("exportBtn").addEventListener("click",()=>{
  const rows=[["Activity","Category","Time","Duration (min)","Status"],...activities.map(a=>[a.name,a.category,a.time,a.duration,a.status])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="cognistream-activity-report.csv";a.click();URL.revokeObjectURL(url);showToast("CSV report exported");
});
function init(){renderActivity();drawChart("productivityChart",[3,5,4,6,5,7,6],["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"bar")}
window.addEventListener("resize",()=>{drawChart("productivityChart",[3,5,4,6,5,7,6],["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"bar");if($("page-flow").classList.contains("active-page"))drawChart("flowChart",[62,74,68,82,75,79,75],["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"line")});
init();
