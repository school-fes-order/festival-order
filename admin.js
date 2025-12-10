const API = "https://script.google.com/macros/s/AKfycbx2-ndOa2I7toHYqaSt2Dga64IrUBxj3myYIgBgMznfkazVXWII6v1WPG4wKOf_8KwYgA/exec";
const callSound = document.getElementById("callSound");

/* 音＋読み上げ */
function playCall(num) {
  callSound.play();
  const msg = new SpeechSynthesisUtterance(`${num}番をお呼び出しします`);
  msg.lang = "ja-JP";
  setTimeout(() => speechSynthesis.speak(msg), 1200);
}

/* 呼び出し番号 */
async function loadCall() {
  const res = await fetch(`${API}?action=call`);
  const d = await res.json();
  const now = d.call;

  const dom = document.getElementById("callNumber-admin");
  const old = dom.innerText;

  dom.innerText = now;

  if (old !== "--" && old !== now) {
    playCall(now);
  }
}

/* 次の番号へ */
document.getElementById("nextCall").onclick = async () => {
  await fetch(API, {
    method: "POST",
    body: JSON.stringify({ action: "nextCall" })
  });
  loadCall();
};

/* 注文一覧 */
async function loadOrders() {
  const res = await fetch(`${API}?action=orders`);
  const arr = await res.json();

  const box = document.getElementById("ordersList");
  box.innerHTML = "";

  arr.forEach(o => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div>
        <b>${o.ticket}番</b> / ${o.status}
        <button data-id="${o.id}" class="cookBtn">調理開始</button>
      </div>
    `;
    box.appendChild(div);
  });

  document.querySelectorAll(".cookBtn").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await fetch(API, {
        method: "POST",
        body: JSON.stringify({ action: "startCook", id })
      });
      loadOrders();
    }
  });
}

/* QRスキャン */
const video = document.getElementById("qrVideo");
const scanner = new QrScanner(video, result => {
  document.getElementById("scanResult").innerText = "読み取り: " + result;

  if (result.startsWith("ticket:")) {
    const t = result.replace("ticket:", "");
    fetch(API, {
      method: "POST",
      body: JSON.stringify({ action: "pickup", ticket: t })
    }).then(() => loadOrders());
  }
});
scanner.start();

/* 混雑ゲージ */
async function loadCrowd() {
  const res = await fetch(`${API}?action=wait`);
  const d = await res.json();
  const w = d.wait;

  const bar = document.getElementById("crowdBar");
  const label = document.getElementById("crowdLabel");

  let per = Math.min(w * 10, 100);
  bar.style.width = per + "%";

  if (w <= 3) { bar.style.background = "green"; label.innerText = "すいています"; }
  else if (w <= 8) { bar.style.background = "orange"; label.innerText = "やや混雑"; }
  else { bar.style.background = "red"; label.innerText = "混雑中"; }
}

setInterval(() => {
  loadCall();
  loadCrowd();
  loadOrders();
}, 3000);

loadCall();
loadCrowd();
loadOrders();
