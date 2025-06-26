let savedNotes = [];

// Simpan catatan ke localStorage
function saveNotesToStorage() {
    localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
}

// Load catatan dari localStorage
function loadNotesFromStorage() {
    const notes = localStorage.getItem('savedNotes');
    savedNotes = notes ? JSON.parse(notes) : [];
}

// Hapus catatan
function deleteNote(noteId) {
    savedNotes = savedNotes.filter(note => note.id !== noteId);
    saveNotesToStorage();
    renderNotesList();
}

window.savedNotes = savedNotes;
window.saveNotesToStorage = saveNotesToStorage;
window.loadNotesFromStorage = loadNotesFromStorage;
window.deleteNote = deleteNote;
