// --- 1. MODEL: Gerenciamento de Dados ---
const ParkingModel = {
    getTotalSpots() { return 30; },
    
    getReservations() {
        const data = localStorage.getItem('parking_reservations');
        return data ? JSON.parse(data) : [
            { id: 1, placa: "XYZ-9876", proprietario: "Carlos Silva", apartamento: "201", bloco: "B", modelo: "Civic", cor: "Preto", vaga: "5" },
            { id: 2, placa: "ABC-1234", proprietario: "Ana Souza", apartamento: "104", bloco: "A", modelo: "Corolla", cor: "Branco", vaga: "18" }
        ];
    },

    saveReservation(reservation) {
        const reservations = this.getReservations();
        reservations.push({ id: Date.now(), ...reservation });
        localStorage.setItem('parking_reservations', JSON.stringify(reservations));
    },

    removeReservation(id) {
        let reservations = this.getReservations();
        reservations = reservations.filter(r => r.id !== id);
        localStorage.setItem('parking_reservations', JSON.stringify(reservations));
    }
};

// --- 2. VIEW: Manipulação de Interface e Telas ---
const ParkingView = {
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        
        document.getElementById(`view-${viewId}`).classList.add('active');
        document.getElementById(`nav-${viewId}`).classList.add('active');

        if (viewId === 'listar') this.renderTable();
        if (viewId === 'disponiveis') this.renderParkingMap();
    },

    renderTable() {
        const tbody = document.getElementById('tabela-vagas');
        const reservations = ParkingModel.getReservations();
        
        tbody.innerHTML = '';
        if (reservations.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhuma vaga cadastrada.</td></tr>`;
            return;
        }

        reservations.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>Vaga ${r.vaga}</strong></td>
                <td>${r.placa}</td>
                <td>${r.proprietario}</td>
                <td>${r.apartamento} - ${r.bloco}</td>
                <td>${r.modelo} (${r.cor})</td>
                <td><button class="btn-delete" onclick="App.handleRemove(${r.id})">Remover</button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderParkingMap() {
        const mapContainer = document.getElementById('mapa-estacionamento');
        const reservations = ParkingModel.getReservations();
        const occupiedSpots = reservations.map(r => String(r.vaga));

        mapContainer.innerHTML = '';

        // Ala Superior (Vagas 1 a 15)
        const rowTop = document.createElement('div');
        rowTop.className = 'parking-row';
        for (let i = 1; i <= 15; i++) {
            rowTop.appendChild(this.createSpotElement(i, occupiedSpots));
        }

        // Rua Central de Circulação
        const road = document.createElement('div');
        road.className = 'parking-road';
        road.innerText = 'VIA DE CIRCULAÇÃO / RUA DO CONDOMÍNIO';

        // Ala Inferior (Vagas 16 a 30)
        const rowBottom = document.createElement('div');
        rowBottom.className = 'parking-row';
        for (let i = 16; i <= 30; i++) {
            rowBottom.appendChild(this.createSpotElement(i, occupiedSpots));
        }

        mapContainer.appendChild(rowTop);
        mapContainer.appendChild(road);
        mapContainer.appendChild(rowBottom);
    },

    createSpotElement(spotNumber, occupiedSpots) {
        const isOccupied = occupiedSpots.includes(String(spotNumber));
        const card = document.createElement('div');
        card.className = `spot-card ${isOccupied ? 'occupied' : 'available'}`;
        card.innerHTML = `V${spotNumber}<br><small>${isOccupied ? 'Ocupada' : 'Livre'}</small>`;
        return card;
    },

    clearForm() {
        document.getElementById('form-reserva').reset();
    }
};

// --- 3. CONTROLLER: Regras de Negócio e Eventos ---
const App = {
    init() {
        ParkingView.renderTable();
        this.setupPlateMask();
    },

    // Máscara automática de placa (estilo celular)
    setupPlateMask() {
        const inputPlaca = document.getElementById('placa');
        inputPlaca.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (value.length > 7) value = value.slice(0, 7);
            
            // Insere o hífen automaticamente após as 3 primeiras letras
            if (value.length > 3) {
                value = value.slice(0, 3) + '-' + value.slice(3);
            }
            e.target.value = value;
        });
    },

    switchView(viewId) {
        ParkingView.switchView(viewId);
    },

    handleSave(event) {
        event.preventDefault();

        const placaInput = document.getElementById('placa').value.trim();
        const vagaInput = parseInt(document.getElementById('vaga').value);

        // Validação estrita da placa com hífen (Ex: ABC-1234 ou ABC-1D23)
        const regexPlaca = /^([A-Z]{3}-[0-9]{4}|[A-Z]{3}-[0-9][A-Z][0-9]{2})$/;

        if (!regexPlaca.test(placaInput)) {
            alert("⚠️ Formato de placa inválido! Preencha corretamente (Ex: ABC-1234).");
            return;
        }

        if (vagaInput < 1 || vagaInput > 30) {
            alert("⚠️ Número de vaga inválido! Escolha uma vaga entre 1 e 30.");
            return;
        }

        // Verifica se a vaga já está ocupada
        const reservations = ParkingModel.getReservations();
        const spotTaken = reservations.find(r => parseInt(r.vaga) === vagaInput);
        if (spotTaken) {
            alert(`⚠️ Atenção: A vaga ${vagaInput} já está ocupada pelo veículo ${spotTaken.placa}!`);
            return;
        }

        const reservation = {
            placa: placaInput,
            proprietario: document.getElementById('proprietario').value,
            apartamento: document.getElementById('apartamento').value,
            bloco: document.getElementById('bloco').value,
            modelo: document.getElementById('modelo').value,
            cor: document.getElementById('cor').value,
            vaga: vagaInput
        };

        console.log("=== Nova Reserva Cadastrada ===");
        console.table(reservation);

        ParkingModel.saveReservation(reservation);
        alert("Cadastro realizado com sucesso!");

        ParkingView.clearForm();
        this.switchView('listar');
    },

    handleRemove(id) {
        if (confirm("Deseja realmente remover esta reserva?")) {
            ParkingModel.removeReservation(id);
            ParkingView.renderTable();
        }
    }
};

window.onload = () => App.init();