// collect DOMs
const display = document.querySelector(".display");
const controllerWrapper = document.querySelector(".controllers");

var _totalElaspedTime = 0;

const State = ["Initial", "Record", "Paused", "Download"];
let stateIndex = 0;
let mediaRecorder,
  chunks = [],
  audioURL = "",
  timerInterval,
  startTime;

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/mp4; codecs=opus" });
        chunks = [];
        audioURL = URL.createObjectURL(blob);
        addAudio();
        exportAudio(blob);
      };
    })
    .catch((error) => {
      console.log("Error: ", error);
    });
} else {
  stateIndex = "";
  application(stateIndex);
}

const exportAudio = (blob) => {
  const aud = document.querySelector("audio");
  aud.src = URL.createObjectURL(blob);
  aud.addEventListener("loadedmetadata", () => {
    if (aud.duration === Infinity) {
      aud.currentTime = 1e101;
      aud.addEventListener(
        "timeupdate",
        () => {
          aud.currentTime = 0;
        },
        { once: true }
      );
    }
  });
};

const clearDisplay = () => {
  display.textContent = "";
};

const clearControls = () => {
  controllerWrapper.textContent = "";
};

let totalElapsedTime = 0;

const updateTimer = () => {
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime + totalElapsedTime;

  const seconds = Math.floor((elapsedTime / 1000) % 60);
  const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
  const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);

  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  display.textContent = `Recording... ${formattedTime}`;
};

const startTimer = () => {
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
};

const stopTimer = () => {
  clearInterval(timerInterval);
};

const record = () => {
  stateIndex = 1;
  totalElapsedTime = 0;
  mediaRecorder.start();
  startTimer();
  application(stateIndex);
};

const displayElapsedTime = (timeInMs) => {
  const totalSeconds = Math.floor(timeInMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  display.textContent = `Paused at: ${formattedTime}`;
};

const pauseRecording = () => {
  if (mediaRecorder.state === "recording") {
    mediaRecorder.pause();
    stopTimer();
    totalElapsedTime += Date.now() - startTime;
    displayElapsedTime(totalElapsedTime);
    stateIndex = 2;
    application(stateIndex);
  }
};

const resumeRecording = () => {
  if (mediaRecorder.state === "paused") {
    mediaRecorder.resume();
    startTime = Date.now();
    startTimer();
    stateIndex = 1;
    application(stateIndex);
  }
};

const downloadAudio = () => {
  const downloadLink = document.createElement("a");
  downloadLink.href = audioURL;
  downloadLink.setAttribute("download", "audio.mp4");
  downloadLink.click();
};

const addButton = (id, funString, text) => {
  const btn = document.createElement("button");
  btn.id = id;
  btn.setAttribute("onclick", funString);
  btn.textContent = text;
  controllerWrapper.append(btn);
};

const addMessage = (text) => {
  const msg = document.createElement("p");
  msg.textContent = text;
  display.append(msg);
};

const addAudio = () => {
  if (!audioURL) return;
  const existingAudio = display.querySelector("audio");
  if (existingAudio) existingAudio.remove();
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = audioURL;
  display.append(audio);
};

const displayTotalTime = (timeInMs) => {
  const totalSeconds = Math.floor(timeInMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  display.textContent = `Total Recording Time: ${formattedTime}`;
  _totalElaspedTime = formattedTime;
};

const stopRecording = () => {
  if (mediaRecorder.state === "recording" || mediaRecorder.state === "paused") {
    stopTimer();
    totalElapsedTime += Date.now() - startTime;
    displayElapsedTime(totalElapsedTime);
    mediaRecorder.stop();
    stateIndex = 3;
    application(stateIndex);
  }
};

const sendAudio = async () => {
  if (!audioURL) return alert("No audio to send.");

  const name = document.getElementById("name")?.value || "";
  const email = document.getElementById("email")?.value || "";

  try {
    const response = await fetch(audioURL);
    const audioBlob = await response.blob();
    const formData = new FormData();
    formData.append("audioFile", audioBlob, "recording.mp4");
    formData.append("name", name);
    formData.append("email", email);

    const res = await fetch("https://quadrithm.co.uk/sendAudio.php", {
      method: "POST",
      body: formData,
    });

    const result = await res.text();
    alert(result);

    //reload here, after success
    if (res.ok) {
      location.reload();
    }

    //clear inputs fields
    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
  } catch (error) {
    console.error("Error sending audio:", error);
  }
};

const toggleInputs = (enabled) => {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  if (nameInput) nameInput.disabled = !enabled;
  if (emailInput) emailInput.disabled = !enabled;
};

const application = (index) => {
  switch (State[index]) {
    case "Initial":
      clearDisplay();
      clearControls();
      addButton("record", "record()", "Start Recording");
      toggleInputs(false);
      break;

    case "Record":
      clearDisplay();
      clearControls();
      addMessage("Recording...");
      addButton("pause", "pauseRecording()", "Pause Recording");
      addButton("stop", "stopRecording()", "Stop Recording");
      toggleInputs(false);
      break;

    case "Paused":
      clearDisplay();
      clearControls();
      displayElapsedTime(totalElapsedTime);
      addButton("resume", "resumeRecording()", "Resume Recording");
      addButton("stop", "stopRecording()", "Stop Recording");
      toggleInputs(false);
      break;

    case "Download":
      clearDisplay();
      clearControls();
      addAudio();
      addButton("record", "record()", "Record Again");

      const sendBtn = document.createElement("button");
      sendBtn.type = "button";
      sendBtn.textContent = "Send Audio";
      sendBtn.addEventListener("click", (e) => {
        e.preventDefault(); // prevent default form submission
        const formEl = document.getElementById("audioForm");
        // Trigger HTML5 validation popups
        if (!formEl.checkValidity()) {
          formEl.reportValidity();
          return;
        }
        sendAudio();
      });
      controllerWrapper.append(sendBtn);
      toggleInputs(true);
      break;

    default:
      clearDisplay();
      clearControls();
      addMessage("Your browser does not support mediaDevices");
      toggleInputs(false);
      break;
  }
};

application(stateIndex);
