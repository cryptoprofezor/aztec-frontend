document.addEventListener('DOMContentLoaded', function () {
    const BASE_URL = 'https://aztec-backend-production.up.railway.app'; // Replace with your Railway URL

    // Elements
    const nodeForm = document.getElementById('node-form');
    const nodesList = document.getElementById('nodes-list');
    const emptyState = document.getElementById('empty-state');
    const searchNodes = document.getElementById('search-nodes');
    const totalNodesEl = document.getElementById('total-nodes');
    const activeNodesEl = document.getElementById('active-nodes');
    const uniqueWalletsEl = document.getElementById('unique-wallets');
    const viewModal = document.getElementById('view-modal');
    const editModal = document.getElementById('edit-modal');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    const logoutBtn = document.getElementById('logout-btn');

    let nodes = [];
    let filteredNodes = [];
    let currentNodeId = null;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Show logout button
    logoutBtn.classList.remove('hidden');

    // Logout functionality
    logoutBtn.addEventListener('click', function () {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });

    // Fetch Headers with Token
    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    // Toast Notification
    function showNotification(message, type) {
        toastMessage.textContent = message;
        toastIcon.className = 'fas ' + (type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500');
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    // Toggle Private Key Visibility
    document.getElementById('toggle-private-key').addEventListener('click', function () {
        const privateKeyInput = document.getElementById('private-key');
        const icon = this.querySelector('i');
        if (privateKeyInput.type === 'password') {
            privateKeyInput.type = 'text';
            privateKeyInput.classList.remove('blur-sm');
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            privateKeyInput.type = 'password';
            privateKeyInput.classList.add('blur-sm');
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    document.getElementById('toggle-view-private-key').addEventListener('click', function () {
        const privateKeyEl = document.getElementById('view-private-key');
        const icon = this.querySelector('i');
        if (privateKeyEl.classList.contains('blur-sm')) {
            privateKeyEl.classList.remove('blur-sm');
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            privateKeyEl.classList.add('blur-sm');
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Load Nodes
    async function loadNodes() {
        try {
            const response = await fetch(`${BASE_URL}/api/nodes`, {
                headers: getHeaders()
            });
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            nodes = await response.json();
            filteredNodes = [...nodes];
            renderNodes();
            toggleEmptyState();
        } catch (err) {
            showNotification('Failed to load nodes', 'error');
        }
    }

    // Load Stats
    async function loadStats() {
        try {
            const response = await fetch(`${BASE_URL}/api/stats`, {
                headers: getHeaders()
            });
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            const stats = await response.json();
            totalNodesEl.textContent = stats.total_nodes;
            activeNodesEl.textContent = stats.active_nodes;
            uniqueWalletsEl.textContent = stats.unique_wallets;
        } catch (err) {
            showNotification('Failed to load stats', 'error');
        }
    }

    // Render Nodes
    function renderNodes() {
        nodesList.innerHTML = '';
        filteredNodes.forEach(node => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-700/50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${node.node_name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${node.wallet_address || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">${node.vps_ip || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">${node.block_number || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${node.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}">
                        ${node.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex space-x-2">
                        <button class="text-blue-500 hover:text-blue-400 view-node" data-id="${node._id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-yellow-500 hover:text-yellow-400 edit-node" data-id="${node._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-400 delete-node" data-id="${node._id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            nodesList.appendChild(row);
        });

        // Add event listeners for buttons
        document.querySelectorAll('.view-node').forEach(btn => {
            btn.addEventListener('click', () => viewNode(btn.dataset.id));
        });
        document.querySelectorAll('.edit-node').forEach(btn => {
            btn.addEventListener('click', () => editNode(btn.dataset.id));
        });
        document.querySelectorAll('.delete-node').forEach(btn => {
            btn.addEventListener('click', () => deleteNode(btn.dataset.id));
        });
    }

    // Toggle Empty State
    function toggleEmptyState() {
        if (filteredNodes.length === 0) {
            emptyState.classList.remove('hidden');
            nodesList.parentElement.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            nodesList.parentElement.classList.remove('hidden');
        }
    }

    // Search Nodes
    searchNodes.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        filteredNodes = nodes.filter(node =>
            node.node_name.toLowerCase().includes(query) ||
            (node.wallet_address && node.wallet_address.toLowerCase().includes(query)) ||
            (node.vps_ip && node.vps_ip.toLowerCase().includes(query))
        );
        renderNodes();
        toggleEmptyState();
    });

    // Add Node
    nodeForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const nodeData = {
            node_name: document.getElementById('node-name').value,
            ethereum_rpc: document.getElementById('ethereum-rpc').value,
            beacon_rpc: document.getElementById('beacon-rpc').value,
            private_key: document.getElementById('private-key').value,
            wallet_address: document.getElementById('wallet-address').value,
            vps_ip: document.getElementById('vps-ip').value,
            block_number: document.getElementById('block-number').value,
            proof_string: document.getElementById('proof-string').value,
            start_command: document.getElementById('start-command').value,
            status: 'active'
        };

        try {
            const response = await fetch(`${BASE_URL}/api/nodes`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(nodeData)
            });
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            const newNode = await response.json();
            nodes.push(newNode);
            filteredNodes = [...nodes];
            renderNodes();
            toggleEmptyState();
            showNotification('Node added successfully', 'success');
            nodeForm.reset();
        } catch (err) {
            showNotification('Failed to add node', 'error');
        }
    });

    // View Node
    async function viewNode(id) {
        const node = nodes.find(n => n._id === id);
        if (!node) {
            showNotification('Node not found', 'error');
            return;
        }
        currentNodeId = id;
        document.getElementById('view-node-name').textContent = node.node_name || 'N/A';
        document.getElementById('view-ethereum-rpc').textContent = node.ethereum_rpc || 'N/A';
        document.getElementById('view-beacon-rpc').textContent = node.beacon_rpc || 'N/A';
        document.getElementById('view-private-key').textContent = node.private_key || 'N/A';
        document.getElementById('view-wallet-address').textContent = node.wallet_address || 'N/A';
        document.getElementById('view-vps-ip').textContent = node.vps_ip || 'N/A';
        document.getElementById('view-block-number').textContent = node.block_number || 'N/A';
        document.getElementById('view-proof-string').textContent = node.proof_string || 'N/A';
        document.getElementById('view-start-command').textContent = node.start_command || 'No start command set';
        document.getElementById('edit-start-command').value = node.start_command || '';
        document.getElementById('edit-start-command-section').classList.add('hidden');
        document.getElementById('view-start-command').classList.remove('hidden');
        viewModal.classList.remove('hidden');
    }

    // Edit Start Command
    document.getElementById('edit-start-command-btn').addEventListener('click', function () {
        document.getElementById('view-start-command').classList.add('hidden');
        document.getElementById('edit-start-command-section').classList.remove('hidden');
    });

    document.getElementById('cancel-edit-start-command').addEventListener('click', function () {
        document.getElementById('edit-start-command-section').classList.add('hidden');
        document.getElementById('view-start-command').classList.remove('hidden');
    });

    document.getElementById('save-start-command').addEventListener('click', async function () {
        const updatedStartCommand = document.getElementById('edit-start-command').value;
        try {
            const response = await fetch(`${BASE_URL}/api/nodes/${currentNodeId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ start_command: updatedStartCommand })
            });
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            const updatedNode = await response.json();
            nodes = nodes.map(node => node._id === currentNodeId ? updatedNode : node);
            filteredNodes = [...nodes];
            document.getElementById('view-start-command').textContent = updatedStartCommand || 'No start command set';
            document.getElementById('edit-start-command-section').classList.add('hidden');
            document.getElementById('view-start-command').classList.remove('hidden');
            showNotification('Start command updated', 'success');
        } catch (err) {
            showNotification('Failed to update start command', 'error');
        }
    });

    // Copy Start Command
    document.getElementById('copy-start-command').addEventListener('click', function () {
        const startCommand = document.getElementById('view-start-command').textContent;
        navigator.clipboard.writeText(startCommand).then(() => {
            showNotification('Start command copied to clipboard', 'success');
        }).catch(() => {
            showNotification('Failed to copy start command', 'error');
        });
    });

    // Close View Modal
    document.getElementById('close-view-modal').addEventListener('click', () => viewModal.classList.add('hidden'));
    document.getElementById('close-view-modal-btn').addEventListener('click', () => viewModal.classList.add('hidden'));

    // Edit Node
    function editNode(id) {
        const node = nodes.find(n => n._id === id);
        if (!node) {
            showNotification('Node not found', 'error');
            return;
        }
        currentNodeId = id;
        document.getElementById('edit-id').value = node._id;
        document.getElementById('edit-node-name').value = node.node_name;
        document.getElementById('edit-ethereum-rpc').value = node.ethereum_rpc || '';
        document.getElementById('edit-beacon-rpc').value = node.beacon_rpc || '';
        document.getElementById('edit-private-key').value = node.private_key || '';
        document.getElementById('edit-wallet-address').value = node.wallet_address || '';
        document.getElementById('edit-vps-ip').value = node.vps_ip || '';
        document.getElementById('edit-block-number').value = node.block_number || '';
        document.getElementById('edit-status').value = node.status || 'active';
        document.getElementById('edit-proof-string').value = node.proof_string || '';
        document.getElementById('edit-start-command-modal').value = node.start_command || '';
        editModal.classList.remove('hidden');
    }

    // Save Edit
    document.getElementById('save-edit').addEventListener('click', async function (e) {
        e.preventDefault();
        const updatedNode = {
            node_name: document.getElementById('edit-node-name').value,
            ethereum_rpc: document.getElementById('edit-ethereum-rpc').value,
            beacon_rpc: document.getElementById('edit-beacon-rpc').value,
            private_key: document.getElementById('edit-private-key').value,
            wallet_address: document.getElementById('edit-wallet-address').value,
            vps_ip: document.getElementById('edit-vps-ip').value,
            block_number: document.getElementById('edit-block-number').value,
            proof_string: document.getElementById('edit-proof-string').value,
            status: document.getElementById('edit-status').value,
            start_command: document.getElementById('edit-start-command-modal').value,
        };

        try {
            const response = await fetch(`${BASE_URL}/api/nodes/${currentNodeId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(updatedNode)
            });
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            const updatedNodeData = await response.json();
            nodes = nodes.map(node => node._id === currentNodeId ? updatedNodeData : node);
            filteredNodes = [...nodes];
            renderNodes();
            toggleEmptyState();
            editModal.classList.add('hidden');
            showNotification('Node updated successfully', 'success');
        } catch (err) {
            showNotification('Failed to update node', 'error');
        }
    });

    // Delete Node
    async function deleteNode(id) {
        if (!confirm('Are you sure you want to delete this node?')) return;
        try {
            const response = await fetch(`${BASE_URL}/api/nodes/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            nodes = nodes.filter(node => node._id !== id);
            filteredNodes = [...nodes];
            renderNodes();
            toggleEmptyState();
            editModal.classList.add('hidden');
            showNotification('Node deleted successfully', 'success');
        } catch (err) {
            showNotification('Failed to delete node', 'error');
        }
    }

    document.getElementById('delete-node').addEventListener('click', () => deleteNode(currentNodeId));
    document.getElementById('close-edit-modal').addEventListener('click', () => editModal.classList.add('hidden'));
    document.getElementById('cancel-edit').addEventListener('click', () => editModal.classList.add('hidden'));

    // Initial Load
    loadNodes();
    loadStats();
});