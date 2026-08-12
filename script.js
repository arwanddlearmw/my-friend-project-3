const $ = id => document.getElementById(id);

let deviceType = "PC";
let currentSpecs = null;
let currentEvaluation = null;

const screens = ["welcomeScreen","inputScreen","resultScreen","historyScreen"];
function showScreen(id){
  screens.forEach(x => $(x).classList.toggle("hidden", x !== id));
}

function value(id){ return $(id).value.trim(); }

document.querySelectorAll(".device-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    deviceType = btn.dataset.device;
    document.querySelectorAll(".device-tab").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    const phone = deviceType === "PHONE";
    $("computerFields").classList.toggle("hidden", phone);
    $("phoneFields").classList.toggle("hidden", !phone);
  });
});

$("startBtn").onclick = () => showScreen("inputScreen");
$("backWelcomeBtn").onclick = () => showScreen("welcomeScreen");
$("editBtn").onclick = () => showScreen("inputScreen");
$("historyBtn").onclick = () => { renderHistory(); showScreen("historyScreen"); };
$("backResultBtn").onclick = () => showScreen("resultScreen");

$("aboutBtn").onclick = () => $("aboutDialog").showModal();
$("closeAboutBtn").onclick = () => $("aboutDialog").close();
$("aiBtn").onclick = () => $("aiDialog").showModal();
$("closeAiBtn").onclick = () => $("aiDialog").close();

$("clearBtn").onclick = () => {
  document.querySelectorAll("input").forEach(x => x.value = "");
  toast("تم مسح الحقول");
};

$("presetBtn").onclick = () => {
  if(deviceType === "PHONE"){
    $("phoneScreen").value = "6.7 AMOLED 120Hz";
    $("phoneCpu").value = "Snapdragon 8 Gen 3";
    $("phoneOs").value = "Android 15";
    $("phoneRam").value = "12 GB";
    $("phoneStorage").value = "256 GB";
    $("phoneCameras").value = "50MP + 12MP + 10MP";
    $("phoneBattery").value = "5000 mAh";
  }else{
    $("cpu").value = "Core i5-12400F";
    $("gpu").value = "RTX 4060";
    $("ram").value = "16 GB";
    $("storage").value = "1 TB NVMe SSD";
    $("psuOrBattery").value = "650W";
  }
  toast("تمت تعبئة مثال");
};

$("specForm").addEventListener("submit", e => {
  e.preventDefault();

  if(deviceType === "PHONE"){
    currentSpecs = {
      deviceType, phoneScreen:value("phoneScreen"), phoneCpu:value("phoneCpu"),
      phoneOs:value("phoneOs"), phoneRam:value("phoneRam"), phoneStorage:value("phoneStorage"),
      phoneCameras:value("phoneCameras"), phoneBattery:value("phoneBattery")
    };
  }else{
    currentSpecs = {
      deviceType, cpu:value("cpu"), gpu:value("gpu"), ram:value("ram"),
      storage:value("storage"), psuOrBattery:value("psuOrBattery")
    };
  }

  currentEvaluation = evaluate(currentSpecs);
  renderResult();
  showScreen("resultScreen");
});

function evaluate(s){
  const fields = Object.entries(s).filter(([k,v]) => k !== "deviceType" && v);
  const filled = fields.length;
  const total = s.deviceType === "PHONE" ? 7 : 5;
  let score = Math.round((filled / total) * 100);

  const text = Object.values(s).join(" ").toLowerCase();
  if(/rtx 40|rtx 50|rx 7|m[1-4] /.test(text)) score += 8;
  if(/16 gb|32 gb|24 gb|12 gb/.test(text)) score += 5;
  if(/nvme|ssd/.test(text)) score += 3;
  if(/120hz|144hz|165hz/.test(text)) score += 3;
  score = Math.min(score,100);

  let grade, summary;
  if(score >= 90){ grade="ممتاز"; summary="المواصفات مكتملة وقوية جداً."; }
  else if(score >= 75){ grade="جيد جداً"; summary="جهاز متوازن ومناسب لمعظم الاستخدامات."; }
  else if(score >= 55){ grade="جيد"; summary="المواصفات مقبولة، لكن توجد نقاط يمكن تحسينها."; }
  else if(score >= 35){ grade="متوسط"; summary="هناك معلومات أو مكونات مهمة تحتاج إلى تحسين."; }
  else { grade="غير كافٍ"; summary="أدخل مواصفات أكثر للحصول على تقييم أدق."; }

  return {score, grade, summary};
}

