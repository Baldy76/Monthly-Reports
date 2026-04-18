// Register the Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.error(err));
}

// Your existing Apps Script API URL
const API_URL = "https://script.google.com/macros/s/AKfycbwy0zBP1K4AHAwRjjXAckkUpBqFBRzWBSFq4Fq7_05ftRKYBXVw3bhUecelgZEJYMPn/exec";

// Setup for the Progress Tracker
const TOTAL_PEOPLE = 14;
// Load saved progress from the phone's internal memory
let progressData = JSON.parse(localStorage.getItem('monthlyReportsTracker')) || {};

// UI Elements
const form = document.getElementById('dataForm');
const monthSelect = document.getElementById('month');
const nameSelect = document.getElementById('personName');
const submitBtn = document.getElementById('submitBtn');
const statusDiv = document.getElementById('status');

const progressContainer = document.getElementById('progressContainer');
const progressText = document.getElementById('progressText');
const progressBarFill = document.getElementById('progressBarFill');
const completedBanner = document.getElementById('completedBanner');
const monthLockMsg = document.getElementById('monthLockMsg');

// Listen for dropdown changes to update the UI
monthSelect.addEventListener('change', updateUI);
nameSelect.addEventListener('change', checkNameStatus);

// Function to update the Progress Bar and lock/unlock the Month
function updateUI() {
  const month = monthSelect.value;
  if (!month) {
    progressContainer.style.display = 'none';
    return;
  }
  
  progressContainer.style.display = 'block';
  const completedNames = progressData[month] || [];
  const count = completedNames.length;
  
  // Update the visual bar and text
  progressText.innerText = `${count}/${TOTAL_PEOPLE} Collected`;
  progressBarFill.style.width = `${(count / TOTAL_PEOPLE) * 100}%`;
  
  // Determine if we should lock the month
  if (count > 0 && count < TOTAL_PEOPLE) {
    monthSelect.disabled = true;
    monthLockMsg.style.display = 'block';
    monthLockMsg.innerText = "🔒 Month locked until all 14 reports are collected.";
    monthLockMsg.style.color = "#d9534f"; // Red
  } else if (count === TOTAL_PEOPLE) {
    monthSelect.disabled = false;
    monthLockMsg.style.display = 'block';
    monthLockMsg.innerText = "🎉 All reports collected! You can select a new month.";
    monthLockMsg.style.color = "#28a745"; // Green
  } else {
    // Zero collected
    monthSelect.disabled = false;
    monthLockMsg.style.display = 'none';
  }
  
  checkNameStatus(); // See if the currently selected person is already done
}

// Function to show/hide the Green Banner if someone is already submitted
function checkNameStatus() {
  const month = monthSelect.value;
  const name = nameSelect.value;
  
  if (month && name) {
    const completedNames = progressData[month] || [];
    if (completedNames.includes(name)) {
      completedBanner.style.display = 'block';
      submitBtn.innerText = "Update / Overwrite Data";
    } else {
      completedBanner.style.display = 'none';
      submitBtn.innerText = "Submit Data";
    }
  } else {
    completedBanner.style.display = 'none';
  }
}

// Form Submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  submitBtn.disabled = true;
  submitBtn.innerText = "Sending to Sheets...";
  statusDiv.style.display = 'none';

  // Grab the selected month (even if the dropdown is currently locked/disabled)
  const selectedMonth = monthSelect.value;
  const selectedName = nameSelect.value;

  const payload = {
    personName: selectedName,
    month: selectedMonth,
    shared: document.getElementById('shared').checked ? "Y" : "",
    studies: document.getElementById('studies').value || "",
    auxPioneer: document.getElementById('auxPioneer').checked ? "Y" : "",
    hours: document.getElementById('hours').value || "",
    remarks: document.getElementById('remarks').value || ""
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success") {
      statusDiv.className = "success";
      statusDiv.style.display = 'block';
      statusDiv.innerText = "Success! Data saved to Google Sheets.";
      
      // Save this person to the phone's memory
      if (!progressData[selectedMonth]) progressData[selectedMonth] = [];
      if (!progressData[selectedMonth].includes(selectedName)) {
        progressData[selectedMonth].push(selectedName);
        localStorage.setItem('monthlyReportsTracker', JSON.stringify(progressData));
      }
      
      // Clear the form to get ready for the next person, but Keep the Month selected!
      form.reset();
      monthSelect.value = selectedMonth; 
      updateUI();
      
      // Hide the success message after 3 seconds to keep UI clean
      setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
      
    } else {
      throw new Error(result.message || "Unknown error occurred.");
    }
  } catch (error) {
    statusDiv.className = "error";
    statusDiv.style.display = 'block';
    statusDiv.innerText = "Error: " + error.message;
  } finally {
    submitBtn.disabled = false;
    checkNameStatus(); 
  }
});
