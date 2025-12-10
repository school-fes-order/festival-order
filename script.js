const API = "https://script.google.com/macros/s/AKfycbx2-ndOa2I7toHYqaSt2Dga64IrUBxj3myYIgBgMznfkazVXWII6v1WPG4wKOf_8KwYgA/exec";

let cart = [];
let ticketNumber = null;

/* 通知許可 */
if ("Notification" in window) {
  Notification.requestPermission();
}

/* 通知送信 */
function sendNotify(msg) {
  if (Notification.permission === "granted") {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification("文化祭オーダー", {
        body: msg,
        icon: "icon.png"
      });
    });
  }
}

/* 電子音 */
const callSound = document.getElementById("callSound");

/* 音＋読み上げ */
function playCall(num) {
  callSound.play();
  const msg = new SpeechSynthesisUtterance(`${num}番の方、お受け取り口までお越しください`);
  msg.lang = "ja-JP";
  setTimeout(() => speechSynthesis.speak(msg), 1200);
}

/* 呼び出し番号監視 */
async function watchCall() {
  const res = await fetch(`${API}?action=call`);
  const data = await res.json();
  const now = data.call;

  const dom = document.getElementById("callNumber");
  const old = dom.innerText;

  dom.innerText = now;

  if (old !== "--" && old !== now) {
    playCall(now);
  }
}

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

/* QR生成 */
function generateQR(ticket) {
  const canvas = document.getElementById("qrCanvas");
  QRCode.toCanvas(canvas, `ticket:${ticket}`);
}

/* 注文送信 */
document.getElementById("orderBtn").onclick = async () => {
  if (cart.length === 0) return;

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "addOrder",
      items: cart
    })
  });

  const data = await res.json();
  ticketNumber = data.ticket;

  sendNotify(`注文が確定しました（番号：${ticketNumber}）`);
  generateQR(ticketNumber);

  cart = [];
  document.getElementById("cart").innerHTML = "";
};

/* 定期更新 */
setInterval(() => {
  watchCall();
  loadCrowd();
}, 3000);

loadCrowd();
watchCall();
