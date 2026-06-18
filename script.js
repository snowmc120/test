mod made by bao
text

```javascript
// ==================== SCRIPT.JS - XOC88.CC ====================
// File: script.js
// Mô tả: Toàn bộ logic game Tài Xỉu, Bầu Cua, Slot 777, Auth, Nạp/Rút, Chat
// Sử dụng: Nhúng vào index.html sau style.css và style.js

(function() {
    'use strict';

    // ==================== CONSTANTS ====================
    const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const BAU_CUA_SYMBOLS = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
    const BAU_CUA_EMOJI = { bau: '🍈', cua: '🦀', tom: '🦐', ca: '🐟', ga: '🐔', nai: '🦌' };
    const BAU_CUA_LABELS = { bau: 'BẦU', cua: 'CUA', tom: 'TÔM', ca: 'CÁ', ga: 'GÀ', nai: 'NAI' };
    const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
    const SLOT_PAYOUT = { '🍒': 5, '🍋': 10, '🍊': 15, '🍇': 20, '⭐': 25, '💎': 50, '7️⃣': 100 };
    const DEFAULT_GUEST_BALANCE = 500000;
    const DEFAULT_NEW_USER_BALANCE = 100000;
    const MIN_BET = 10000;
    const MIN_DEPOSIT = 50000;
    const MIN_WITHDRAW = 50000;
    const TX_ROUND_TIME = 30;
    const BC_ROUND_TIME = 25;
    const MAX_HISTORY = 50;
    const MAX_SLOT_HISTORY = 30;

    // ==================== GLOBAL STATE ====================
    let currentUser = null;
    let userBalance = DEFAULT_GUEST_BALANCE;
    let activeTab = 'taixiu';

    // Tài Xỉu state
    let txState = {
        dice: [1, 1, 1],
        timer: TX_ROUND_TIME,
        interval: null,
        rolling: false,
        selected: null,
        betPlaced: false,
        betAmount: 0,
        history: []
    };

    // Bầu Cua state
    let bcState = {
        dice: ['bau', 'cua', 'tom'],
        timer: BC_ROUND_TIME,
        interval: null,
        rolling: false,
        selected: {},
        betPlaced: false,
        bets: {},
        history: []
    };

    // Slot state
    let slotState = {
        reels: ['🍒', '🍒', '🍒'],
        spinning: false,
        history: []
    };

    // ==================== DOM CACHE ====================
    let DOM = {};

    function cacheDOM() {
        DOM = {
            // Header
            headerBtns: document.getElementById('headerBtns'),
            balanceDisplay: document.getElementById('balanceDisplay'),

            // Tab content
            tabTaixiu: document.getElementById('tab-taixiu'),
            tabBaucua: document.getElementById('tab-baucua'),
            tabSlot: document.getElementById('tab-slot777'),

            // Tài Xỉu
            txDice1: document.getElementById('dice1'),
            txDice2: document.getElementById('dice2'),
            txDice3: document.getElementById('dice3'),
            txResultText: document.getElementById('txResultText'),
            txResultSum: document.getElementById('txResultSum'),
            txTimer: document.getElementById('txTimer'),
            txCountdown: document.getElementById('txCountdown'),
            txBetTai: document.getElementById('txBetTai'),
            txBetXiu: document.getElementById('txBetXiu'),
            txBetAmount: document.getElementById('txBetAmount'),
            txPlaceBtn: document.getElementById('txPlaceBtn'),
            txHistory: document.getElementById('txHistory'),

            // Bầu Cua
            bcDiceResult: document.getElementById('bcDiceResult'),
            bcResultText: document.getElementById('bcResultText'),
            bcTimer: document.getElementById('bcTimer'),
            bcCountdown: document.getElementById('bcCountdown'),
            bcBetGrid: document.getElementById('bcBetGrid'),
            bcBetAmount: document.getElementById('bcBetAmount'),
            bcPlaceBtn: document.getElementById('bcPlaceBtn'),
            bcHistory: document.getElementById('bcHistory'),

            // Slot
            slotReel1: document.getElementById('slotReel1'),
            slotReel2: document.getElementById('slotReel2'),
            slotReel3: document.getElementById('slotReel3'),
            slotWinText: document.getElementById('slotWinText'),
            slotBetAmount: document.getElementById('slotBetAmount'),
            slotLever: document.getElementById('slotLever'),
            slotHistory: document.getElementById('slotHistory'),

            // Chat
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),

            // Modals
            loginModal: document.getElementById('loginModal'),
            registerModal: document.getElementById('registerModal'),
            depositModal: document.getElementById('depositModal'),
            withdrawModal: document.getElementById('withdrawModal'),

            // Modal inputs
            loginUser: document.getElementById('loginUser'),
            loginPass: document.getElementById('loginPass'),
            regUser: document.getElementById('regUser'),
            regPass: document.getElementById('regPass'),
            regPass2: document.getElementById('regPass2'),
            depositAmount: document.getElementById('depositAmount'),
            depositMethod: document.getElementById('depositMethod'),
            withdrawAmount: document.getElementById('withdrawAmount'),
            withdrawBank: document.getElementById('withdrawBank'),
            withdrawAccount: document.getElementById('withdrawAccount'),
            withdrawName: document.getElementById('withdrawName')
        };
    }

    // ==================== STORAGE ====================
    function loadAll() {
        try {
            const u = localStorage.getItem('xoc88_user');
            if (u) {
                currentUser = JSON.parse(u);
                userBalance = currentUser.balance;
            }
            const th = localStorage.getItem('xoc88_txHistory');
            if (th) txState.history = JSON.parse(th);
            const bh = localStorage.getItem('xoc88_bcHistory');
            if (bh) bcState.history = JSON.parse(bh);
            const sh = localStorage.getItem('xoc88_slotHistory');
            if (sh) slotState.history = JSON.parse(sh);
        } catch (e) {
            console.warn('Lỗi load dữ liệu:', e);
            currentUser = null;
            userBalance = DEFAULT_GUEST_BALANCE;
        }
    }

    function saveAll() {
        try {
            if (currentUser) {
                currentUser.balance = userBalance;
                localStorage.setItem('xoc88_user', JSON.stringify(currentUser));
            }
            localStorage.setItem('xoc88_txHistory', JSON.stringify(txState.history.slice(-MAX_HISTORY)));
            localStorage.setItem('xoc88_bcHistory', JSON.stringify(bcState.history.slice(-MAX_HISTORY)));
            localStorage.setItem('xoc88_slotHistory', JSON.stringify(slotState.history.slice(-MAX_SLOT_HISTORY)));
        } catch (e) {
            console.warn('Lỗi save dữ liệu:', e);
        }
    }

    function getUsersDB() {
        try {
            return JSON.parse(localStorage.getItem('xoc88_users') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveUsersDB(users) {
        try {
            localStorage.setItem('xoc88_users', JSON.stringify(users));
        } catch (e) {
            console.warn('Lỗi save users:', e);
        }
    }

    // ==================== UI UPDATES ====================
    function updateBalanceDisplay() {
        if (DOM.balanceDisplay) {
            DOM.balanceDisplay.textContent = userBalance.toLocaleString('vi-VN');
        }
    }

    function updateHeader() {
        if (!DOM.headerBtns) return;
        if (currentUser) {
            DOM.headerBtns.innerHTML = `
                <span style="color:#fff;font-size:13px;font-weight:600;">👤 ${escapeHTML(currentUser.username)}</span>
                <button class="btn btn-success" onclick="window._deposit()" style="font-size:11px;">💰 NẠP</button>
                <button class="btn btn-outline-red" onclick="window._withdraw()" style="font-size:11px;">💸 RÚT</button>
                <button class="btn btn-ghost" onclick="window._logout()" style="font-size:11px;">🚪 THOÁT</button>
            `;
        } else {
            DOM.headerBtns.innerHTML = `
                <button class="btn btn-primary" onclick="window._openLogin()">ĐĂNG NHẬP</button>
                <button class="btn btn-danger" onclick="window._openRegister()">ĐĂNG KÝ</button>
            `;
        }
    }

    function updateAllUI() {
        updateBalanceDisplay();
        updateHeader();
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==================== TOAST ====================
    function showToast(message, type) {
        const existing = document.querySelector('.toast-msg');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        const bgColors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#f0c040',
            warning: '#f39c12'
        };
        toast.style.cssText = `
            position: fixed; top: 80px; right: 20px; z-index: 9999;
            padding: 14px 24px; border-radius: 8px; color: #fff; font-weight: 700;
            background: ${bgColors[type] || '#333'};
            animation: slideInRight 0.3s ease; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            max-width: 350px; font-size: 14px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 2500);
    }

    // ==================== CHAT ====================
    function addChatMessage(user, message, isSystem) {
        if (!DOM.chatMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg' + (isSystem ? ' system' : '');
        msgDiv.innerHTML = `<strong>${escapeHTML(user)}:</strong> ${escapeHTML(message)}`;
        DOM.chatMessages.appendChild(msgDiv);
        DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    }

    function sendChat() {
        if (!DOM.chatInput) return;
        const msg = DOM.chatInput.value.trim();
        if (!msg) return;
        const username = currentUser ? currentUser.username : 'Khách';
        addChatMessage(username, msg, false);
        DOM.chatInput.value = '';
    }

    // ==================== MODALS ====================
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            // Clear inputs
            modal.querySelectorAll('input').forEach(inp => { inp.value = ''; });
        }
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }

    // ==================== AUTH ====================
    function login() {
        const username = DOM.loginUser?.value.trim();
        const password = DOM.loginPass?.value.trim();
        if (!username || !password) {
            showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
            return;
        }
        const users = getUsersDB();
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            showToast('Sai tên đăng nhập hoặc mật khẩu!', 'error');
            return;
        }
        currentUser = { ...user };
        userBalance = currentUser.balance;
        updateAllUI();
        saveAll();
        closeModal('loginModal');
        showToast('Đăng nhập thành công! Chào ' + user.username + ' 🎉', 'success');
        addChatMessage('Hệ thống', `${user.username} vừa đăng nhập`, true);
    }

    function register() {
        const username = DOM.regUser?.value.trim();
        const password = DOM.regPass?.value;
        const password2 = DOM.regPass2?.value;

        if (!username || username.length < 4 || username.length > 20) {
            showToast('Tên đăng nhập phải từ 4-20 ký tự!', 'error');
            return;
        }
        if (!password || password.length < 6) {
            showToast('Mật khẩu phải từ 6 ký tự!', 'error');
            return;
        }
        if (password !== password2) {
            showToast('Mật khẩu không khớp!', 'error');
            return;
        }

        const users = getUsersDB();
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            showToast('Tên đăng nhập đã tồn tại!', 'error');
            return;
        }

        const newUser = {
            username: username,
            password: password,
            balance: DEFAULT_NEW_USER_BALANCE,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsersDB(users);

        currentUser = { ...newUser };
        userBalance = newUser.balance;
        updateAllUI();
        saveAll();
        closeModal('registerModal');
        showToast('Đăng ký thành công! Tặng 100K 🎁', 'success');
        addChatMessage('Hệ thống', `${username} vừa đăng ký tài khoản mới`, true);
    }

    function logout() {
        if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
        addChatMessage('Hệ thống', `${currentUser?.username || 'Khách'} đã đăng xuất`, true);
        currentUser = null;
        userBalance = DEFAULT_GUEST_BALANCE;
        localStorage.removeItem('xoc88_user');
        updateAllUI();
        showToast('Đã đăng xuất! Bạn đang ở chế độ khách.', 'info');
    }

    function deposit() {
        const amount = parseInt(DOM.depositAmount?.value);
        if (!amount || amount < MIN_DEPOSIT) {
            showToast(`Số tiền nạp tối thiểu ${MIN_DEPOSIT.toLocaleString()} VNĐ!`, 'error');
            return;
        }
        setTimeout(() => {
            userBalance += amount;
            updateAllUI();
            saveAll();
            closeModal('depositModal');
            showToast(`Nạp thành công +${amount.toLocaleString()} VNĐ!`, 'success');
            addChatMessage('Hệ thống', `${currentUser?.username || 'Khách'} vừa nạp ${amount.toLocaleString()} VNĐ`, true);
        }, 600);
    }

    function withdraw() {
        const amount = parseInt(DOM.withdrawAmount?.value);
        const bank = DOM.withdrawBank?.value.trim();
        const account = DOM.withdrawAccount?.value.trim();
        const name = DOM.withdrawName?.value.trim();

        if (!amount || amount < MIN_WITHDRAW) {
            showToast(`Số tiền rút tối thiểu ${MIN_WITHDRAW.toLocaleString()} VNĐ!`, 'error');
            return;
        }
        if (amount > userBalance) {
            showToast('Số dư không đủ!', 'error');
            return;
        }
        if (!bank || !account || !name) {
            showToast('Vui lòng điền đầy đủ thông tin tài khoản!', 'error');
            return;
        }
        userBalance -= amount;
        updateAllUI();
        saveAll();
        closeModal('withdrawModal');
        showToast(`Rút ${amount.toLocaleString()} VNĐ thành công! Tiền sẽ về trong 5-15 phút.`, 'success');
        addChatMessage('Hệ thống', `${currentUser?.username || 'Khách'} vừa rút ${amount.toLocaleString()} VNĐ`, true);
    }

    // ==================== TÀI XỈU ====================
    function txStartRound() {
        txState.timer = TX_ROUND_TIME;
        txState.rolling = false;
        txState.betPlaced = false;
        txState.betAmount = 0;
        txState.selected = null;

        if (DOM.txBetTai) DOM.txBetTai.classList.remove('selected');
        if (DOM.txBetXiu) DOM.txBetXiu.classList.remove('selected');
        if (DOM.txPlaceBtn) DOM.txPlaceBtn.disabled = false;
        if (DOM.txResultText) DOM.txResultText.textContent = 'ĐANG CHỜ...';
        if (DOM.txResultSum) DOM.txResultSum.textContent = '';

        txUpdateTimerDisplay();
        if (txState.interval) clearInterval(txState.interval);
        txState.interval = setInterval(() => {
            if (!txState.rolling) {
                txState.timer--;
                txUpdateTimerDisplay();
                if (txState.timer <= 0) {
                    clearInterval(txState.interval);
                    txRoll();
                }
            }
        }, 1000);
    }

    function txUpdateTimerDisplay() {
        if (!DOM.txTimer || !DOM.txCountdown) return;
        DOM.txTimer.textContent = txState.timer;
        DOM.txTimer.style.color = txState.timer <= 5 ? '#e74c3c' : '#f0c040';
        if (txState.timer <= 5) DOM.txTimer.classList.add('urgent');
        else DOM.txTimer.classList.remove('urgent');

        const pct = (txState.timer / TX_ROUND_TIME) * 100;
        DOM.txCountdown.style.width = pct + '%';
        DOM.txCountdown.style.background = txState.timer <= 5 ? '#e74c3c' : '#f0c040';
    }

    function txSelectBet(type) {
        if (txState.rolling) return;
        txState.selected = type;
        if (DOM.txBetTai) DOM.txBetTai.classList.toggle('selected', type === 'tai');
        if (DOM.txBetXiu) DOM.txBetXiu.classList.toggle('selected', type === 'xiu');
    }

    function txSetAmount(amount) {
        if (!DOM.txBetAmount) return;
        DOM.txBetAmount.value = amount === 'all' ? userBalance : amount;
    }

    function txPlaceBet() {
        if (txState.rolling) {
            showToast('Đang xóc! Chờ ván mới.', 'error');
            return;
        }
        if (!txState.selected) {
            showToast('Vui lòng chọn TÀI hoặc XỈU!', 'error');
            return;
        }
        const amount = parseInt(DOM.txBetAmount?.value);
        if (!amount || amount < MIN_BET) {
            showToast(`Số tiền cược tối thiểu ${MIN_BET.toLocaleString()} VNĐ!`, 'error');
            return;
        }
        if (amount > userBalance) {
            showToast('Số dư không đủ! Vui lòng nạp thêm.', 'error');
            return;
        }

        userBalance -= amount;
        txState.betAmount = amount;
        txState.betPlaced = true;
        updateBalanceDisplay();
        saveAll();
        showToast(`Đã đặt ${amount.toLocaleString()} VNĐ vào ${txState.selected.toUpperCase()}`, 'info');
        if (DOM.txPlaceBtn) DOM.txPlaceBtn.disabled = true;
    }

    function txRoll() {
        if (txState.rolling) return;
        txState.rolling = true;
        if (DOM.txPlaceBtn) DOM.txPlaceBtn.disabled = true;

        const d1 = DOM.txDice1, d2 = DOM.txDice2, d3 = DOM.txDice3;
        if (d1) d1.classList.add('rolling');
        if (d2) d2.classList.add('rolling');
        if (d3) d3.classList.add('rolling');

        let count = 0;
        const maxCount = 10;
        const interval = setInterval(() => {
            txState.dice = [
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1
            ];
            if (d1) d1.textContent = DICE_FACES[txState.dice[0] - 1];
            if (d2) d2.textContent = DICE_FACES[txState.dice[1] - 1];
            if (d3) d3.textContent = DICE_FACES[txState.dice[2] - 1];
            count++;
            if (count >= maxCount) {
                clearInterval(interval);
                if (d1) d1.classList.remove('rolling');
                if (d2) d2.classList.remove('rolling');
                if (d3) d3.classList.remove('rolling');
                txFinalize();
            }
        }, 100);
    }

    function txFinalize() {
        txState.dice = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1
        ];
        if (DOM.txDice1) DOM.txDice1.textContent = DICE_FACES[txState.dice[0] - 1];
        if (DOM.txDice2) DOM.txDice2.textContent = DICE_FACES[txState.dice[1] - 1];
        if (DOM.txDice3) DOM.txDice3.textContent = DICE_FACES[txState.dice[2] - 1];

        const sum = txState.dice[0] + txState.dice[1] + txState.dice[2];
        const result = sum >= 11 ? 'tai' : 'xiu';

        if (DOM.txResultSum) DOM.txResultSum.textContent = 'TỔNG: ' + sum;
        if (DOM.txResultText) {
            DOM.txResultText.textContent = result === 'tai' ? '🔴 TÀI' : '🟢 XỈU';
            DOM.txResultText.className = 'result-text result-' + result;
        }

        // Xử lý thắng thua
        if (txState.betPlaced && txState.selected && txState.betAmount > 0) {
            if (txState.selected === result) {
                const winAmount = Math.floor(txState.betAmount * 1.95);
                userBalance += winAmount;
                showToast(`🎉 THẮNG! +${winAmount.toLocaleString()} VNĐ`, 'success');
            } else {
                showToast(`😢 THUA! -${txState.betAmount.toLocaleString()} VNĐ`, 'error');
            }
            updateBalanceDisplay();
            saveAll();
        }

        // Lưu lịch sử
        txState.history.unshift({
            sum: sum,
            result: result,
            dice: [...txState.dice],
            time: new Date().toLocaleTimeString('vi-VN')
        });
        if (txState.history.length > MAX_HISTORY) txState.history = txState.history.slice(0, MAX_HISTORY);
        saveAll();
        renderTxHistory();
        addChatMessage('Hệ thống', `Tài Xỉu: ${txState.dice.join('+')}=${sum} → ${result.toUpperCase()}`, true);

        // Ván mới sau 3 giây
        setTimeout(() => txStartRound(), 3000);
    }

    function renderTxHistory() {
        if (!DOM.txHistory) return;
        DOM.txHistory.innerHTML = txState.history.slice(0, 24).map(h => {
            const cls = h.result === 'tai' ? 'history-tai' : 'history-xiu';
            return `<div class="history-item ${cls}" title="${h.dice.join('+')}=${h.sum} | ${h.time}">${h.sum}</div>`;
        }).join('');
    }

    // ==================== BẦU CUA ====================
    function bcStartRound() {
        bcState.timer = BC_ROUND_TIME;
        bcState.rolling = false;
        bcState.betPlaced = false;
        bcState.selected = {};
        bcState.bets = {};

        if (DOM.bcPlaceBtn) DOM.bcPlaceBtn.disabled = false;
        if (DOM.bcResultText) DOM.bcResultText.textContent = 'ĐANG CHỜ...';
        if (DOM.bcDiceResult) DOM.bcDiceResult.innerHTML = '<span>🦀</span><span>🦐</span><span>🐟</span>';
        document.querySelectorAll('#bcBetGrid .baucua-item').forEach(el => el.classList.remove('selected'));

        bcUpdateTimerDisplay();
        if (bcState.interval) clearInterval(bcState.interval);
        bcState.interval = setInterval(() => {
            if (!bcState.rolling) {
                bcState.timer--;
                bcUpdateTimerDisplay();
                if (bcState.timer <= 0) {
                    clearInterval(bcState.interval);
                    bcRoll();
                }
            }
        }, 1000);
    }

    function bcUpdateTimerDisplay() {
        if (!DOM.bcTimer || !DOM.bcCountdown) return;
        DOM.bcTimer.textContent = bcState.timer;
        DOM.bcTimer.style.color = bcState.timer <= 5 ? '#e74c3c' : '#f0c040';
        if (bcState.timer <= 5) DOM.bcTimer.classList.add('urgent');
        else DOM.bcTimer.classList.remove('urgent');

        const pct = (bcState.timer / BC_ROUND_TIME) * 100;
        DOM.bcCountdown.style.width = pct + '%';
        DOM.bcCountdown.style.background = bcState.timer <= 5 ? '#e74c3c' : '#f0c040';
    }

    function bcToggleBet(symbol, element) {
        if (bcState.rolling) return;
        element.classList.toggle('selected');
        if (element.classList.contains('selected')) {
            bcState.selected[symbol] = true;
        } else {
            delete bcState.selected[symbol];
        }
    }

    function bcSetAmount(amount) {
        if (!DOM.bcBetAmount) return;
        DOM.bcBetAmount.value = amount;
    }

    function bcPlaceBet() {
        if (bcState.rolling) {
            showToast('Đang lắc! Chờ ván mới.', 'error');
            return;
        }
        const selectedSymbols = Object.keys(bcState.selected);
        if (selectedSymbols.length === 0) {
            showToast('Vui lòng chọn ít nhất 1 cửa cược!', 'error');
            return;
        }
        const amountPerSymbol = parseInt(DOM.bcBetAmount?.value);
        if (!amountPerSymbol || amountPerSymbol < MIN_BET) {
            showToast(`Số tiền cược tối thiểu ${MIN_BET.toLocaleString()} VNĐ/cửa!`, 'error');
            return;
        }
        const totalBet = amountPerSymbol * selectedSymbols.length;
        if (totalBet > userBalance) {
            showToast(`Số dư không đủ! Cần ${totalBet.toLocaleString()} VNĐ`, 'error');
            return;
        }

        userBalance -= totalBet;
        bcState.bets = {};
        selectedSymbols.forEach(s => { bcState.bets[s] = amountPerSymbol; });
        bcState.betPlaced = true;
        updateBalanceDisplay();
        saveAll();
        showToast(`Đã đặt ${totalBet.toLocaleString()} VNĐ vào ${selectedSymbols.length} cửa`, 'info');
        if (DOM.bcPlaceBtn) DOM.bcPlaceBtn.disabled = true;
    }

    function bcRoll() {
        if (bcState.rolling) return;
        bcState.rolling = true;
        if (DOM.bcPlaceBtn) DOM.bcPlaceBtn.disabled = true;

        const resDiv = DOM.bcDiceResult;
        let count = 0;
        const maxCount = 10;
        const interval = setInterval(() => {
            bcState.dice = [
                BAU_CUA_SYMBOLS[Math.floor(Math.random() * 6)],
                BAU_CUA_SYMBOLS[Math.floor(Math.random() * 6)],
                BAU_CUA_SYMBOLS[Math.floor(Math.random() * 6)]
            ];
            if (resDiv) resDiv.innerHTML = bcState.dice.map(s => `<span>${BAU_CUA_EMOJI[s]}</span>`).join('');
            count++;
            if (count >= maxCount) {
                clearInterval(interval);
                bcFinalize();
            }
        }, 100);
    }

    function bcFinalize() {
        bcState.dice = [
            BAU_CUA_SYMBOLS[Math.floor(Math.random() * 6)],
            BAU_CUA_SYMBOLS[Math.floor(Math.random() * 6)],
            BAU_CUA_SYMBOLS[Math.floor(Math.random() * 6)]
        ];
        if (DOM.bcDiceResult) {
            DOM.bcDiceResult.innerHTML = bcState.dice.map(s => `<span>${BAU_CUA_EMOJI[s]}</span>`).join('');
        }
        if (DOM.bcResultText) {
            DOM.bcResultText.textContent = 'KẾT QUẢ: ' + bcState.dice.map(s => BAU_CUA_EMOJI[s]).join(' ');
        }

        // Xử lý thắng thua
        if (bcState.betPlaced && Object.keys(bcState.bets).length > 0) {
            let totalWin = 0;
            const counts = {};
            bcState.dice.forEach(s => { counts[s] = (counts[s] || 0) + 1; });

            Object.keys(bcState.bets).forEach(sym => {
                const cnt = counts[sym] || 0;
                if (cnt === 1) totalWin += Math.floor(bcState.bets[sym] * 1.5);
                else if (cnt === 2) totalWin += Math.floor(bcState.bets[sym] * 2.5);
                else if (cnt === 3) totalWin += Math.floor(bcState.bets[sym] * 5);
            });

            if (totalWin > 0) {
                userBalance += totalWin;
                showToast(`🎉 THẮNG! +${totalWin.toLocaleString()} VNĐ`, 'success');
            } else {
                const totalLost = Object.values(bcState.bets).reduce((a, b) => a + b, 0);
                showToast(`😢 THUA! -${totalLost.toLocaleString()} VNĐ`, 'error');
            }
            updateBalanceDisplay();
            saveAll();
        }

        // Lưu lịch sử
        bcState.history.unshift({
            dice: [...bcState.dice],
            time: new Date().toLocaleTimeString('vi-VN')
        });
        if (bcState.history.length > MAX_HISTORY) bcState.history = bcState.history.slice(0, MAX_HISTORY);
        saveAll();
        renderBcHistory();
        addChatMessage('Hệ thống', `Bầu Cua: ${bcState.dice.map(s => BAU_CUA_EMOJI[s]).join(' ')}`, true);

        setTimeout(() => bcStartRound(), 3000);
    }

    function renderBcHistory() {
        if (!DOM.bcHistory) return;
        DOM.bcHistory.innerHTML = bcState.history.slice(0, 20).map(h => {
            return `<div style="display:flex;gap:3px;justify-content:center;">${h.dice.map(s => `<span style="font-size:22px;">${BAU_CUA_EMOJI[s]}</span>`).join('')}</div>`;
        }).join('');
    }

    // ==================== SLOT 777 ====================
    function slotSetAmount(amount) {
        if (!DOM.slotBetAmount) return;
        DOM.slotBetAmount.value = amount;
    }

    function spinSlot() {
        if (slotState.spinning) return;
        const amount = parseInt(DOM.slotBetAmount?.value);
        if (!amount || amount < 1000) {
            showToast('Số tiền cược tối thiểu 1,000 VNĐ!', 'error');
            return;
        }
        if (amount > userBalance) {
            showToast('Số dư không đủ!', 'error');
            return;
        }

        userBalance -= amount;
        slotState.spinning = true;
        updateBalanceDisplay();
        if (DOM.slotLever) DOM.slotLever.disabled = true;
        if (DOM.slotWinText) DOM.slotWinText.textContent = '';

        const r1 = DOM.slotReel1, r2 = DOM.slotReel2, r3 = DOM.slotReel3;
        if (r1) r1.classList.add('spinning');
        if (r2) r2.classList.add('spinning');
        if (r3) r3.classList.add('spinning');

        let count = 0;
        const maxCount = 15;
        const interval = setInterval(() => {
            slotState.reels = [
                SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
                SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
                SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
            ];
            if (r1) r1.textContent = slotState.reels[0];
            if (r2) r2.textContent = slotState.reels[1];
            if (r3) r3.textContent = slotState.reels[2];
            count++;
            if (count >= maxCount) {
                clearInterval(interval);
                if (r1) r1.classList.remove('spinning');
                if (r2) r2.classList.remove('spinning');
                if (r3) r3.classList.remove('spinning');
                slotFinalize(amount);
            }
        }, 80);
    }

    function slotFinalize(betAmount) {
        slotState.reels = [
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
        ];
        if (DOM.slotReel1) DOM.slotReel1.textContent = slotState.reels[0];
        if (DOM.slotReel2) DOM.slotReel2.textContent = slotState.reels[1];
        if (DOM.slotReel3) DOM.slotReel3.textContent = slotState.reels[2];

        let winAmount = 0;
        let message = '';

        const [a, b, c] = slotState.reels;
        if (a === b && b === c) {
            // 3 giống nhau
            const multiplier = SLOT_PAYOUT[a] || 1;
            winAmount = betAmount * multiplier;
            message = a === '7️⃣' ? '🎰🎰🎰 JACKPOT!!! x100' : `🎉 TRÚNG LỚN! x${multiplier}`;
        } else if (a === b || b === c || a === c) {
            // 2 giống nhau
            winAmount = Math.floor(betAmount * 1.5);
            message = '🎉 2 GIỐNG NHAU! x1.5';
        } else {
            message = '😢 CHÚC MAY MẮN LẦN SAU';
        }

        if (winAmount > 0) {
            userBalance += winAmount;
            showToast(`${message} +${winAmount.toLocaleString()} VNĐ`, 'success');
        } else {
            showToast(message, 'error');
        }

        if (DOM.slotWinText) DOM.slotWinText.textContent = message;
        updateBalanceDisplay();
        saveAll();

        // Lưu lịch sử
        slotState.history.unshift({
            reels: [...slotState.reels],
            win: winAmount,
            bet: betAmount,
            time: new Date().toLocaleTimeString('vi-VN')
        });
        if (slotState.history.length > MAX_SLOT_HISTORY) slotState.history = slotState.history.slice(0, MAX_SLOT_HISTORY);
        saveAll();
        renderSlotHistory();

        slotState.spinning = false;
        if (DOM.slotLever) DOM.slotLever.disabled = false;
    }

    function renderSlotHistory() {
        if (!DOM.slotHistory) return;
        DOM.slotHistory.innerHTML = slotState.history.slice(0, 15).map(h => {
            const color = h.win > 0 ? '#2ecc71' : '#e74c3c';
            const text = h.win > 0 ? `+${h.win.toLocaleString()}` : 'Thua';
            return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:5px 0;border-bottom:1px solid #222;">
                <span>${h.reels.join(' ')}</span>
                <span style="color:${color};font-weight:700;">${text}</span>
                <span style="color:#666;font-size:10px;">${h.time}</span>
            </div>`;
        }).join('');
    }

    // ==================== TAB SWITCHING ====================
    function switchTab(tab, element) {
        activeTab = tab;
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

        const tabContent = document.getElementById('tab-' + tab);
        if (tabContent) tabContent.classList.add('active');
        if (element) element.classList.add('active');
    }

    // ==================== EVENT BINDING ====================
    function bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tab = this.getAttribute('data-tab');
                switchTab(tab, this);
            });
        });

        // Chat
        if (DOM.chatInput) {
            DOM.chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') sendChat();
            });
        }

        // Modal overlay click to close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) this.classList.remove('active');
            });
        });

        // Escape to close modals
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeAllModals();
        });

        // Bầu Cua bet grid - gán sự kiện động
        if (DOM.bcBetGrid) {
            DOM.bcBetGrid.addEventListener('click', function(e) {
                const item = e.target.closest('.baucua-item');
                if (!item || bcState.rolling) return;
                const symbol = item.getAttribute('data-symbol');
                if (symbol) bcToggleBet(symbol, item);
            });
        }

        // Tài Xỉu bet options
        if (DOM.txBetTai) DOM.txBetTai.addEventListener('click', () => txSelectBet('tai'));
        if (DOM.txBetXiu) DOM.txBetXiu.addEventListener('click', () => txSelectBet('xiu'));

        // Place bet buttons
        if (DOM.txPlaceBtn) DOM.txPlaceBtn.addEventListener('click', txPlaceBet);
        if (DOM.bcPlaceBtn) DOM.bcPlaceBtn.addEventListener('click', bcPlaceBet);
        if (DOM.slotLever) DOM.slotLever.addEventListener('click', spinSlot);

        // Enter key cho bet amount inputs
        if (DOM.txBetAmount) {
            DOM.txBetAmount.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') txPlaceBet();
            });
        }
        if (DOM.bcBetAmount) {
            DOM.bcBetAmount.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') bcPlaceBet();
            });
        }
        if (DOM.slotBetAmount) {
            DOM.slotBetAmount.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') spinSlot();
            });
        }
    }

    // ==================== GLOBAL FUNCTION EXPOSURE ====================
    function exposeGlobalFunctions() {
        window._deposit = () => openModal('depositModal');
        window._withdraw = () => openModal('withdrawModal');
        window._logout = logout;
        window._openLogin = () => openModal('loginModal');
        window._openRegister = () => openModal('registerModal');
        window._txSetAmount = txSetAmount;
        window._bcSetAmount = bcSetAmount;
        window._slotSetAmount = slotSetAmount;
        window._switchTab = switchTab;
    }

    // ==================== INIT ====================
    function init() {
        cacheDOM();
        loadAll();
        updateAllUI();
        bindEvents();
        exposeGlobalFunctions();
        txStartRound();
        bcStartRound();
        renderTxHistory();
        renderBcHistory();
        renderSlotHistory();

        // Welcome chat messages
        addChatMessage('Hệ thống', '🏆 Chào mừng đến với XOC88.CC - Tài Xỉu, Bầu Cua, Nổ Hũ 777!', true);
        addChatMessage('Hệ thống', '🎁 Đăng ký nhận ngay 100K miễn phí!', true);

        console.log('%c🎲 XOC88.CC %cScript.js loaded!',
            'color: #f0c040; font-size: 18px; font-weight: bold;',
            'color: #fff;');
        console.log('%cGames: %cTài Xỉu | Bầu Cua | Slot 777 %c| %cBalance: %c' + userBalance.toLocaleString() + ' VNĐ',
            'color: #999;', 'color: #fff;', 'color: #999;', 'color: #999;', 'color: #f0c040;');
    }

    // Khởi động khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
```