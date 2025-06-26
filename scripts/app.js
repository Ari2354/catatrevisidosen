const firebaseConfig = {
  apiKey: "AIzaSyCOcZclfj3lRj3h6p0602f-uBi4COzPmeE",
  authDomain: "donatku-b9892.firebaseapp.com",
  projectId: "donatku-b9892",
  storageBucket: "donatku-b9892.appspot.com",
  messagingSenderId: "710470592039",
  appId: "1:710470592039:web:33ac69fbe2ac160f2b1002"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

const recordBtn = document.getElementById('recordBtn');
const transcriptEl = document.getElementById('transcript');
const notesList = document.getElementById('notesList');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const dateFilter = document.getElementById('dateFilter');
const filterBtn = document.getElementById('filterBtn');
const waveform = document.getElementById('waveform');
const recordingTime = document.getElementById('recordingTime');

let recognition;
let isRecording = false;
let recordingStartTime;
let recordingInterval;
let finalTranscript = '';
let lastFinalTranscript = '';

function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            isRecording = true;
            recordBtn.classList.add('recording');
            waveform.classList.add('active');
            startRecordingTimer();
            recordBtn.querySelector('span').textContent = 'Berhenti Rekam';
            recognitionRestarting = false;
        };

        recognition.onend = () => {
            if (isRecording && !recognitionRestarting) {
                recognitionRestarting = true;
                setTimeout(() => {
                    if (isRecording) {
                        recognition.start();
                    }
                    recognitionRestarting = false;
                }, 500);
            } else {
                recordBtn.classList.remove('recording');
                waveform.classList.remove('active');
                stopRecordingTimer();
                recordBtn.querySelector('span').textContent = 'Mulai Rekam';
            }
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.trim();
                if (event.results[i].isFinal) {
                    // Append only new unique final transcript parts
                    if (!lastFinalTranscript.includes(transcript)) {
                        finalTranscript += transcript + ' ';
                        lastFinalTranscript = transcript;
                    }
                } else {
                    interimTranscript += transcript;
                }
            }

            transcriptEl.textContent = finalTranscript + interimTranscript;
        };

        recognition.onerror = (event) => {
            console.error('Recognition error:', event.error);
            alert(`Error: ${event.error}`);
        };
    } else {
        alert('Browser Anda tidak mendukung Web Speech API. Silakan gunakan Chrome atau Edge versi terbaru.');
    }
}

function startRecordingTimer() {
    recordingStartTime = Date.now();
    recordingInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        recordingTime.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function stopRecordingTimer() {
    clearInterval(recordingInterval);
}

recordBtn.addEventListener('click', () => {
    if (!recognition) {
        initSpeechRecognition();
    }

    if (isRecording) {
        isRecording = false;
        recognition.stop();
        lastFinalTranscript = '';
    } else {
        finalTranscript = '';
        transcriptEl.textContent = '';
        isRecording = true;
        recognition.start();
    }
});

clearBtn.addEventListener('click', () => {
    transcriptEl.textContent = '';
    finalTranscript = '';
});

saveBtn.addEventListener('click', () => {
    const noteText = transcriptEl.textContent.trim();
    if (noteText) {
        const note = {
            id: Date.now(),
            text: noteText,
            date: new Date().toISOString(),
            displayDate: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        savedNotes.unshift(note);
        saveNotesToStorage();
        renderNotesList();
        transcriptEl.textContent = '';
        saveBtn.innerHTML = '<img src="assets/icons/save.svg" class="icon"> Tersimpan!';
        setTimeout(() => {
            saveBtn.innerHTML = '<img src="assets/icons/save.svg" class="icon"> Simpan';
        }, 2000);
    } else {
        alert('Tidak ada teks untuk disimpan');
    }
});

filterBtn.addEventListener('click', () => {
    renderNotesList();
});

function renderNotesList() {
    notesList.innerHTML = '';

    let filteredNotes = [...savedNotes];
    if (dateFilter.value) {
        const filterDate = new Date(dateFilter.value).toDateString();
        filteredNotes = filteredNotes.filter(note => {
            const noteDate = new Date(note.date).toDateString();
            return noteDate === filterDate;
        });
    }

    if (filteredNotes.length === 0) {
        notesList.innerHTML = '<li class="empty-message">Tidak ada catatan</li>';
        return;
    }

    filteredNotes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-item';
        li.innerHTML = `
            <div class="note-date">${note.displayDate}</div>
            <div class="note-preview">${note.text.substring(0, 100)}${note.text.length > 100 ? '...' : ''}</div>
        `;
        li.addEventListener('click', () => {
            transcriptEl.textContent = note.text;
            finalTranscript = note.text;
        });
        notesList.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadNotesFromStorage();
    renderNotesList();

    dateFilter.valueAsDate = new Date();

    // Inisialisasi ulasan pengguna
    renderReviewTable();

    // Event listener form ulasan
    const reviewForm = document.getElementById('reviewForm');
    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const reviewInput = document.getElementById('reviewInput');
        const reviewName = document.getElementById('reviewName');
        const reviewText = reviewInput.value.trim();
        const reviewUserName = reviewName.value.trim();
        if (reviewUserName === '') {
            alert('Nama wajib diisi');
            reviewName.focus();
            return;
        }
        if (reviewText) {
            addReview(reviewUserName, reviewText);
            reviewInput.value = '';
            reviewName.value = '';
        }
    });
});

function addReview(reviewName, reviewText) {
    db.collection("userReviews").add({
        name: reviewName,
        text: reviewText,
        timestamp: Date.now()
    }).then(() => {
        renderReviewTable();
    }).catch((error) => {
        console.error("Error menambahkan ulasan: ", error);
        alert("Gagal mengirim ulasan. Silakan coba lagi.");
    });
}

function renderReviewTable() {
    const reviewTableBody = document.getElementById('reviewTableBody');
    reviewTableBody.innerHTML = '';

    db.collection("userReviews").orderBy("timestamp", "desc").get()
    .then((querySnapshot) => {
        if (querySnapshot.empty) {
            reviewTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada ulasan</td></tr>';
            return;
        }

        let index = 1;
        querySnapshot.forEach((doc) => {
            const review = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index}</td>
                <td>${review.name || 'Anonim'}</td>
                <td>${review.text}</td>
            `;
            reviewTableBody.appendChild(tr);
            index++;
        });
    })
    .catch((error) => {
        console.error("Error memuat ulasan: ", error);
        reviewTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Gagal memuat ulasan</td></tr>';
    });
}
