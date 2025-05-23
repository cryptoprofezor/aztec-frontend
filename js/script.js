document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const nodeForm = document.getElementById('node-form');
    const nodesList = document.getElementById('nodes-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-nodes');

    const viewModal = document.getElementById('view-modal');
    const viewModalClose = document.getElementById('view-modal-close');
    const closeViewModalBtn = document.getElementById('close-view-modal');
    const copyStartCommandBtn = document.getElementById('copy-start-command');
    const editStartCommandBtn = document.getElementById('edit-start-command-btn');
    const editStartCommandSection = document.getElementById('edit-start-command-section');
    const editStartCommandTextarea = document.getElementById('edit-start-command');
    const saveStartCommandBtn = document.getElementById('save-start-command');
    const cancelEditStartCommandBtn = document.getElementById('cancel-edit-start-command');

    const editModal = document.getElementById('edit-modal');
    const editModalClose = document.getElementById('edit-modal-close');
    const editForm = document.getElementById('edit-form');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveEditBtn = document.getElementById('save-edit');
    const deleteNodeBtn = document.getElementById('delete-node');

    const togglePrivateKeyBtn = document.getElementById('toggle-private-key');
    const privateKeyInput = document.getElementById('private-key');
    const toggleEditPrivateKeyBtn = document.getElementById('toggle-edit-private-key');
    const editPrivateKeyInput = document.getElementById('edit-private-key');

    const totalNodesEl = document.getElementById('total-nodes');
    const activeNodesEl = document.getElementById('active-nodes');
    const uniqueWalletsEl = document.getElementById('unique-wallets');

    const startCommandEl = document.getElementById('start-command');
    const logoutBtn = document.getElementById('logout-btn');

    let nodes = [];
    let filteredNodes = [];
    let currentNodeId = null;

    // Base URL for the backend
   const BASE_URL = 'http://34.44.154.88:3001';

    // Initial load
    loadNodes();
    loadStats();

    // Check if user is logged in
    if (!localStorage.getItem('token')) {
        window.location.href = '/login.html';
    }

    // Event Listeners
    nodeForm.addEventListener('submit', handleSubmit);
    searchInput.addEventListener('input', filterNodes);
    viewModalClose.addEventListener('click', () => viewModal.classList.add('hidden'));
    closeViewModalBtn.addEventListener('click', () => viewModal.classList.add('hidden'));
    editModalClose.addEventListener('click', () => editModal.classList.add('hidden'));
    cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));
    saveEditBtn.addEventListener('click', saveEdit);
    deleteNodeBtn.addEventListener('click', deleteNode);

    // Logout Handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        showNotification('Logged out successfully', 'success');
        setTimeout(() => window.location.href = '/login.html', 1000);
    });

    // Dynamically update Start Command when form inputs change
    ['node-name', 'ethereum-rpc', 'beacon-rpc', 'private-key', 'wallet-address', 'vps-ip'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateStartCommand);
    });

    // Initial update of Start Command
    updateStartCommand();

    togglePrivateKeyBtn.addEventListener('click', () => {
        const isPassword = privateKeyInput.type === 'password';
        privateKeyInput.type = isPassword ? 'text' : 'password';
        privateKeyInput.classList.toggle('blur-sm');
        togglePrivateKeyBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });

    toggleEditPrivateKeyBtn.addEventListener('click', () => {
        const isPassword = editPrivateKeyInput.type === 'password';
        editPrivateKeyInput.type = isPassword ? 'text' : 'password';
        editPrivateKeyInput.classList.toggle('blur-sm');
        toggleEditPrivateKeyBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });

    // Copy Start Command
    copyStartCommandBtn.addEventListener('click', async () => {
        if (!currentNodeId) {
            showNotification('No node selected', 'error');
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/api/nodes/${currentNodeId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch node: ${response.status}`);
            const node = await response.json();
            const command = node.start_command || 'No start command set';
            await navigator.clipboard.writeText(command);
            showNotification('Start command copied to clipboard!', 'success');
        } catch (error) {
            showNotification('Failed to copy command', 'error');
            console.error('Error copying command:', error);
        }
    });

    async function loadNodes() {
        try {
            const response = await fetch(`${BASE_URL}/api/nodes`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch nodes: ${response.status}`);
            nodes = await response.json();
            filteredNodes = [...nodes];
            renderNodes();
            toggleEmptyState();
        } catch (error) {
            showNotification('Error loading nodes. Check console for details.', 'error');
            console.error('Error loading nodes:', error);
        }
    }

    async function loadStats() {
        try {
            const response = await fetch(`${BASE_URL}/api/stats`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch stats: ${response.status}`);
            const stats = await response.json();
            totalNodesEl.textContent = stats.total_nodes || '0';
            activeNodesEl.textContent = stats.active_nodes || '0';
            uniqueWalletsEl.textContent = stats.unique_wallets || '0';
        } catch (error) {
            showNotification('Error loading stats. Check console for details.', 'error');
            console.error('Error loading stats:', error);
        }
    }

    function updateStartCommand() {
        const ethereumRpc = document.getElementById('ethereum-rpc').value || 'https://YOUR_SEPOLIA_RPC';
        const beaconRpc = document.getElementById('beacon-rpc').value || 'https://YOUR_BEACON_RPC';
        const privateKey = document.getElementById('private-key').value || '0xYOUR_PRIVATE_KEY';
        const walletAddress = document.getElementById('wallet-address').value || 'YOUR_PUBLIC_ADDRESS';
        const vpsIp = document.getElementById('vps-ip').value || '$(curl -s ifconfig.me)';

        const command = `aztec start --node --archiver --sequencer \\
  --network alpha-testnet \\
  --l1-rpc-urls ${ethereumRpc} \\
  --l1-consensus-host-urls ${beaconRpc} \\
  --sequencer.validatorPrivateKey ${privateKey} \\
  --sequencer.coinbase ${walletAddress} \\
  --p2p.p2pIp ${vpsIp}`;

        startCommandEl.value = command;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const startCommand = startCommandEl.value;
        const nodeData = {
            name: document.getElementById('node-name').value,
            ethereum_rpc: document.getElementById('ethereum-rpc').value,
            beacon_rpc: document.getElementById('beacon-rpc').value,
            private_key: document.getElementById('private-key').value,
            wallet_address: document.getElementById('wallet-address').value,
            vps_ip: document.getElementById('vps-ip').value,
            block_number: document.getElementById('block-number').value,
            proof_string: document.getElementById('proof-string').value,
            status: 'active',
            start_command: startCommand
        };
        console.log('Sending nodeData:', nodeData);

        try {
            const response = await fetch(`${BASE_URL}/api/nodes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(nodeData)
            });
            if (response.ok) {
                const newNode = await response.json();
                console.log('Received newNode from backend:', newNode);
                showNotification('Node added successfully', 'success');
                nodeForm.reset();
                updateStartCommand(); // Reset Start Command after form reset
                loadNodes();
                loadStats();
            } else {
                throw new Error(`Failed to add node: ${response.status}`);
            }
        } catch (error) {
            showNotification('Error adding node. Check console for details.', 'error');
            console.error('Error adding node:', error);
        }
    }

    function renderNodes() {
        nodesList.innerHTML = '';

        if (filteredNodes.length === 0) {
            toggleEmptyState();
            return;
        }

        filteredNodes.forEach(node => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-700/50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium">${node.name}</div></td>
                <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-300 font-mono">${node.wallet_address || 'N/A'}</div></td>
                <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-300">${node.vps_ip || 'N/A'}</div></td>
                <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-300">${node.block_number || 'N/A'}</div></td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${node.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}">
                        ${node.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="view-btn text-blue-500 hover:text-blue-400" data-id="${node._id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="edit-btn text-yellow-500 hover:text-yellow-400" data-id="${node._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn text-red-500 hover:text-red-400" data-id="${node._id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>`;
            nodesList.appendChild(row);
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => viewNode(btn.dataset.id));
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
        });
    }

    function toggleEmptyState() {
        if (filteredNodes.length === 0) {
            emptyState.classList.remove('hidden');
            document.querySelector('table thead').classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            document.querySelector('table thead').classList.remove('hidden');
        }
    }

    function filterNodes() {
        const searchTerm = searchInput.value.toLowerCase();
        filteredNodes = nodes.filter(node =>
            node.name.toLowerCase().includes(searchTerm) ||
            (node.wallet_address && node.wallet_address.toLowerCase().includes(searchTerm)) ||
            (node.vps_ip && node.vps_ip.toLowerCase().includes(searchTerm))
        );
        renderNodes();
    }

    async function viewNode(id) {
        try {
            const response = await fetch(`${BASE_URL}/api/nodes/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch node: ${response.status}`);
            const node = await response.json();
            console.log('Fetched node for view:', node);

            currentNodeId = id;
            document.getElementById('view-node-name').textContent = node.name || 'N/A';
            document.getElementById('view-ethereum-rpc').textContent = node.ethereum_rpc || 'N/A';
            document.getElementById('view-beacon-rpc').textContent = node.beacon_rpc || 'N/A';
            
            const privateKeyEl = document.getElementById('view-private-key');
            const privateKey = node.private_key || 'N/A';
            const maskedKey = privateKey.length > 4 ? '****' + privateKey.slice(-4) : privateKey;
            privateKeyEl.textContent = maskedKey;
            privateKeyEl.classList.remove('blur-sm');

            document.getElementById('view-wallet-address').textContent = node.wallet_address || 'N/A';
            document.getElementById('view-vps-ip').textContent = node.vps_ip || 'N/A';
            document.getElementById('view-block-number').textContent = node.block_number || 'N/A';
            document.getElementById('view-proof-string').textContent = node.proof_string || 'N/A';

            const startCommandEl = document.getElementById('view-start-command');
            startCommandEl.textContent = node.start_command || 'No start command set';
            editStartCommandTextarea.value = node.start_command || '';

            // Reset edit section
            editStartCommandSection.classList.add('hidden');
            startCommandEl.classList.remove('hidden');

            // Edit Start Command Button
            editStartCommandBtn.onclick = () => {
                startCommandEl.classList.add('hidden');
                editStartCommandSection.classList.remove('hidden');
            };

            // Save Start Command
            saveStartCommandBtn.onclick = async () => {
                const updatedStartCommand = editStartCommandTextarea.value;
                console.log('Updating start_command:', updatedStartCommand);
                try {
                    const response = await fetch(`${BASE_URL}/api/nodes/${currentNodeId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ start_command: updatedStartCommand })
                    });
                    if (response.ok) {
                        const updatedNode = await response.json();
                        console.log('Updated node with new start_command:', updatedNode);
                        startCommandEl.textContent = updatedNode.start_command || 'No start command set';
                        editStartCommandSection.classList.add('hidden');
                        startCommandEl.classList.remove('hidden');
                        showNotification('Start command updated successfully', 'success');
                        loadNodes();
                    } else {
                        throw new Error(`Failed to update start command: ${response.status}`);
                    }
                } catch (error) {
                    showNotification('Error updating start command. Check console for details.', 'error');
                    console.error('Error updating start command:', error);
                }
            };

            // Cancel Edit Start Command
            cancelEditStartCommandBtn.onclick = () => {
                editStartCommandSection.classList.add('hidden');
                startCommandEl.classList.remove('hidden');
                editStartCommandTextarea.value = node.start_command || '';
            };

            // Private Key Toggle
            const toggleBtn = document.querySelector('.toggle-view-private-key');
            const newToggleBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

            newToggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            newToggleBtn.dataset.isRevealed = 'false';
            newToggleBtn.addEventListener('click', function () {
                const isRevealed = this.dataset.isRevealed === 'true';
                if (!isRevealed) {
                    privateKeyEl.textContent = privateKey;
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    this.dataset.isRevealed = 'true';
                } else {
                    privateKeyEl.textContent = maskedKey;
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                    this.dataset.isRevealed = 'false';
                }
            });

            viewModal.classList.remove('hidden');
        } catch (error) {
            showNotification('Error loading node. Check console for details.', 'error');
            console.error('Error loading node:', error);
        }
    }

    function openEditModal(id) {
        const node = nodes.find(n => n._id === id);
        if (!node) {
            showNotification('Node not found', 'error');
            return;
        }

        // Populate form fields
        document.getElementById('edit-id').value = node._id;
        document.getElementById('edit-node-name').value = node.name || '';
        document.getElementById('edit-ethereum-rpc').value = node.ethereum_rpc || '';
        document.getElementById('edit-beacon-rpc').value = node.beacon_rpc || '';
        document.getElementById('edit-private-key').value = node.private_key || '';
        document.getElementById('edit-wallet-address').value = node.wallet_address || '';
        document.getElementById('edit-vps-ip').value = node.vps_ip || '';
        document.getElementById('edit-block-number').value = node.block_number || '';
        document.getElementById('edit-proof-string').value = node.proof_string || '';
        document.getElementById('edit-status').value = node.status || 'active';

        // Populate start command
        const startCommandDisplay = document.getElementById('edit-start-command-display');
        const startCommandTextarea = document.getElementById('edit-start-command-textarea');
        startCommandDisplay.textContent = node.start_command || 'No start command set';
        startCommandTextarea.value = node.start_command || '';

        // Reset edit section
        const editStartCommandSection = document.getElementById('edit-start-command-section-edit');
        editStartCommandSection.classList.add('hidden');
        startCommandDisplay.classList.remove('hidden');

        // Edit Start Command Button
        const editStartCommandBtn = document.getElementById('edit-start-command-btn-edit');
        editStartCommandBtn.onclick = () => {
            startCommandDisplay.classList.add('hidden');
            editStartCommandSection.classList.remove('hidden');
        };

        // Save Start Command
        const saveStartCommandBtn = document.getElementById('save-start-command-edit');
        saveStartCommandBtn.onclick = async () => {
            const updatedStartCommand = startCommandTextarea.value;
            console.log('Updating start_command in Edit modal:', updatedStartCommand);
            try {
                const response = await fetch(`${BASE_URL}/api/nodes/${node._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ start_command: updatedStartCommand })
                });
                if (response.ok) {
                    const updatedNode = await response.json();
                    console.log('Updated node with new start_command:', updatedNode);
                    startCommandDisplay.textContent = updatedNode.start_command || 'No start command set';
                    startCommandTextarea.value = updatedNode.start_command || '';
                    editStartCommandSection.classList.add('hidden');
                    startCommandDisplay.classList.remove('hidden');
                    showNotification('Start command updated successfully', 'success');
                    loadNodes();
                } else {
                    throw new Error(`Failed to update start command: ${response.status}`);
                }
            } catch (error) {
                showNotification('Error updating start command. Check console for details.', 'error');
                console.error('Error updating start command:', error);
            }
        };

        // Cancel Edit Start Command
        const cancelEditStartCommandBtn = document.getElementById('cancel-edit-start-command-edit');
        cancelEditStartCommandBtn.onclick = () => {
            editStartCommandSection.classList.add('hidden');
            startCommandDisplay.classList.remove('hidden');
            startCommandTextarea.value = node.start_command || '';
        };

        editModal.classList.remove('hidden');
    }

    async function saveEdit() {
        const updatedNode = {
            name: document.getElementById('edit-node-name').value,
            ethereum_rpc: document.getElementById('edit-ethereum-rpc').value,
            beacon_rpc: document.getElementById('edit-beacon-rpc').value,
            private_key: document.getElementById('edit-private-key').value,
            wallet_address: document.getElementById('edit-wallet-address').value,
            vps_ip: document.getElementById('edit-vps-ip').value,
            block_number: document.getElementById('edit-block-number').value,
            proof_string: document.getElementById('edit-proof-string').value,
            status: document.getElementById('edit-status').value,
            start_command: document.getElementById('edit-start-command-textarea').value || document.getElementById('edit-start-command-display').textContent
        };
        console.log('Sending updatedNode:', updatedNode);

        const nodeId = document.getElementById('edit-id').value;

        try {
            const res = await fetch(`${BASE_URL}/api/nodes/${nodeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedNode)
            });
            if (res.ok) {
                const updatedNode = await res.json();
                console.log('Updated node from Edit Modal:', updatedNode);
                showNotification('Node updated successfully', 'success');
                loadNodes();
                loadStats();
                editModal.classList.add('hidden');
            } else {
                throw new Error(`Failed to update node: ${res.status}`);
            }
        } catch (err) {
            showNotification('Error updating node. Check console for details.', 'error');
            console.error('Error updating node:', err);
        }
    }

    function confirmDelete(id) {
        if (confirm('Are you sure you want to delete this node?')) {
            deleteNode(id);
        }
    }

    async function deleteNode(id) {
        try {
            const res = await fetch(`${BASE_URL}/api/nodes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                showNotification('Node deleted successfully', 'success');
                loadNodes();
                loadStats();
                editModal.classList.add('hidden');
            } else {
                throw new Error(`Failed to delete node: ${res.status}`);
            }
        } catch (err) {
            showNotification('Error deleting node. Check console for details.', 'error');
            console.error('Error deleting node:', err);
        }
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `toast ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white px-4 py-2 rounded shadow-lg animate-bounce`;
        notification.innerText = message;
        document.getElementById('notifications').appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
});
