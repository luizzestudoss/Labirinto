let photonClient = null;

import {PhotonGameClient, joinRoom, createRoom} from './server.js';

document.addEventListener("DOMContentLoaded", () => {
    const joinButton = document.getElementById("join-room");
    const createButton = document.getElementById("create-room-btn");
    const roomInput = document.getElementById("room-code");

    photonClient = new PhotonGameClient();
    photonClient.connectToRegionMaster("sa");

    joinButton.addEventListener("click", async () => {
        const roomCode = roomInput.value.trim();
        sessionStorage.setItem("roomName", roomCode);
        sessionStorage.setItem("State", "Join");
        window.location.href = "room.html";
    });

    createButton.addEventListener("click", async () => {
        try {
            const roomName = `${Math.floor(1000 + Math.random() * 9000)}`;
            sessionStorage.setItem("roomName", roomName);
            sessionStorage.setItem("State", "Create");
            window.location.href = "room.html";
        } catch (error) {
            console.error("Erro ao criar sala:", error);
        }
    });
});

window.joinRoom = joinRoom
window.createRoom = createRoom