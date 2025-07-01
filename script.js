let songsData = { songs: [] };
let currentSongs = [];
let selectedInstrument = '';

// Load data from JSON file
async function loadSongsData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to load songs data');
        }
        songsData = await response.json();
        currentSongs = songsData.songs;
        renderSongs(currentSongs);
    } catch (error) {
        console.error('Error loading songs data:', error);
        showError('Failed to load songs data. Please check if data.json exists.');
    }
}

function renderSongs(songs) {
    const songsGrid = document.getElementById('songsGrid');
    const noResults = document.getElementById('noResults');
    const loading = document.getElementById('loading');

    // Hide loading
    if (loading) loading.style.display = 'none';

    if (songs.length === 0) {
        songsGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    songsGrid.style.display = 'grid';
    noResults.style.display = 'none';

    songsGrid.innerHTML = songs.map(song => `
        <div class="song-card">
            <div class="song-header">
                <div class="instrument-icon">
                    <img src="images/${song.instrument === 'Windsong Lyre' ? 'Item_Windsong_Lyre.webp' : 'Item_Lingering_Euphonia.webp'}" 
                         alt="${song.instrument}" 
                         title="${song.instrument}"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='${song.instrument === 'Windsong Lyre' ? '🎻' : '🎹'}';">
                </div>
                <div class="song-title">${song.name}</div>
            </div>
            <span class="difficulty difficulty-${song.difficulty.toLowerCase()}">${song.difficulty}</span>
            <div class="song-preview">${song.preview}</div>
            
            <div class="audio-controls">
                <audio controls class="audio-player">
                    <source src="${song.audioPath}" type="audio/mpeg">
                    <source src="${song.audioPath.replace('.mp3', '.ogg')}" type="audio/ogg">
                    <source src="${song.audioPath.replace('.mp3', '.wav')}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>
            
            <div class="notes-section">
                <button class="toggle-btn" onclick="openPopup(${song.id})">🎼 View Notes</button>
            </div>
            
            <div class="download-section">
                <a href="${song.midiPath}" download class="download-btn" onclick="handleDownload(event, '${song.midiPath}')">
                    📥 Download MIDI
                </a>
            </div>
        </div>
    `).join('');
}

function toggleNotes(songId) {
    const notesElement = document.getElementById(`notes-${songId}`);
    const toggleText = document.getElementById(`toggle-text-${songId}`);
    
    if (notesElement.classList.contains('collapsed')) {
        notesElement.classList.remove('collapsed');
        toggleText.textContent = 'Collapse';
    } else {
        notesElement.classList.add('collapsed');
        toggleText.textContent = 'Expand';
    }
}

function filterSongs() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    currentSongs = songsData.songs.filter(song => {
        const matchesInstrument = !selectedInstrument || song.instrument === selectedInstrument;
        const matchesSearch = !searchInput || song.name.toLowerCase().includes(searchInput);
        return matchesInstrument && matchesSearch;
    });

    renderSongs(currentSongs);
}

function handleDownload(event, midiPath) {
    fetch(midiPath, { method: 'HEAD' })
        .catch(() => {
            event.preventDefault();
            alert('MIDI file not found. Please make sure the file exists in the midi folder.');
        });
}

function showError(message) {
    const songsGrid = document.getElementById('songsGrid');
    const noResults = document.getElementById('noResults');
    const loading = document.getElementById('loading');

    if (loading) loading.style.display = 'none';
    songsGrid.style.display = 'none';
    noResults.style.display = 'block';
    noResults.innerHTML = `
        <h3>⚠️ Error</h3>
        <p>${message}</p>
    `;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    const customSelect = document.querySelector('.custom-select');
    const selectButton = customSelect.querySelector('.select-button');
    const selectOptions = customSelect.querySelector('.select-options');
    const searchInput = document.getElementById('searchInput');

    // Toggle options visibility with animation
    selectButton.addEventListener('click', function(event) {
        event.stopPropagation();
        selectOptions.classList.toggle('open');
    });

    // Handle option selection
    selectOptions.addEventListener('click', function(event) {
        if (event.target.tagName === 'LI') {
            selectedInstrument = event.target.getAttribute('data-value');
            selectButton.textContent = event.target.textContent;
            filterSongs();
            selectOptions.classList.remove('open');
        }
    });

    // Close options when clicking outside
    document.addEventListener('click', function(event) {
        if (!customSelect.contains(event.target)) {
            selectOptions.classList.remove('open');
        }
    });

    // Filter songs on search input
    if (searchInput) {
        searchInput.addEventListener('input', filterSongs);
    }

    // Load songs data
    loadSongsData();
});

// Export functions for global access
window.toggleNotes = toggleNotes;
window.handleDownload = handleDownload;

let selectedSong = null;

function openPopup(songId) {
    const song = songsData.songs.find(s => s.id === songId);
    if (!song) return;

    selectedSong = song;
    document.getElementById("popupTitle").textContent = song.name;
    document.getElementById("notePopup").classList.remove("hidden");
    
    // Show PC notes by default
    showNoteType('pc', false);
}

function showNoteType(type, animate = true) {
    const noteDisplay = document.getElementById('noteDisplay');
    const buttons = document.querySelectorAll('.note-type-buttons button');
    
    if (!selectedSong) return;
    
    // Update active button state
    buttons.forEach(button => {
        button.classList.remove('active');
        if (button.textContent.toLowerCase().includes(type)) {
            button.classList.add('active');
        }
    });

    // Get the correct notes based on type
    const notes = type === 'pc' ? selectedSong.notes.pc : selectedSong.notes.mobile;

    if (!animate) {
        noteDisplay.textContent = notes;
        noteDisplay.classList.add('active');
        return;
    }

    // Animate out current content
    noteDisplay.classList.remove('active');
    setTimeout(() => {
        noteDisplay.textContent = notes;
        // Force reflow to restart animation
        void noteDisplay.offsetWidth;
        noteDisplay.classList.add('active');
    }, 150);
}

function showNotes(songName) {
    const popup = document.getElementById('notePopup');
    const popupTitle = document.getElementById('popupTitle');
    const noteDisplay = document.getElementById('noteDisplay');
    const song = songsData.songs.find(s => s.name === songName);
    
    if (!song) return;
    
    selectedSong = song;
    popupTitle.textContent = songName;
    popup.classList.remove('hidden');
    showNoteType('pc', false);
}

function hideNotes() {
    const popup = document.getElementById('notePopup');
    const noteDisplay = document.getElementById('noteDisplay');
    // Start fade out animations
    noteDisplay.classList.remove('active');
    popup.classList.add('hidden');
    selectedSong = null;
}

// Add click outside popup to close
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('notePopup');
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            hideNotes();
        }
    });
});