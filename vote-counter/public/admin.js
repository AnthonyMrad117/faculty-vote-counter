const socket = io();
let charts = {};
let voteData = {};

// Faculty data structure
const facultyOrder = ['F.ENG', 'F.BAE', 'F.NAS', 'F.AAD', 'F.HUM', 'F.NHS'];

// Initialize on page load
socket.on('connect', () => {
    console.log('Connected as admin:', socket.id);
    
    // Re-authenticate with server using stored password
    const storedPassword = sessionStorage.getItem('adminPassword');
    if (storedPassword) {
        socket.emit('requestAdmin', storedPassword);
        // Clear password after use for security
        sessionStorage.removeItem('adminPassword');
    } else {
        // No password stored, redirect to home
        alert('Please authenticate as admin first.');
        window.location.href = '/';
        return;
    }
    
    // Request current vote data immediately
    socket.emit('requestVoteData');
});

// Handle authentication failure
socket.on('adminDenied', () => {
    alert('Authentication failed. Redirecting to home...');
    window.location.href = '/';
});

socket.on('voteUpdate', (data) => {
    voteData = data;
    initializeDashboard();
});

function initializeDashboard() {
    const grid = document.getElementById('facultiesGrid');
    grid.innerHTML = '';

    facultyOrder.forEach(facultyKey => {
        const faculty = voteData[facultyKey];
        if (!faculty) return;

        const card = document.createElement('div');
        card.className = 'faculty-card';
        card.innerHTML = `
            <div class="faculty-name">${faculty.name}</div>
            <div class="faculty-info">Total: ${faculty.total} people</div>
            <div class="chart-container">
                <canvas id="chart-${facultyKey}"></canvas>
            </div>
            <div class="vote-buttons">
                <button class="vote-btn elector1" onclick="submitVote('${facultyKey}', 'elector1')">
                    Vote ${faculty.elector1}
                </button>
                <button class="vote-btn elector2" onclick="submitVote('${facultyKey}', 'elector2')">
                    Vote ${faculty.elector2}
                </button>
                <button class="vote-btn blank" onclick="submitVote('${facultyKey}', 'blank')">
                    Blank Vote
                </button>
            </div>
            <div class="vote-stats">
                <p><strong>${faculty.elector1}:</strong> ${faculty.votes.elector1} votes (${getPercentage(faculty.votes.elector1, faculty)}%)</p>
                <p><strong>${faculty.elector2}:</strong> ${faculty.votes.elector2} votes (${getPercentage(faculty.votes.elector2, faculty)}%)</p>
                <p><strong>Blank:</strong> ${faculty.votes.blank} votes (${getPercentage(faculty.votes.blank, faculty)}%)</p>
                <p class="total">Total Votes: ${getTotalVotes(faculty)}</p>
            </div>
        `;
        grid.appendChild(card);

        // Create chart
        createChart(facultyKey, faculty);
    });
}

function createChart(facultyKey, faculty) {
    const ctx = document.getElementById(`chart-${facultyKey}`);
    if (!ctx) return;

    const totalVotes = getTotalVotes(faculty);
    
    const data = {
        labels: [
            faculty.elector1,
            faculty.elector2,
            'Blank'
        ],
        datasets: [{
            data: [
                faculty.votes.elector1,
                faculty.votes.elector2,
                faculty.votes.blank
            ],
            backgroundColor: [
                'rgba(102, 126, 234, 0.8)',
                'rgba(240, 147, 251, 0.8)',
                'rgba(79, 172, 254, 0.8)'
            ],
            borderColor: [
                'rgba(102, 126, 234, 1)',
                'rgba(240, 147, 251, 1)',
                'rgba(79, 172, 254, 1)'
            ],
            borderWidth: 2
        }]
    };

    const config = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = totalVotes > 0 ? ((value / totalVotes) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };

    // Destroy existing chart if it exists
    if (charts[facultyKey]) {
        charts[facultyKey].destroy();
    }

    charts[facultyKey] = new Chart(ctx, config);
}

function submitVote(faculty, voteType) {
    socket.emit('submitVote', { faculty, voteType });
}

function getTotalVotes(faculty) {
    return faculty.votes.elector1 + faculty.votes.elector2 + faculty.votes.blank;
}

function getPercentage(votes, faculty) {
    const total = getTotalVotes(faculty);
    if (total === 0) return 0;
    return ((votes / total) * 100).toFixed(1);
}

// Update charts when vote data changes
socket.on('voteUpdate', (data) => {
    voteData = data;
    
    facultyOrder.forEach(facultyKey => {
        const faculty = voteData[facultyKey];
        if (faculty && charts[facultyKey]) {
            charts[facultyKey].data.datasets[0].data = [
                faculty.votes.elector1,
                faculty.votes.elector2,
                faculty.votes.blank
            ];
            charts[facultyKey].update();
            
            // Update vote stats
            const card = document.querySelector(`#facultiesGrid .faculty-card:nth-child(${facultyOrder.indexOf(facultyKey) + 1})`);
            if (card) {
                const statsDiv = card.querySelector('.vote-stats');
                statsDiv.innerHTML = `
                    <p><strong>${faculty.elector1}:</strong> ${faculty.votes.elector1} votes (${getPercentage(faculty.votes.elector1, faculty)}%)</p>
                    <p><strong>${faculty.elector2}:</strong> ${faculty.votes.elector2} votes (${getPercentage(faculty.votes.elector2, faculty)}%)</p>
                    <p><strong>Blank:</strong> ${faculty.votes.blank} votes (${getPercentage(faculty.votes.blank, faculty)}%)</p>
                    <p class="total">Total Votes: ${getTotalVotes(faculty)}</p>
                `;
            }
        }
    });
});


