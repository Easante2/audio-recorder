// collect DOMs
const display = document.querySelector(".display");
const controllerWrapper = document.querySelector(".controllers");

var _totalElaspedTime = 0;

const State = ["Initial", "Record", "Paused", "Download"];
let stateIndex = 0;
let mediaRecorder,
  chunks = [],
  audioURL = "",
  timerInterval, // Variable to store the timer interval ID
  startTime; // Variable to store the start time of the recording

// mediaRecorder setup for audio
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log("mediaDevices supported..");

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
    })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      // Modify the `onstop` event to handle audioURL creation separately
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/mp4; codecs=opus" });
        chunks = [];
        audioURL = window.URL.createObjectURL(blob);
        document.querySelector("audio").src = audioURL;
      };
    })
    .catch((error) => {
      console.log("Following error has occurred: ", error);
    });
} else {
  stateIndex = "";
  application(stateIndex);
}

const clearDisplay = () => {
  display.textContent = "";
};

const clearControls = () => {
  controllerWrapper.textContent = "";
};

let totalElapsedTime = 0; // To store the accumulated time before pause

const updateTimer = () => {
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime + totalElapsedTime; // Include the previously accumulated time

  const seconds = Math.floor((elapsedTime / 1000) % 60);
  const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
  const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);

  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  display.textContent = `Recording... ${formattedTime}`;
};

const startTimer = () => {
  startTime = Date.now(); // Set the current start time
  timerInterval = setInterval(updateTimer, 1000); // Continue the timer
};

const stopTimer = () => {
  clearInterval(timerInterval);
};

const record = () => {
  stateIndex = 1;
  totalElapsedTime = 0; // Reset the accumulated time when starting a new recording
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

  // Update display element with current elapsed time
  display.textContent = `Paused at: ${formattedTime}`;
};

const pauseRecording = () => {
  if (mediaRecorder.state === "recording") {
    mediaRecorder.pause();
    stopTimer(); // Stop the timer while paused
    totalElapsedTime += Date.now() - startTime; // Accumulate the elapsed time

    // Display the current recorded time on pause
    displayElapsedTime(totalElapsedTime);

    stateIndex = 2;
    application(stateIndex);
  }
};

const resumeRecording = () => {
  if (mediaRecorder.state === "paused") {
    mediaRecorder.resume();
    startTime = Date.now(); // Reset the start time but keep the accumulated time
    startTimer(); // Resume the timer
    stateIndex = 1;
    application(stateIndex);
  }
};

const addTotalTimeDisplay = (time) => {
  // Create a new paragraph element
  const timeDisplay = document.createElement("p");

  // Set the text content of the paragraph to the provided time argument
  timeDisplay.textContent = `Total Recording Time: ${time}`;

  // Add some styling to make it stand out (optional)
  timeDisplay.style.fontWeight = "bold";
  timeDisplay.style.marginBottom = "10px";

  // Append this element to the display container
  display.appendChild(timeDisplay);
};

// Function to download the recorded audio as MP4
const downloadAudio = () => {
  const downloadLink = document.createElement("a");
  downloadLink.href = audioURL;
  downloadLink.setAttribute("download", "audio.mp4"); // Use mp4 file extension
  downloadLink.click();
};

// Helper function to create buttons dynamically
const addButton = (id, funString, text) => {
  const btn = document.createElement("button");
  btn.id = id;
  btn.setAttribute("onclick", funString);
  btn.textContent = text;
  controllerWrapper.append(btn);
};

// Helper function to add messages dynamically
const addMessage = (text) => {
  const msg = document.createElement("p");
  msg.textContent = text;
  display.append(msg);
};

// Helper function to add the audio element for playback
const addAudio = () => {
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
  console.log("Displayed Total Time:", formattedTime);
  _totalElaspedTime = formattedTime;
};

// Called when the recording is stopped
const stopRecording = () => {
  if (mediaRecorder.state === "recording" || mediaRecorder.state === "paused") {
    stopTimer(); // Stop the timer when recording stops
    totalElapsedTime += Date.now() - startTime; // Finalize total recording time

    displayTotalTime(totalElapsedTime); // Display total recording time immediately

    mediaRecorder.stop(); // Stop recording and trigger `mediaRecorder.onstop`

    stateIndex = 3; // Move to "Download" state
    application(stateIndex);
  }
};

// Function to send the recorded audio via EmailJS
const sendAudio = async () => {
  if (!audioURL) {
    alert("No audio to send.");
    return;
  }

  // Fetch the Blob object from the audio URL
  const response = await fetch(audioURL);
  const audioBlob = await response.blob();

  // Prepare FormData to send the audio file
  const formData = new FormData();
  formData.append("audioFile", audioBlob, "recording.mp4");

  try {
    const res = await fetch("http://localhost:3000/send-audio", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("Audio sent successfully!");
    } else {
      alert("Failed to send audio.");
    }
  } catch (error) {
    console.error("Error sending audio:", error);
    alert("An error occurred while sending the audio.");
  }
};

// Main function to handle the UI based on the current state
const application = (index) => {
  switch (State[index]) {
    case "Initial":
      clearDisplay();
      clearControls();

      addButton("record", "record()", "Start Recording");
      break;

    case "Record":
      clearDisplay();
      clearControls();

      addMessage("Recording...");
      addButton("pause", "pauseRecording()", "Pause Recording");
      addButton("stop", "stopRecording()", "Stop Recording");
      break;

    case "Paused":
      clearControls();
      clearDisplay();

      // Display the elapsed recording time instead of "Recording Paused..."
      displayElapsedTime(totalElapsedTime);

      addButton("resume", "resumeRecording()", "Resume Recording");
      addButton("stop", "stopRecording()", "Stop Recording");
      break;

    case "Download":
      clearControls();
      clearDisplay();

      addAudio();
      addTotalTimeDisplay(_totalElaspedTime);
      addButton("record", "record()", "Record Again");
      addButton("download", "downloadAudio()", "Download Audio");

      // Add "Send" button after recording stops
      addButton("send", "sendAudio()", "Send Audio");
      break;

    default:
      clearControls();
      clearDisplay();

      addMessage("Your browser does not support mediaDevices");
      break;
  }
};

application(stateIndex);
