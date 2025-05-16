const form = document.getElementById('medicalForm');
const bmiDisplay = document.getElementById('bmiValue');
const bmiClass = document.getElementById('bmiClass');
const patientPanel = document.getElementById('patientPanel');
const admitBtn = document.getElementById('admitBtn');
const dischargeBtn = document.getElementById('dischargeBtn');
const patientSelect = document.getElementById('patientSelect');

// ----- Tabs -----
document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ----- BMI Calculation -----
function calculateBMI(h, w) {
  if (!h || !w) return null;
  const meters = h / 100;
  return +(w / (meters * meters)).toFixed(1);
}
function classifyBMI(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// Inline BMI update
form.addEventListener('input', () => {
  const height = parseFloat(form.height.value);
  const weight = parseFloat(form.weight.value);
  const bmi = calculateBMI(height, weight);
  if (bmi) {
    bmiDisplay.textContent = bmi;
    bmiClass.textContent = `(${classifyBMI(bmi)})`;
  } else {
    bmiDisplay.textContent = '–';
    bmiClass.textContent = '';
  }
});

// Show/hide inline errors
function showError(field, msg) {
  const e = document.getElementById(`error-${field}`);
  if (e) {
    e.textContent = msg;
    e.style.display = 'block';
  }
}
function clearErrors() {
  document.querySelectorAll('.error').forEach(e => {
    e.textContent = '';
    e.style.display = 'none';
  });
}

// Convert image to base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

// ----- Submit Form -----
form.addEventListener('submit', async e => {
  e.preventDefault();
  clearErrors();

  const data = Object.fromEntries(new FormData(form).entries());
  let valid = true;

  const required = ['name', 'dob', 'gender', 'height', 'weight', 'bp', 'hr', 'emergencyPhone', 'emergencyName'];

  required.forEach(f => {
    if (!data[f]) {
      showError(f, `${f} is required`);
      valid = false;
    }
  });

  const hr = parseInt(data.hr);
  const bpPattern = /^\d{2,3}\/\d{2,3}$/;
  if (isNaN(hr) || hr < 40 || hr > 180) {
    showError('hr', 'Heart rate must be 40–180 bpm');
    valid = false;
  }
  if (!bpPattern.test(data.bp)) {
    showError('bp', 'Format must be ###/## (e.g. 120/80)');
    valid = false;
  }

  if (!valid) return;

  data.bmi = calculateBMI(parseFloat(data.height), parseFloat(data.weight));
  data.bmiClass = classifyBMI(data.bmi);

  // Convert image
  const fileInput = form.photo;
  if (fileInput.files.length) {
    data.photo = await toBase64(fileInput.files[0]);
  }

  // Save to array in localStorage
  let patients = JSON.parse(localStorage.getItem('patients') || '[]');
  patients.push(data);
  localStorage.setItem('patients', JSON.stringify(patients));

  renderPatientSelect(patients.length - 1);
  form.reset();
  bmiDisplay.textContent = '–';
  bmiClass.textContent = '';
});

// ----- Render Dropdown + Panel -----
function renderPatientSelect(selectedIndex = 0) {
  const patients = JSON.parse(localStorage.getItem('patients') || '[]');

  if (!patients.length) {
    patientPanel.innerHTML = '<p>No patient selected.</p>';
    patientSelect.innerHTML = '<option>No data</option>';
    return;
  }

  patientSelect.innerHTML = '';
  patients.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${p.name} (${p.gender})`;
    patientSelect.appendChild(opt);
  });

  patientSelect.selectedIndex = selectedIndex;
  displayPatient(patients[selectedIndex]);
}

patientSelect.addEventListener('change', () => {
  const index = patientSelect.value;
  const patients = JSON.parse(localStorage.getItem('patients') || '[]');
  if (patients[index]) {
    displayPatient(patients[index]);
  }
});

// ----- Display Selected Patient -----
function displayPatient(p) {
  if (!p) return;

  const photoHTML = p.photo
    ? `<img src="${p.photo}" alt="Patient photo"/>`
    : '';

  const html = `
    <div class="patient-info">
      ${photoHTML}
      <div class="patient-details">
        <strong>Name:</strong><div>${p.name}</div>
        <strong>DOB:</strong><div>${p.dob}</div>
        <strong>Gender:</strong><div>${p.gender}</div>
        <strong>Height:</strong><div>${p.height} cm</div>
        <strong>Weight:</strong><div>${p.weight} kg</div>
        <strong>BMI:</strong><div>${p.bmi} (${p.bmiClass})</div>
        <strong>Blood Pressure:</strong><div>${p.bp}</div>
        <strong>Heart Rate:</strong><div>${p.hr} bpm</div>
        <strong>Contact:</strong><div>${p.emergencyName} (${p.emergencyPhone})</div>
        <strong>History:</strong><div>${p.history || 'None'}</div>
        <strong>Medications:</strong><div>${p.medications || 'None'}</div>
        <strong>Allergies:</strong><div>${p.allergies || 'None'}</div>
        <strong>Email:</strong><div>${p.email || 'N/A'}</div>
      </div>
    </div>
  `;

  patientPanel.innerHTML = html;
}


// ----- Admit / Discharge -----
admitBtn.addEventListener('click', () => {
  const name = patientSelect.options[patientSelect.selectedIndex]?.textContent || 'Patient';
  alert(`${name} admitted.`);
});

dischargeBtn.addEventListener('click', () => {
  const name = patientSelect.options[patientSelect.selectedIndex]?.textContent || 'Patient';
  alert(`${name} discharged.`);
});

// ----- On Load -----
window.addEventListener('DOMContentLoaded', () => {
  renderPatientSelect();
});
const clearAllBtn = document.getElementById('clearAllBtn');
clearAllBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete all patient data?')) {
    localStorage.removeItem('patients');
    patientSelect.innerHTML = '<option>No data</option>';
    patientPanel.innerHTML = '<p>No patient selected.</p>';
  }
});
//testing