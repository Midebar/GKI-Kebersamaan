/* host_controls.js — Group Scoring Engine */

function loadHostScoreboard() {
    fetch('/api/teams/') // Ensure this matches your urls.py for the Team model
        .then(res => res.json())
        .then(data => {
            const board = document.getElementById('host-scoreboard');
            if (!board) return; // Skip if not on a game page
            
            board.innerHTML = '';
            data.teams.forEach(team => {
                board.innerHTML += `<div class="team-score-pill">${team.name}: <span id="score-${team.id}">${team.score}</span></div>`;
            });
        }).catch(err => console.log("No teams active or endpoint missing.", err));
}

function showAwardButtons() {
    const controls = document.getElementById('host-controls');
    const btns = document.getElementById('award-buttons');
    if (!controls || !btns) return;

    fetch('/api/teams/')
        .then(res => res.json())
        .then(data => {
            btns.innerHTML = '';
            data.teams.forEach(team => {
                btns.innerHTML += `<button class="btn-primary small" onclick="awardPoints(${team.id}, '${team.name}')">+ Poin ${team.name}</button>`;
            });
            controls.style.display = 'block';
        });
}

function awardPoints(teamId, teamName) {
    fetch('/api/award-points/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId, points: 10 })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            document.getElementById(`score-${teamId}`).innerText = data.new_score;
            document.getElementById('host-controls').style.display = 'none'; // Hide after awarding
            alert(`10 Poin ditambahkan untuk ${teamName}!`);
        }
    });
}

// Load scoreboard on page load
document.addEventListener("DOMContentLoaded", loadHostScoreboard);