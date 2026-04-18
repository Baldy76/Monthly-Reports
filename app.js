// Register the Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Service Worker Registered"))
    .catch(err => console.error("Service Worker Failed", err));
}

// Your Apps Script URL
const API_URL = "https://script.google.com/macros/s/AKfycbyfOhuvz3_YAmGA-0lcIIKnz0pOyFU34ePHaJMphn2SrNUnkN84fwbyh6fefuzapROL/exec";

const form = document.getElementById('dataForm');
const submitBtn = document.getElementById('submitBtn');
const statusDiv = document.getElementById('status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Change button state to prevent double-taps
  submitBtn.disabled = true;
  submitBtn.innerText = "Sending to Sheets...";
  statusDiv.style.display = 'none';

  // Gather data from the form
  const payload = {
    personName: document.getElementById('personName').value,
    month: document.getElementById('month').value,
    shared: document.getElementById('shared').checked ? "Y" : "",
    studies: document.getElementById('studies').value || "",
    auxPioneer: document.getElementById('auxPioneer').checked ? "Y" : "",
    hours: document.getElementById('hours').value || "",
    remarks: document.getElementById('remarks').value || ""
  };

  try {
    // We send as 'text/plain' to avoid CORS preflight errors with Google Apps Script
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success") {
      statusDiv.className = "success";
      statusDiv.innerText = "Success! Data saved to Google Sheets.";
      form.reset(); // Clear the form for the next entry
    } else {
      throw new Error(result.message || "Unknown error occurred.");
    }
  } catch (error) {
    statusDiv.className = "error";
    statusDiv.innerText = "Error: " + error.message;
  } finally {
    // Reset button
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Data";
    statusDiv.style.display = 'block';
  }
});
