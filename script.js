document.addEventListener('DOMContentLoaded', function() {
    // ========== DOM Elements ==========
    const audio = document.getElementById('audio');
    const playBtn = document.querySelector('.play-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const shuffleBtn = document.querySelector('.shuffle-btn');
    const repeatBtn = document.querySelector('.repeat-btn');
    const progressBar = document.querySelector('.progress-bar');
    const currentTimeEl = document.querySelector('.current-time');
    const durationEl = document.querySelector('.duration');
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeIcon = document.querySelector('.volume-icon');
    const playlistEl = document.querySelector('.playlist');
    const addSongBtn = document.querySelector('.add-song-btn');
    const fileInput = document.getElementById('file-input');
    const songTitleEl = document.querySelector('.song-title');
    const artistNameEl = document.querySelector('.artist-name');
    const albumNameEl = document.querySelector('.album-name');
    const albumArtEl = document.querySelector('.album-art');

    // ========== Player State ==========
    let songs = [
        {
            title: "Blinding Lights",
            artist: "The Weeknd",
            album: "After Hours",
            path: "assets/audio/song1.mp3",
            cover: "assets/images/album1.jpg",
            duration: "3:20"
        },
        {
            title: "Save Your Tears",
            artist: "The Weeknd",
            album: "After Hours",
            path: "assets/audio/song2.mp3",
            cover: "assets/images/album2.jpg",
            duration: "3:35"
        },
        {
            title: "Starboy",
            artist: "The Weeknd ft. Daft Punk",
            album: "Starboy",
            path: "assets/audio/song3.mp3",
            cover: "assets/images/album3.jpg",
            duration: "3:50"
        }
    ];

    let currentSongIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;
    let isDraggingProgress = false;

    // ========== Core Functions ==========
    function initPlayer() {
        renderPlaylist();
        loadSong(currentSongIndex);
        updatePlaylistUI();
        updateVolumeIcon();
        addDynamicStyles();
    }

    function loadSong(index) {
        try {
            const song = songs[index];
            audio.src = song.path;
            songTitleEl.textContent = song.title;
            artistNameEl.textContent = song.artist;
            albumNameEl.textContent = song.album;
            albumArtEl.src = song.cover;
            albumArtEl.alt = `${song.title} album art`;
            durationEl.textContent = song.duration;
            
            // Preload the next song for smoother transitions
            if (index < songs.length - 1) {
                const nextSong = new Audio(songs[index + 1].path);
                nextSong.preload = 'metadata';
            }
        } catch (error) {
            console.error("Error loading song:", error);
            showError("Error loading song");
        }
    }

    function playSong() {
        audio.play()
            .then(() => {
                isPlaying = true;
                updatePlayButton();
                albumArtEl.classList.add('rotate');
            })
            .catch(error => {
                console.error("Playback failed:", error);
                showError("Playback failed - check console");
            });
    }

    function pauseSong() {
        audio.pause();
        isPlaying = false;
        updatePlayButton();
        albumArtEl.classList.remove('rotate');
    }

    function updatePlayButton() {
        playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        playBtn.setAttribute('title', isPlaying ? 'Pause' : 'Play');
        playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    }

    // ========== Playlist Management ==========
    function renderPlaylist() {
        playlistEl.innerHTML = '';
        
        if (songs.length === 0) {
            playlistEl.innerHTML = '<li class="empty">No songs in playlist</li>';
            return;
        }

        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="song-name">${song.title}</span>
                <span class="song-duration">${song.duration}</span>
                <button class="remove-song" data-index="${index}" aria-label="Remove song">
                    <i class="fas fa-times"></i>
                </button>
            `;
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.remove-song')) {
                    playSongFromPlaylist(index);
                }
            });
            playlistEl.appendChild(li);
        });
    }

    function playSongFromPlaylist(index) {
        currentSongIndex = index;
        loadSong(currentSongIndex);
        if (isPlaying) {
            playSong();
        }
        updatePlaylistUI();
    }

    function updatePlaylistUI() {
        document.querySelectorAll('.playlist li').forEach((item, index) => {
            item.classList.toggle('active', index === currentSongIndex);
            item.setAttribute('aria-current', index === currentSongIndex ? 'true' : 'false');
        });
    }

    // ========== Song Navigation ==========
    function prevSong() {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        changeSong();
    }

    function nextSong() {
        if (isShuffle) {
            shuffleSong();
        } else {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
        }
        changeSong();
    }

    function changeSong() {
        if (songs.length === 0) return;
        
        loadSong(currentSongIndex);
        if (isPlaying) {
            playSong();
        }
        updatePlaylistUI();
    }

    function shuffleSong() {
        if (songs.length < 2) return;
        
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * songs.length);
        } while (newIndex === currentSongIndex);
        
        currentSongIndex = newIndex;
    }

    // ========== Progress Bar ==========
    function updateProgressBar() {
        if (isDraggingProgress) return;
        
        const progressPercent = (audio.currentTime / audio.duration) * 100 || 0;
        progressBar.style.setProperty('--progress', `${progressPercent}%`);
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }

    function setProgress(e) {
        const width = progressBar.clientWidth;
        const clickX = e.offsetX;
        audio.currentTime = (clickX / width) * audio.duration;
    }

    function startDrag() {
        isDraggingProgress = true;
    }

    function endDrag() {
        isDraggingProgress = false;
        updateProgressBar();
    }

    // ========== Volume Control ==========
    function setVolume() {
        audio.volume = volumeSlider.value;
        updateVolumeIcon();
    }

    function updateVolumeIcon() {
        const volume = audio.volume;
        let iconClass = 'fa-volume-up';
        
        if (volume === 0) {
            iconClass = 'fa-volume-mute';
        } else if (volume < 0.5) {
            iconClass = 'fa-volume-down';
        }
        
        volumeIcon.className = `fas ${iconClass}`;
    }

    // ========== File Handling ==========
    async function addSongs(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        for (const file of files) {
            if (file.type.startsWith('audio/')) {
                try {
                    const metadata = await extractMetadata(file);
                    const newSong = {
                        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
                        artist: metadata.artist || "Unknown Artist",
                        album: metadata.album || "Unknown Album",
                        path: URL.createObjectURL(file),
                        cover: metadata.cover || "assets/images/default.jpg",
                        duration: metadata.duration ? formatTime(metadata.duration) : "0:00"
                    };
                    songs.push(newSong);
                } catch (error) {
                    console.error("Error processing file:", file.name, error);
                    // Fallback for files without metadata
                    songs.push({
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        artist: "Unknown Artist",
                        album: "Unknown Album",
                        path: URL.createObjectURL(file),
                        cover: "assets/images/default.jpg",
                        duration: "0:00"
                    });
                }
            }
        }

        renderPlaylist();
        fileInput.value = '';
    }

    async function extractMetadata(file) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            
            audio.onloadedmetadata = () => {
                resolve({
                    duration: audio.duration
                });
            };
            
            // Fallback if metadata takes too long
            setTimeout(() => resolve({}), 1000);
        });
    }

    function removeSong(index) {
        // Revoke object URL to free memory
        if (songs[index].path.startsWith('blob:')) {
            URL.revokeObjectURL(songs[index].path);
        }
        
        songs.splice(index, 1);
        
        if (currentSongIndex >= index && currentSongIndex > 0) {
            currentSongIndex--;
        }
        
        renderPlaylist();
        
        if (songs.length > 0) {
            loadSong(currentSongIndex);
            if (isPlaying) {
                playSong();
            }
        } else {
            resetPlayer();
        }
        
        updatePlaylistUI();
    }

    function resetPlayer() {
        audio.src = '';
        songTitleEl.textContent = 'No songs in playlist';
        artistNameEl.textContent = '';
        albumNameEl.textContent = '';
        durationEl.textContent = '0:00';
        currentTimeEl.textContent = '0:00';
        progressBar.style.setProperty('--progress', '0%');
        pauseSong();
    }

    // ========== Utility Functions ==========
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function showError(message) {
        console.error(message);
        // You could add visual error feedback here
    }

    function addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .rotate {
                animation: rotation 8s infinite linear;
            }
            @keyframes rotation {
                from { transform: rotate(0deg); }
                to { transform: rotate(359deg); }
            }
            .progress-bar {
                --progress: 0%;
            }
            .progress-bar::before {
                width: var(--progress);
            }
        `;
        document.head.appendChild(style);
    }

    // ========== Event Listeners ==========
    playBtn.addEventListener('click', () => {
        if (songs.length === 0) return;
        isPlaying ? pauseSong() : playSong();
    });

    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.style.color = isShuffle ? '#4cc9f0' : 'white';
        shuffleBtn.setAttribute('aria-pressed', isShuffle);
    });
    
    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        repeatBtn.style.color = isRepeat ? '#4cc9f0' : 'white';
        repeatBtn.setAttribute('aria-pressed', isRepeat);
    });

    progressBar.addEventListener('click', setProgress);
    progressBar.addEventListener('mousedown', startDrag);
    document.addEventListener('mouseup', endDrag);
    
    volumeSlider.addEventListener('input', setVolume);
    addSongBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', addSongs);

    playlistEl.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-song');
        if (removeBtn) {
            e.stopPropagation();
            removeSong(parseInt(removeBtn.dataset.index));
        }
    });

    audio.addEventListener('timeupdate', updateProgressBar);
    audio.addEventListener('ended', () => {
        if (isRepeat) {
            audio.currentTime = 0;
            audio.play();
        } else {
            nextSong();
        }
    });
    
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
        if (currentSongIndex >= 0 && currentSongIndex < songs.length) {
            songs[currentSongIndex].duration = formatTime(audio.duration);
            renderPlaylist();
        }
    });
    
    audio.addEventListener('error', () => {
        showError("Error playing audio");
        nextSong();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (songs.length > 0) isPlaying ? pauseSong() : playSong();
                break;
            case 'ArrowLeft':
                audio.currentTime = Math.max(0, audio.currentTime - 5);
                break;
            case 'ArrowRight':
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
                break;
            case 'ArrowUp':
                volumeSlider.value = Math.min(1, parseFloat(volumeSlider.value) + 0.1);
                setVolume();
                break;
            case 'ArrowDown':
                volumeSlider.value = Math.max(0, parseFloat(volumeSlider.value) - 0.1);
                setVolume();
                break;
        }
    });

    // Initialize the player
    initPlayer();
});