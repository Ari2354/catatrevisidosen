const exportTxtBtn = document.getElementById('exportTxtBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

// Ekspor ke TXT
exportTxtBtn.addEventListener('click', () => {
    const noteText = transcriptEl.textContent.trim();
    if (noteText) {
        const blob = new Blob([noteText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `revisi-dosen-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
    } else {
        alert('Tidak ada teks untuk diekspor');
    }
});

// Ekspor ke PDF (menggunakan jsPDF library)
exportPdfBtn.addEventListener('click', () => {
    const noteText = transcriptEl.textContent.trim();
    if (noteText) {
        // Load jsPDF dari CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFont('helvetica');
            doc.setFontSize(12);
            
            // Split teks ke multiple lines
            const lines = doc.splitTextToSize(noteText, 180);
            
            doc.text('Catatan Revisi Dosen', 105, 15, { align: 'center' });
            doc.text(lines, 15, 30);
            
            doc.save(`revisi-dosen-${new Date().toISOString().slice(0, 10)}.pdf`);
        };
        document.head.appendChild(script);
    } else {
        alert('Tidak ada teks untuk diekspor');
    }
});