function renderResult(){
  $("score").textContent = currentEvaluation.score;
  $("grade").textContent = currentEvaluation.grade;
  $("summary").textContent = currentEvaluation.summary;

  const labels = {
    cpu:"CPU",gpu:"GPU",ram:"RAM",storage:"Storage",psuOrBattery:"PSU / Battery",
    phoneScreen:"Screen",phoneCpu:"CPU",phoneOs:"OS",phoneRam:"RAM",
    phoneStorage:"Storage",phoneCameras:"Cameras",phoneBattery:"Battery"
  };

  $("details").innerHTML = Object.entries(currentSpecs)
    .filter(([k,v]) => k !== "deviceType")
    .map(([k,v]) => `<div class="detail"><small>${labels[k] || k}</small><b>${escapeHtml(v || "—")}</b></div>`)
    .join("");

  $("aiBox").classList.add("hidden");
}

$("saveBtn").onclick = () => {
  if(!currentSpecs) return;
  const history = JSON.parse(localStorage.getItem("pcSpecsHistory") || "[]");
  history.unshift({id:Date.now(), specs:currentSpecs, evaluation:currentEvaluation});
  localStorage.setItem("pcSpecsHistory", JSON.stringify(history.slice(0,30)));
  toast("تم حفظ الجهاز");
};

function renderHistory(){
  const history = JSON.parse(localStorage.getItem("pcSpecsHistory") || "[]");
  if(!history.length){
    $("historyList").innerHTML = "<p>لا توجد أجهزة محفوظة بعد.</p>";
    return;
  }

  $("historyList").innerHTML = history.map(item => {
    const name = item.specs.deviceType === "PHONE"
      ? (item.specs.phoneCpu || "Phone")
      : (item.specs.cpu || "Computer");
    return `<div class="history-item">
      <div><h3>${escapeHtml(name)}</h3><p>${item.specs.deviceType} — ${item.evaluation.score}/100</p></div>
      <div class="history-actions">
        <button class="ghost" onclick="loadHistory(${item.id})">تحميل</button>
        <button class="ghost danger" onclick="deleteHistory(${item.id})">حذف</button>
      </div>
    </div>`;
  }).join("");
}

window.loadHistory = id => {
  const item = JSON.parse(localStorage.getItem("pcSpecsHistory") || "[]").find(x => x.id === id);
  if(!item) return;
  currentSpecs = item.specs;
  currentEvaluation = item.evaluation;
  deviceType = currentSpecs.deviceType;

  document.querySelectorAll(".device-tab").forEach(x => x.classList.toggle("active", x.dataset.device === deviceType));
  $("computerFields").classList.toggle("hidden", deviceType === "PHONE");
  $("phoneFields").classList.toggle("hidden", deviceType !== "PHONE");

  document.querySelectorAll("input").forEach(x => x.value = "");
  Object.entries(currentSpecs).forEach(([k,v]) => { if($(k)) $(k).value = v; });

  renderResult();
  showScreen("resultScreen");
};

window.deleteHistory = id => {
  const history = JSON.parse(localStorage.getItem("pcSpecsHistory") || "[]").filter(x => x.id !== id);
  localStorage.setItem("pcSpecsHistory", JSON.stringify(history));
  renderHistory();
  toast("تم حذف الجهاز");
};

$("languageBtn").onclick = () => {
  const english = document.documentElement.lang === "en";
  document.documentElement.lang = english ? "ar" : "en";
  document.documentElement.dir = english ? "rtl" : "ltr";
  $("languageBtn").textContent = english ? "English" : "العربية";
  toast(english ? "تم تغيير اللغة" : "Language changed");
};

function toast(message){
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => el.classList.remove("show"), 2200);
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
