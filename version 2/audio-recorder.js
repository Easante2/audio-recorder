let mediaRecorder;
let audioChunks = [];
let audioBlob;
let audioURL;
let startTime;
let timerInterval;
const startButton = document.getElementById("startRecord");
const stopButton = document.getElementById("stopRecord");
const audioPlayback = document.getElementById("audioPlayback");
const submitButton = document.getElementById("submitRecording");
const timestamp = document.getElementById("timestamp");
const recordingTime = document.getElementById("recordingTime");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const audioPlaybackSection = document.querySelector('.mt-6'); // Get the audio preview section

// Hide the audio preview section by default
audioPlaybackSection.classList.add('hidden');

function getReadableTimestamp() {
  const now = new Date();
  return now.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

function startTimer() {
  let elapsedSeconds = 0;
  recordingTime.textContent = formatTime(elapsedSeconds);
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    recordingTime.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function handlePermissionError(error) {
  if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
    alert(
      "Microphone access is denied. Please enable microphone permissions in your browser settings to record audio."
    );
  } else if (error.name === "NotFoundError") {
    alert("No microphone found on your device.");
  } else {
    alert("Error accessing the microphone: " + error.message);
  }
}

startButton.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startButton.disabled = true;
    stopButton.disabled = false;
    startButton.classList.add("opacity-50", "cursor-not-allowed");
    stopButton.classList.remove("opacity-50", "cursor-not-allowed");

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      stopTimer();

      audioBlob = new Blob(audioChunks, { type: "audio/mp4" });
      audioURL = URL.createObjectURL(audioBlob);

      audioPlayback.src = audioURL;
      audioPlaybackSection.classList.remove('hidden'); // Show the audio preview section
      submitButton.classList.remove("hidden");

      audioChunks = [];
    };

    startTime = new Date();
    mediaRecorder.start();
    startTimer();
  } catch (error) {
    handlePermissionError(error);
    startButton.disabled = false;
    stopButton.disabled = true;
    startButton.classList.remove("opacity-50", "cursor-not-allowed");
    stopButton.classList.add("opacity-50", "cursor-not-allowed");
  }
});

stopButton.addEventListener("click", () => {
  mediaRecorder.stop();
  startButton.disabled = false;
  stopButton.disabled = true;
  startButton.classList.remove("opacity-50", "cursor-not-allowed");
  stopButton.classList.add("opacity-50", "cursor-not-allowed");

  timestamp.textContent += ` Complete`;
});

// Get form element and error elements
const form = document.getElementById('recordingForm');
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');

// Function to validate form
function validateForm() {
  let isValid = true;
  
  // Reset error messages
  nameError.classList.add('hidden');
  emailError.classList.add('hidden');
  
  // Check name validation
  if (!nameInput.validity.valid) {
    nameError.classList.remove('hidden');
    isValid = false;
  }
  
  // Check email validation
  if (!emailInput.validity.valid) {
    emailError.classList.remove('hidden');
    isValid = false;
  }
  
  return isValid;
}

// Handle form submission
submitButton.addEventListener('click', async (e) => {
  e.preventDefault();
  
  if (!audioURL) {
    alert("No recording available to submit.");
    return;
  }
  
  // Only validate and submit if form is valid
  if (!validateForm()) {
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...';
    
    // Fetch the audio blob
    const response = await fetch(audioURL);
    const audioBlob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append("audioFile", audioBlob, "recording.mp4");
    formData.append("name", nameInput.value);
    formData.append("email", emailInput.value);

    // Send the request
    const res = await fetch("https://quadrithm.co.uk/sendAudio.php", {
      method: "POST",
      body: formData,
    });

    const result = await res.text();
    alert(result);

    if (res.ok) {
        location.reload();
      }
    
  } catch (error) {
    console.error("Error submitting recording:", error);
    alert("Failed to submit recording. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Submit Recording';
  }
});
