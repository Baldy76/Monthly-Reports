if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.error(err));
}

// YOUR GOOGLE SCRIPT URL
const API_URL = "https://script.google.com/macros/s/AKfycbwy0zBP1K4AHAwRjjXAckkUpBqFBRzWBSFq4Fq7_05ftRKYBXVw3bhUecelgZEJYMPn/exec";

const TOTAL_PEOPLE = 13; 
let progressData = JSON.parse(localStorage.getItem('monthlyReportsTracker')) || {};

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

const sharedCheckbox = document.getElementById('shared');
const auxPioneerCheckbox = document.getElementById('auxPioneer');
const regPioneerCheckbox = document.getElementById('regPioneer');
const hoursInput = document.getElementById('hours');

function handlePioneerLogic(clickedType) {
  if (clickedType === 'aux' && auxPioneerCheckbox.checked) {
    regPioneerCheckbox.checked = false;
  } else if (clickedType === 'reg' && regPioneerCheckbox.checked) {
    auxPioneerCheckbox.checked = false;
  }

  const isPioneering = auxPioneerCheckbox.checked || regPioneerCheckbox.checked;

  if (isPioneering) {
    sharedCheckbox.checked = false; 
    sharedCheckbox.disabled = true; 
    sharedCheckbox.parentNode.style.opacity = "0.4"; 
    hoursInput.required = true; 
    hoursInput.placeholder = "Hours are required!";
  } else {
    sharedCheckbox.disabled = false; 
    sharedCheckbox.parentNode.style.opacity = "1"; 
    hoursInput.required = false; 
    hoursInput.placeholder = "0";
  }
}

auxPioneerCheckbox.addEventListener('change', () => handlePioneerLogic('aux'));
regPioneerCheckbox.addEventListener('change', () => handlePioneerLogic('reg'));

monthSelect.addEventListener('change', updateUI);
nameSelect.addEventListener('change', checkNameStatus);

function updateUI() {
  const month = monthSelect.value;
  if (!month) {
    progressContainer.style.display = 'none';
    return;
  }
  
  progressContainer.style.display = 'block';
  const completedNames = progressData[month] || [];
  const count = completedNames.length;

  for (let i = 0; i < nameSelect.options.length; i++) {
    let opt = nameSelect.options[i];
    if (opt.value !== "") { 
      if (completedNames.includes(opt.value)) {
        opt.text = opt.value + " ✅"; 
      } else {
        opt.text = opt.value; 
      }
    }
  }
  
  progressText.innerText = `${count}/${TOTAL_PEOPLE} Collected`;
  progressBarFill.style.width = `${(count / TOTAL_PEOPLE) * 100}%`;
  
  if (count > 0 && count < TOTAL_PEOPLE) {
    monthSelect.disabled = true;
    monthLockMsg.style.display = 'block';
    monthLockMsg.innerText = "🔒 Month locked until all reports are collected.";
    monthLockMsg.style.color = "#d9534f"; 
  } else if (count === TOTAL_PEOPLE) {
    monthSelect.disabled = false;
    monthLockMsg.style.display = 'block';
    monthLockMsg.innerText = "🎉 All reports collected! You can select a new month.";
    monthLockMsg.style.color = "#28a745"; 
  } else {
    monthSelect.disabled = false;
    monthLockMsg.style.display = 'none';
  }
  
  checkNameStatus(); 
}

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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  submitBtn.disabled = true;
  submitBtn.innerText = "Sending to Sheets...";
  statusDiv.style.display = 'none';

  const selectedMonth = monthSelect.value;
  const selectedName = nameSelect.value;

  let finalShared = sharedCheckbox.checked ? "Y" : "N";
  let finalAuxPioneer = auxPioneerCheckbox.checked ? "Y" : ""; 

  if (auxPioneerCheckbox.checked || regPioneerCheckbox.checked) {
    finalShared = ""; 
  }
  if (regPioneerCheckbox.checked) {
    finalAuxPioneer = ""; 
  }

  const payload = {
    personName: selectedName,
    month: selectedMonth,
    shared: finalShared, 
    studies: document.getElementById('studies').value || "",
    auxPioneer: finalAuxPioneer, 
    hours: hoursInput.value || "",
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
      
      if (!progressData[selectedMonth]) progressData[selectedMonth] = [];
      if (!progressData[selectedMonth].includes(selectedName)) {
        progressData[selectedMonth].push(selectedName);
        localStorage.setItem('monthlyReportsTracker', JSON.stringify(progressData));
      }
      
      form.reset();
      
      sharedCheckbox.disabled = false;
      sharedCheckbox.parentNode.style.opacity = "1"; 
      hoursInput.required = false;
      hoursInput.placeholder = "0";

      monthSelect.value = selectedMonth; 
      updateUI();
      
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
